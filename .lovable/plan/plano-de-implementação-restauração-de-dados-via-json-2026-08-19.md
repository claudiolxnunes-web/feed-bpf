# Plano de Implementação: Restauração de Dados via JSON

Implementação de um sistema de restauração para permitir que o usuário recupere dados a partir do arquivo JSON exportado, garantindo a integridade dos registros e a continuidade operacional conforme o Decreto 12.031/2024.

## Alterações Propostas

### 1. Backend (Edge Function)
- Atualizar a Edge Function `backup-manager` para suportar o método `POST` com uma ação de restauração (`restore`).
- Implementar lógica para iterar sobre as tabelas fornecidas no JSON (`documentos_bpf`, `modelos_empresa`, `registros_customizados`).
- Utilizar `upsert` para inserir ou atualizar registros baseados no ID, garantindo que o `empresa_id` do registro corresponda ao ID da empresa ativa para evitar vazamento de dados.

### 2. Frontend (ConfigCustom.tsx)
- Adicionar um novo botão "Importar Dados (JSON)" na seção de Backup.
- Implementar um input de arquivo oculto para capturar o arquivo JSON.
- Adicionar um estado de carregamento para a importação.
- Implementar a função `handleImportData` que lê o arquivo, valida o formato e envia para a Edge Function.
- Adicionar confirmação visual (toast) de sucesso ou erro.

## Detalhes Técnicos
- O processamento será feito via Edge Function para garantir que as permissões de banco de dados e a integridade referencial sejam respeitadas através da `service_role` (usada com cautela e filtragem estrita por `empresa_id`).
- Validação de segurança: A função verificará se o `user_id` da sessão tem permissão para a `empresa_id` alvo antes de processar qualquer dado.

## Próximos Passos
- Modificar `supabase/functions/backup-manager/index.ts` para incluir a lógica de `restore`.
- Atualizar `src/pages/feedbpfcustom/ConfigCustom.tsx` com a interface de importação.
