#!/bin/bash
#
# Testes do deploy.sh, em sandbox. Nao toca em producao: monta uma copia do
# deploy.sh com SRC/DEST/PREV apontando para um diretorio temporario, e com o
# build e o healthcheck neutralizados.
#
# Rode antes de mexer no deploy.sh:
#     bash deploy.test.sh
#
# Sai 0 se todos os checks passarem, 1 caso contrario.
#
# Os dois bugs que estes testes pegaram na primeira versao do deploy.sh:
#   - rsync pula arquivo com mesmo tamanho E mesmo mtime, entao o rollback
#     restaurava os assets mas deixava o index.html novo (dai o -I)
#   - o snapshot nao cabia em /opt/bpfsuite, que e root:root

set -uo pipefail

REAL_DEPLOY="$(cd "$(dirname "$0")" && pwd)/deploy.sh"
[ -f "$REAL_DEPLOY" ] || { echo "deploy.sh nao encontrado ao lado deste script" >&2; exit 2; }

T="$(mktemp -d)"
trap 'rm -rf "$T"' EXIT

falhas=0
check() { # descricao, condicao
  if eval "$2"; then
    echo "  ok    $1"
  else
    echo "  FALHA $1"
    falhas=$((falhas + 1))
  fi
}

# Copia do deploy.sh com paths de sandbox; build vira no-op e o healthcheck
# passa a obedecer FORCE_HEALTH (0 = saudavel, 1 = derrubado).
sed -e "s#^SRC=.*#SRC=\"$T/src\"#" \
    -e "s#^DEST=.*#DEST=\"$T/dest\"#" \
    -e "s#^PREV=.*#PREV=\"$T/prev\"#" \
    -e "s#^HEALTH_URL=.*#HEALTH_URL=\"file://$T/\"#" \
    -e "s#^cd /opt/feed-bpf#cd \"$T\"#" \
    "$REAL_DEPLOY" > "$T/d.sh"
sed -i -e 's#^  npm run build#  true#' \
       -e 's#^http_ok() {#http_ok() { return ${FORCE_HEALTH:-0};#' "$T/d.sh"
bash -n "$T/d.sh" || { echo "deploy.sh tem erro de sintaxe" >&2; exit 1; }

reset_env() {
  rm -rf "$T/src" "$T/dest" "$T/prev"
  mkdir -p "$T/src/assets" "$T/dest/assets" "$T/dest/gerador-rotulos"
  # versao publicada ("antiga")
  echo "ANTIGO" > "$T/dest/assets/index-OLD.js"
  echo '<html><script src="assets/index-OLD.js"></script></html>' > "$T/dest/index.html"
  echo "conteudo mantido fora do rsync" > "$T/dest/gerador-rotulos/keep.txt"
  # build novo
  echo "NOVO" > "$T/src/assets/index-NEW.js"
  echo '<html><script src="assets/index-NEW.js"></script></html>' > "$T/src/index.html"
}

echo "== A: publicacao normal =="
reset_env
out=$(bash "$T/d.sh" --no-build 2>&1); rc=$?
check "exit 0"                        "[ $rc -eq 0 ]"
check "html aponta para o build novo" "grep -q index-NEW '$T/dest/index.html'"
check "asset novo publicado"          "[ -f '$T/dest/assets/index-NEW.js' ]"
check "orfao da versao antiga removido" "[ ! -f '$T/dest/assets/index-OLD.js' ]"
check "gerador-rotulos preservado"    "[ -f '$T/dest/gerador-rotulos/keep.txt' ]"
check "snapshot criado"               "[ -d '$T/prev' ]"

echo "== B: destino sem permissao de escrita =="
reset_env
chmod 555 "$T/dest"
out=$(bash "$T/d.sh" --no-build 2>&1); rc=$?
chmod 755 "$T/dest"
check "aborta"                        "[ $rc -ne 0 ]"
check "nao chega a publicar"          "! grep -q 'fase 1' <<< \"\$out\""
check "destino intacto"               "grep -q index-OLD '$T/dest/index.html'"

echo "== C: build com asset referenciado faltando =="
reset_env
rm "$T/src/assets/index-NEW.js"
out=$(bash "$T/d.sh" --no-build 2>&1); rc=$?
check "aborta"                        "[ $rc -ne 0 ]"
check "aponta qual asset falta"       "grep -q 'FALTA' <<< \"\$out\""
check "nao chega a publicar"          "! grep -q 'fase 1' <<< \"\$out\""
check "destino intacto"               "grep -q index-OLD '$T/dest/index.html'"

echo "== D: healthcheck falha -> rollback =="
reset_env
out=$(FORCE_HEALTH=1 bash "$T/d.sh" --no-build 2>&1); rc=$?
check "aborta"                        "[ $rc -ne 0 ]"
check "executou rollback"             "grep -qi 'rollback concluido' <<< \"\$out\""
check "html voltou para o antigo"     "grep -q index-OLD '$T/dest/index.html'"
check "asset antigo restaurado"       "[ -f '$T/dest/assets/index-OLD.js' ]"
check "asset novo removido"           "[ ! -f '$T/dest/assets/index-NEW.js' ]"
check "gerador-rotulos preservado"    "[ -f '$T/dest/gerador-rotulos/keep.txt' ]"

echo "== E: --dry-run nao escreve =="
reset_env
out=$(bash "$T/d.sh" --no-build --dry-run 2>&1); rc=$?
check "exit 0"                        "[ $rc -eq 0 ]"
check "nao publicou"                  "grep -q index-OLD '$T/dest/index.html'"
check "nao criou snapshot"            "[ ! -d '$T/prev' ]"

echo
if [ "$falhas" -eq 0 ]; then
  echo "todos os checks passaram"
  exit 0
fi
echo "$falhas check(s) falharam"
exit 1
