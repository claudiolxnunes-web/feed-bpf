#!/bin/bash
#
# Publica o build de /opt/feed-bpf/dist em /opt/bpfsuite/dist (servido pelo
# container nginx `bpfsuite`, bind mount ./dist:/usr/share/nginx/html:ro).
#
# Por que nao e um rsync unico: o rsync copia arquivo a arquivo. Se ele falhar
# no meio (foi o que aconteceu em 2026-08-21, permissao no destino), o
# index.html novo ja esta publicado apontando para assets que ainda nao foram
# copiados -- o site serve tela branca. A publicacao aqui e ordenada:
#
#   1. assets novos primeiro, SEM --delete  (nomes tem hash, nao colidem com os
#      antigos; o site continua servindo a versao velha, intacta)
#   2. os .html por ultimo                  (rsync troca cada arquivo via
#      rename atomico, entao o corte para a versao nova e instantaneo)
#   3. limpeza dos orfaos, COM --delete     (ja com a versao nova no ar)
#
# Em nenhum momento existe um index.html publicado referenciando asset ausente.
#
# Uso:
#   bash deploy.sh              publica
#   bash deploy.sh --dry-run    roda todas as verificacoes, nao escreve nada
#   bash deploy.sh --no-build   publica o dist atual, sem rebuildar

set -euo pipefail

SRC="/opt/feed-bpf/dist"
DEST="/opt/bpfsuite/dist"
# Snapshot fica sob /opt/feed-bpf porque /opt/bpfsuite e root:root e nao e
# gravavel por quem roda o deploy. Mesmo filesystem, entao o cp -al (hardlinks)
# continua barato. Fora de $DEST de proposito: dentro, o nginx serviria a
# versao anterior publicamente e o --delete da fase 3 a apagaria.
PREV="/opt/feed-bpf/.deploy-prev"
EXCLUDE="gerador-rotulos"
HEALTH_URL="https://bpfsuite.bpfconsult.com.br/"

DRY_RUN=0
DO_BUILD=1
for arg in "$@"; do
  case "$arg" in
    --dry-run)  DRY_RUN=1 ;;
    --no-build) DO_BUILD=0 ;;
    *) echo "argumento desconhecido: $arg" >&2; exit 2 ;;
  esac
done

log()  { echo "[deploy] $*"; }
fail() { echo "[deploy] ERRO: $*" >&2; exit 1; }

cd /opt/feed-bpf

# ---------------------------------------------------------------- pre-flight
# Tudo que pode dar errado e checado ANTES de tocar no destino.

log "verificando permissoes de escrita em $DEST"
[ -d "$DEST" ] || fail "destino $DEST nao existe"
probe="$DEST/.deploy-probe.$$"
touch "$probe" 2>/dev/null || fail "sem permissao de escrita em $DEST (rode: chown -R $(id -un):$(id -gn) $DEST)"
rm -f "$probe"

# Um unico arquivo root em subdiretorio ja faz o rsync falhar no meio.
alheios=$(find "$DEST" ! -user "$(id -un)" 2>/dev/null | head -5)
if [ -n "$alheios" ]; then
  echo "$alheios" >&2
  fail "ha arquivos de outro dono em $DEST (rode: chown -R $(id -un):$(id -gn) $DEST)"
fi

if [ "$DO_BUILD" -eq 1 ]; then
  # O vite limpa o outDir antes de buildar; arquivo root ali aborta com EACCES.
  alheios_src=$(find "$SRC" ! -user "$(id -un)" 2>/dev/null | head -5 || true)
  if [ -n "$alheios_src" ]; then
    echo "$alheios_src" >&2
    fail "ha arquivos de outro dono em $SRC (rode: chown -R $(id -un):$(id -gn) $SRC)"
  fi
  log "buildando"
  npm run build
else
  log "--no-build: publicando o dist atual"
fi

# ------------------------------------------------------- integridade do build
[ -f "$SRC/index.html" ] || fail "$SRC/index.html nao existe -- build falhou?"

