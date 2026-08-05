#!/bin/bash
set -e
cd /opt/feed-bpf
npm run build
rsync -a --delete --exclude='gerador-rotulos' dist/ /opt/bpfsuite/dist/
echo "✅ PUBLICADO: $(date)"
