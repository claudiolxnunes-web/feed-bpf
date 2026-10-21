# Plano de Implementação: Central de Backup e Proteção de Dados

Este plano descreve a implementação de um sistema de backup centralizado para o **Feed_BPF Custom**, permitindo que os usuários exportem seus dados e arquivos para garantir a segurança e conformidade com o Decreto 12.031/2024.

## Objetivos
- Implementar uma interface centralizada de backup em "Configurações".
- Oferecer exportação de dados em massa (JSON/Excel).
- Facilitar o download integral do acervo de arquivos.

## Etapas de Implementação

### 1. Backend (Edge Functions)
- [x] Criar a Edge Function `backup-manager` para exportar dados das tabelas `documentos_bpf`, `modelos_empresa` e `registros_customizados`.
- [ ] Implementar a exportação de arquivos através da Edge Function `export-storage` já existente ou adaptada.

### 2. Interface (Frontend)
- [ ] **ConfigCustom.tsx**: Adicionar uma nova seção "Backup e Proteção de Dados" com botões para:
    - Exportar dados (JSON/XLSX).
    - Solicitar backup integral de arquivos.
- [ ] **DocumentosBPF.tsx**: Adicionar um botão de "Exportar Tudo" na aba de Arquivo Livre.
- [ ] **FeedBpfCustomSidebar.tsx**: Opcional - Adicionar ícone de "Backup" se for considerado uma funcionalidade crítica de nível superior.

### 3. Integração e UX
- Adicionar notificações de progresso (toast) durante a geração do backup.
- Garantir que apenas usuários autenticados e vinculados à empresa possam realizar o backup (RLS).

## Detalhes Técnicos
- Utilização de `supabase.functions.invoke` para chamar o `backup-manager`.
- Geração dinâmica de arquivo JSON/Excel no lado do cliente a partir do retorno da função.
- Link direto para a Edge Function de exportação de storage com token de segurança.
