# Plano de Implementação: Correção de Bloqueadores de Auditoria (Decreto 12.031/2024)

Este plano visa corrigir as falhas de auditoria identificadas, garantindo a conformidade com o Decreto 12.031/2024 no sistema de trilha de auditoria e restauração de backups.

## Alterações Técnicas

### 1. Migração de Banco de Dados (Triggers de Auditoria)
- Criar uma nova migração SQL para ativar o gatilho `process_audit_log` nas tabelas `modelos_empresa` e `registros_customizados`.
- A migração será idempotente, verificando a existência do gatilho antes de criá-lo.
- Nome do trigger seguirá o padrão `trg_audit_<nome_tabela>`.

### 2. Edge Function `backup-manager` (Rastro de Autoria)
- Modificar a Edge Function para registrar manualmente a ação de restauração na tabela `audit_log`.
- Capturar o `user.id` do JWT do usuário autenticado antes de realizar as operações com `service_role`.
- Gravar os campos: `tabela` ('system_backup'), `registro_id` (empresa_id), `operacao` ('restore_backup'), `usuario_id` (ID do usuário) e `dados_novos` (metadados da restauração).

### 3. Verificação e Testes
- Validar a aplicação da migração.
- Realizar um teste de restauração de backup e verificar se o log de auditoria foi gerado corretamente com o ID do usuário.
- Verificar se alterações nas tabelas `modelos_empresa` e `registros_customizados` geram logs automáticos via trigger.

## Resumo de Conformidade
- **Régua D-30:** Já validada em auditoria anterior.
- **Trilha de Auditoria:** Passará a cobrir 100% das tabelas críticas e ações de sistema (backup/restore).
- **Imutabilidade:** Mantida conforme regras do MAPA.

---

### 📊 Relatório de Execução Provisório

**Padrão utilizado:** Fix de Bloqueadores de Auditoria

**Sub-agentes ativados:**
- 🗄️ **Supabase Engineer** — ✅ Executado
- 🔍 **Code Auditor** — ✅ Executado
- 🚀 **Deploy Ops** — ✅ Executado

**Resumo:** Correção da ausência de triggers de auditoria em tabelas customizadas e implementação de log manual de autoria em operações de restauração via Edge Function.
