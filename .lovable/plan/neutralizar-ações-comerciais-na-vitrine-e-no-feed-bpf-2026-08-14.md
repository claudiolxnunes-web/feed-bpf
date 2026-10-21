# Neutralizar ações comerciais na vitrine e no Feed_BPF

## Situação atual verificada
- As páginas NutriCRM, Agro RC, Nutri_Agro Labels e Planos Audits_BPF já exibem "Em breve" e abrem o WhatsApp.
- A vitrine pública (tela inicial que você está vendo) não foi alterada: os cards ainda mostram preço/trial e levam para as landings.
- A landing do Feed_BPF não tem botão de compra — os três planos (Standard, Intermediária, Premium) usam o botão "Testar grátis 7 dias", que leva ao cadastro, e não ao checkout.
- A landing do Feed_BPF Custom também usa apenas "Testar grátis 7 dias" e cadastro.

## Alterações propostas
1. **Vitrine pública**: trocar o botão comercial de cada card por **"Em breve"**, abrindo `https://wa.me/5562996075522` em nova aba, sem disparar a navegação do card.
2. **Feed_BPF (landing)**: nos três cards de planos, substituir "Testar grátis 7 dias" por **"Em breve"** com a mesma ação de WhatsApp.
3. **Feed_BPF Custom (landing)**: mesmo tratamento no botão do bloco de preço (R$ 497) e no CTA final de contratação.
4. **Audits_BPF (landing)**: o botão que leva à página de planos passa a exibir "Em breve" com a ação de WhatsApp.
5. Preços, descrições, textos institucionais e os links de Termos, Privacidade e Reembolso permanecem inalterados.

## Ponto a confirmar
Os botões de **login** ("Já é cadastrado? Acesse o Sistema") continuam funcionando normalmente. Se você quiser manter também o trial gratuito ativo em algum produto, basta indicar qual.

## Verificação
- Abrir a vitrine e as landings no preview e conferir os rótulos "Em breve".
- Clicar em um botão e confirmar a abertura do WhatsApp em nova aba.

## Detalhes técnicos
- Arquivos: `src/pages/Vitrine.tsx`, `src/pages/FeedBPFPage.tsx`, `src/pages/FeedBpfCustomLanding.tsx`, `src/pages/AuditsBPFPage.tsx`.
- Nos cards da vitrine o clique é tratado no contêiner (`Vitrine.tsx:247-259`), então o novo botão precisa parar a propagação do evento.
