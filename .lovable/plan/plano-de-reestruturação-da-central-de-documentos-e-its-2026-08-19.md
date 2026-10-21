# Plano de Reestruturação da Central de Documentos e ITs

O objetivo é unificar o acesso aos documentos originais, instruções de trabalho e registros digitais, organizando-os por POP para facilitar o uso diário na fábrica.

## Mudanças Propostas

### 1. Reestruturação da Navegação
- Remover duplicidades e itens soltos no sidebar.
- Manter o foco nos 10 POPs oficiais.
- Criar uma nova área de **Central de Documentos** que unifique a Biblioteca de Modelos, o Arquivo Digital e as ITs.

### 2. Unificação por POP
Em cada aba de POP (dentro de "Planilhas de POPs" ou "Execução ITs/POPs"), consolidaremos:
- **Descritivos (Word/PDF)**: O "passo a passo" teórico do POP.
- **Instruções de Trabalho (ITs)**: O guia prático detalhado (com materiais, EPIs e passos).
- **Planilhas de Registro**: Tanto os modelos Excel (para impressão) quanto o formulário digital do sistema.

### 3. Melhoria nas ITs (Instruções de Trabalho)
- As ITs agora terão um status de "Registro", permitindo marcar quando foram lidas ou aplicadas (treinamento/operação).
- Vínculo direto entre a IT e a planilha que ela gera.

## Detalhes Técnicos

### 🛠️ UI Architect
- **Modelos.tsx**: Adicionar atalhos para os formulários digitais (Registros Digitais) dentro dos cards de cada modelo.
- **PlanilhasPop.tsx**: Incluir uma nova seção "Instruções de Trabalho (ITs)" que puxe os dados de `instrucoesTrabalho.ts` filtrados pelo POP selecionado.
- **Sidebar (nav-config.ts)**: Agrupar ITs e Modelos sob uma nova categoria ou garantir que estejam claramente vinculados aos POPs.

### 🗄️ Supabase Engineer
- Criar tabela `execucao_its` para registrar quando uma IT foi consultada/executada por um usuário (Log de Operação).

### 🔍 Code Auditor
- Verificar se o `empresa_id` está sendo respeitado em todas as novas visualizações de ITs customizadas.

---

### 📊 Relatório de Planejamento

**Sub-agentes a serem ativados:**
- 🎨 **UI Architect** — ✅ Ativado
- 🗄️ **Supabase Engineer** — ✅ Ativado
- 🔍 **Code Auditor** — ✅ Ativado
- 🔌 **API Integrator** — ➖ Não necessário
