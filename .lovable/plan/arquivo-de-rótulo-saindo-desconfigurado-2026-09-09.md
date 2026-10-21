# Arquivo de rótulo saindo desconfigurado

## O que está acontecendo

O arquivo do print ("RAÇÃO HGM CODORNAS POSTURA (2).cdr") é um arquivo de arte do CorelDRAW. O Word não sabe abrir esse tipo de arquivo — por isso ele mostra a janela de "Conversão de arquivo" com símbolos ilegíveis. Não é o arquivo que está corrompido: é o programa errado abrindo.

Isso acontece porque o sistema entrega o arquivo do jeito que ele foi guardado, sem avisar qual programa abre cada tipo, e o Windows acaba escolhendo o Word sozinho.

Além disso, ao revisar o gerador de rótulo em Word do próprio sistema, encontrei um erro de configuração de página: o rótulo é montado para sair deitado (paisagem), mas as medidas estão invertidas, o que faz a página sair em pé e o conteúdo ultrapassar as margens.

## O que vou fazer

1. **Avisar antes de baixar**: quando o arquivo for de arte (.cdr, .ai, .psd, .eps), a tela mostra um aviso curto — "arquivo de arte, abra no CorelDRAW/Illustrator, não no Word" — e um ícone diferente na lista, para não haver confusão.
2. **Baixar com o nome e o tipo certos**: o download passa a enviar a extensão e o tipo de arquivo corretos, para o Windows sugerir o programa adequado em vez do Word.
3. **Corrigir o rótulo em Word gerado pelo sistema**: acertar a orientação da página (deitada), as larguras das tabelas e as margens, para o rótulo abrir alinhado e caber na folha.
4. **Conferir o resultado**: gerar um rótulo de teste e verificar o arquivo antes de te devolver.

## Detalhes técnicos

- `src/utils/rotuloDocxExport.ts`: em landscape, o docx-js espera as medidas de retrato (`width: 12240`, `height: 15840`) e faz a troca internamente. Hoje está `width: 15840 / height: 12240`, o que resulta em dupla inversão. Ajustar também `columnWidths`/larguras das células (hoje somando 14400 DXA) para a largura útil real (15840 − margens de 360 = 15120).
- Downloads de anexos: incluir `download` com o nome original completo e o `content-type` correto (via `createSignedUrl` com `download: filename`), evitando que o navegador entregue um arquivo sem extensão.
- Aviso de tipo de arquivo: pequeno helper de classificação por extensão usado na listagem de anexos/modelos, sem alterar regras de negócio.