log "conferindo se todo asset referenciado no index.html existe"
faltando=0
while read -r asset; do
  [ -n "$asset" ] || continue
  if [ ! -f "$SRC/$asset" ]; then
    echo "  FALTA: $asset" >&2
    faltando=$((faltando + 1))
  fi
done < <(grep -oE 'assets/[A-Za-z0-9_.-]+\.(js|css)' "$SRC/index.html" | sort -u)
[ "$faltando" -eq 0 ] || fail "$faltando asset(s) referenciados nao existem no build"

# Regressao ja vista neste repo: .env.local do Vite vaza localhost no bundle.
if grep -rqs "localhost:8000" "$SRC/assets/" 2>/dev/null; then
  fail "bundle contem localhost:8000 -- .env errado no build"
fi

log "build ok: $(find "$SRC" -type f | wc -l) arquivos"

if [ "$DRY_RUN" -eq 1 ]; then
  log "--dry-run: verificacoes passaram, nada foi publicado"
  exit 0
fi

# ------------------------------------------------------------------ snapshot
# Hardlinks: custa quase nada em disco e permite rollback imediato.
log "snapshot da versao atual em $PREV"
rm -rf "$PREV.tmp"
cp -al "$DEST" "$PREV.tmp" 2>/dev/null || cp -a "$DEST" "$PREV.tmp" \
  || fail "nao consegui criar o snapshot em $PREV.tmp (sem ele nao ha rollback; abortando antes de publicar)"
rm -rf "$PREV"
mv "$PREV.tmp" "$PREV"

rollback() {
  log "ROLLBACK: restaurando versao anterior"
  # -I pelo mesmo motivo da fase 2: o rollback nao pode confiar em mtime.
  rsync -aI --delete --exclude="$EXCLUDE" "$PREV/" "$DEST/" \
    && log "rollback concluido" \
    || echo "[deploy] ATENCAO: rollback falhou, $DEST pode estar inconsistente" >&2
}

# ----------------------------------------------------------------- publicacao
log "fase 1/3: assets novos (sem --delete, versao antiga segue no ar)"
rsync -a --exclude="$EXCLUDE" --exclude='*.html' "$SRC/" "$DEST/" \
  || { rollback; fail "fase 1 falhou"; }

log "fase 2/3: HTMLs (corte atomico para a versao nova)"
# -I (--ignore-times): sem isso o rsync pula arquivo com mesmo tamanho E mesmo
# mtime -- dois index.html de builds diferentes podem bater nos dois criterios e
# o corte para a versao nova seria silenciosamente ignorado. Sao poucos arquivos
# pequenos, copiar sempre nao custa nada.
rsync -aI --exclude="$EXCLUDE" --include='*/' --include='*.html' --exclude='*' "$SRC/" "$DEST/" \
  || { rollback; fail "fase 2 falhou"; }

log "fase 3/3: removendo orfaos da versao anterior"
rsync -a --delete --exclude="$EXCLUDE" "$SRC/" "$DEST/" \
  || { rollback; fail "fase 3 falhou"; }

# ---------------------------------------------------------------- healthcheck
log "healthcheck em $HEALTH_URL"
bundle=$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' "$DEST/index.html" | head -1 || true)

http_ok() {
  local code
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "$1" || echo 000)
  [ "$code" = "200" ] || { echo "[deploy] $1 -> HTTP $code" >&2; return 1; }
  echo "[deploy] $1 -> HTTP 200"
}

ok=1
http_ok "$HEALTH_URL" || ok=0
[ -n "$bundle" ] && { http_ok "${HEALTH_URL}${bundle}" || ok=0; }

if [ "$ok" -ne 1 ]; then
  rollback
  fail "healthcheck falhou -- rollback executado, verifique antes de tentar de novo"
fi

log "PUBLICADO: $(date '+%Y-%m-%d %H:%M:%S')  (versao anterior em $PREV)"
