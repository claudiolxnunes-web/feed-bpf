#!/bin/bash
# /opt/feed-bpf/verificacao.sh
# Varredura de integridade pre-implantacao do Feed_BPF.
# Somente leitura: nao altera nada, nao reinicia nada.

REPO=/opt/feed-bpf
DIST=/opt/bpfsuite/dist
DOMINIO=https://bpfsuite.bpfconsult.com.br
SUPA_ESPERADO=xgvapaebustyotrwnzqa

ok()    { echo "  [OK]    $1"; }
falha() { echo "  [FALHA] $1"; FALHAS=$((FALHAS+1)); }
aviso() { echo "  [AVISO] $1"; }

FALHAS=0
echo
echo "=== VERIFICACAO FEED_BPF — $(date '+%d/%m/%Y %H:%M') ==="

# 1. Repositorio -------------------------------------------------------------
echo
echo "1. Repositorio"
cd "$REPO" 2>/dev/null || { echo "  [FALHA] $REPO nao existe"; exit 1; }

SUJO=$(git status --porcelain | wc -l)
[ "$SUJO" -eq 0 ] && ok "arvore limpa" || aviso "$SUJO arquivo(s) nao commitado(s)"

git fetch -q origin 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTO=$(git rev-parse @{u} 2>/dev/null)
[ "$LOCAL" = "$REMOTO" ] && ok "sincronizado com origin ($(git rev-parse --short HEAD))" \
                         || falha "divergente de origin — local $(git rev-parse --short HEAD)"

BAKS=$(find src -name "*.bak" 2>/dev/null | wc -l)
[ "$BAKS" -eq 0 ] && ok "sem arquivos .bak em src/" || aviso "$BAKS arquivo(s) .bak em src/"

# 2. Build publicado ---------------------------------------------------------
echo
echo "2. Build publicado"
[ -f "$DIST/index.html" ] || falha "$DIST/index.html nao existe"

DATA_DIST=$(stat -c %Y "$DIST/index.html" 2>/dev/null || echo 0)
DATA_COMMIT=$(git log -1 --format=%ct)
if [ "$DATA_DIST" -ge "$DATA_COMMIT" ]; then
  ok "dist mais recente que o ultimo commit"
else
  falha "dist DESATUALIZADO — build anterior ao commit $(git rev-parse --short HEAD)"
fi
echo "         dist:   $(date -d @$DATA_DIST '+%d/%m %H:%M')"
echo "         commit: $(date -d @$DATA_COMMIT '+%d/%m %H:%M')"

NASSETS=$(ls "$DIST"/assets/*.js 2>/dev/null | wc -l)
[ "$NASSETS" -gt 0 ] && ok "$NASSETS bundles em assets/" || falha "nenhum bundle .js em assets/"

# 3. Corte do Lovable --------------------------------------------------------
echo
echo "3. Corte do Lovable"
LOV_DIST=$(grep -rlo "lovable\.dev\|cloud-auth" "$DIST"/assets/*.js 2>/dev/null | wc -l)
[ "$LOV_DIST" -eq 0 ] && ok "nenhuma referencia a lovable no bundle publicado" \
                      || falha "$LOV_DIST bundle(s) com 'lovable' — rodar: grep -rl lovable $DIST/assets/*.js"

LOV_SRC=$(grep -rli "lovable" src/ 2>/dev/null | wc -l)
[ "$LOV_SRC" -eq 0 ] && ok "nenhuma referencia a lovable em src/" \
                     || aviso "$LOV_SRC arquivo(s) em src/ mencionam lovable (pode ser comentario)"

# 4. Backend Supabase --------------------------------------------------------
echo
echo "4. Backend Supabase"
REFS=$(grep -oh "[a-z]\{20\}\.supabase\.co" "$DIST"/assets/*.js 2>/dev/null | sort -u)
NREFS=$(echo "$REFS" | grep -c . )
if [ "$NREFS" -eq 1 ]; then
  ok "backend unico: $REFS"
  echo "$REFS" | grep -q "$SUPA_ESPERADO" || falha "backend NAO e o esperado ($SUPA_ESPERADO)"
elif [ "$NREFS" -eq 0 ]; then
  aviso "nenhuma URL supabase encontrada no bundle (pode estar minificada)"
else
  falha "MULTIPLOS backends no bundle:"
  echo "$REFS" | sed 's/^/           /'
fi

# 5. Edge Functions ----------------------------------------------------------
echo
echo "5. Edge Functions"
NFUNC=$(ls -d supabase/functions/*/ 2>/dev/null | wc -l)
[ "$NFUNC" -gt 0 ] && ok "$NFUNC funcoes no repositorio" || aviso "nenhuma funcao em supabase/functions/"

NMIG=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
echo "         migrations no repo: $NMIG (ultima: $(ls supabase/migrations/*.sql 2>/dev/null | tail -1 | xargs -r basename | cut -c1-8))"

# 6. Ambiente ----------------------------------------------------------------
echo
echo "6. Ambiente (.env)"
if [ -f .env ]; then
  DUP=$(cut -d= -f1 .env | grep -v '^#' | grep -v '^$' | sort | uniq -d)
  [ -z "$DUP" ] && ok "sem variaveis duplicadas" \
                || falha "variaveis duplicadas: $(echo $DUP | tr '\n' ' ')"

  ANON=$(grep -m1 "VITE_SUPABASE_PUBLISHABLE_KEY\|VITE_SUPABASE_ANON_KEY" .env | cut -d= -f2)
  if echo "$ANON" | grep -q "^eyJ"; then
    ROLE=$(echo "$ANON" | cut -d. -f2 | base64 -d 2>/dev/null | grep -o '"role":"[a-z_]*"')
    echo "$ROLE" | grep -q "service_role" && falha "CHAVE PUBLICA CONTEM service_role — $ROLE" \
                                          || ok "chave publica com role correto ($ROLE)"
  else
    ok "chave publica em formato novo (sb_publishable)"
  fi

  PERM=$(stat -c %a .env)
  [ "$PERM" = "600" ] && ok ".env com permissao 600" || aviso ".env com permissao $PERM (ideal 600)"
else
  falha ".env nao encontrado em $REPO"
fi

# 7. Servico no ar -----------------------------------------------------------
echo
echo "7. Servico"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -m 15 "$DOMINIO")
[ "$CODE" = "200" ] && ok "$DOMINIO responde 200" || falha "$DOMINIO respondeu $CODE"

for c in bpfsuite traefik; do
  docker ps --format '{{.Names}}' | grep -qx "$c" && ok "container '$c' rodando" \
                                                  || falha "container '$c' NAO esta rodando"
done

# Resumo ---------------------------------------------------------------------
echo
echo "=== RESUMO ==="
if [ "$FALHAS" -eq 0 ]; then
  echo "  Nenhuma falha. Avisos acima, se houver, sao informativos."
else
  echo "  $FALHAS falha(s) encontrada(s) — revisar antes de implantar."
fi
echo
exit $FALHAS
