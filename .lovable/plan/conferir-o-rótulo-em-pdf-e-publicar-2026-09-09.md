# Conferir o rótulo em PDF e publicar

## O que será feito

1. **Teste com um rótulo real**: abrir o editor de rótulos com um produto já cadastrado, gerar o PDF e o Word, e conferir o arquivo página a página.
2. **Checagem visual do PDF**: tamanho correto (a mesma largura e altura em mm do rótulo), texto sem cortes nas bordas, tabelas alinhadas, acentos corretos e nada sobreposto.
3. **Correções, se aparecerem**: ajustar margens, quebras de linha ou proporção do conteúdo e gerar de novo até um arquivo sair limpo.
4. **Publicar**: só depois de você aprovar o resultado do teste. Se preferir, publico junto no mesmo passo.

## O que você recebe

- Uma imagem do PDF gerado para conferência.
- Lista curta do que estava errado e como foi corrigido (ou a confirmação de que saiu certo de primeira).

## Detalhes técnicos

- Teste via Playwright na prévia local: abrir o produto, aba "Rótulo IN 22", acionar "Exportar PDF" e capturar o download.
- Conferência do arquivo com `pdftoppm -jpeg -r 150` e inspeção das imagens (sem usar o navegador para o QA do arquivo).
- Pontos de atenção em `src/utils/rotuloPdfExport.ts`: proporção `canvas.height/canvas.width` pode cortar conteúdo mais alto que a página — se ocorrer, paginar ou reduzir escala.
- Publicação com `preview_ui--publish` após aprovação, precedida de verificação do scan de segurança.
