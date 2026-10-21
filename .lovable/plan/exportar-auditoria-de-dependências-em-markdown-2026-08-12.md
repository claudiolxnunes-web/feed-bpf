# Exportar auditoria de dependências em Markdown

Gerar um documento `.md` baixável com o levantamento já feito (tabelas, functions, buckets e policies exclusivas do Feed_BPF vs. compartilhadas com CRM/leads/licenças, site e pagamentos).

## O que será entregue

Arquivo `auditoria_dependencias_feedbpf.md` disponível para download/preview no chat, contendo:

1. **Escopo e data** do levantamento
2. **Exclusivo Feed_BPF** — tabelas de produção/fábrica, functions de banco, edge functions e buckets
3. **Compartilhado** — identidade/licenciamento, CRM/marketing, pagamentos, infraestrutura (audit_log, erros, WhatsApp, e-mail)
4. **Dependências cruzadas** — gate de licença, alertas de NC via WhatsApp, logs globais, webhook do Google Forms com bypass por token
5. **Observações de risco** para eventual separação de produtos

## Detalhes técnicos

- O arquivo é gerado como artefato em `/mnt/documents`, sem alterar código do projeto nem o banco.
- Nenhuma migração, policy ou edge function será criada ou modificada.
- Se depois quiser, posso adicionar uma seção extra com o plano de separação (o que migraria vs. o que ficaria como serviço compartilhado).
