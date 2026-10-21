# Plano de Implementação: Gestão de POPs, Versionamento e Licenciamento Flexível

Este plano descreve as melhorias na gestão de documentos BPF, incluindo versionamento real e um sistema de licenciamento flexível para o plano Intermediário, permitindo a escolha do modo de preenchimento por POP.

## 1. Banco de Dados e Versionamento Real

Para garantir a integridade e o histórico exigido pelo MAPA, o sistema passará a gerenciar versões de forma explícita.

- **Migração de Tabela:** Adicionar a coluna `versao` (INTEGER) na tabela `arquivos_bpf`.
- **Lógica de Versionamento:** 
  - Toda nova geração por IA ou upload manual de documento descritivo incrementará a versão.
  - O `storagePath` será ajustado para incluir a versão (ex: `.../POP-01/v1/arquivo.pdf`), garantindo que versões antigas não sejam sobrescritas.
- **Histórico:** A tela de "Planilhas de POPs" exibirá o histórico de versões para auditoria.

## 2. Flexibilidade no Plano Intermediário

O Plano Intermediário permitirá que o Responsável Técnico (RT) escolha como cada POP será operado.

- **Configuração por Empresa:** Adicionar a coluna `config_modos_preenchimento` (JSONB) na tabela `empresas`.
- **Trava por Peso (Complexidade):** 
  - Em vez de uma restrição fixa de 50%, cada POP terá um "peso" baseado na sua complexidade e volume de dados.
  - O Plano Intermediário terá um "limite de pontos digitais". O RT poderá escolher habilitar POPs digitais até atingir esse limite.
  - Exemplo: POP-05 (Produção) tem peso maior que POP-04 (Água). O usuário decide se prefere ter a Produção digital ou vários POPs mais simples.
- **Interface de Seleção:** Criar um painel de configuração para o RT gerenciar essa distribuição de recursos.

## 3. Fluxos de Trabalho por Nível

- **Plano Entrada:** Totalmente híbrido. Apenas download de modelos e upload de scans/fotos. Preenchimento digital bloqueado.
- **Plano Intermediário:** Misto. O usuário define quais POPs são Digitais (lançamento direto no sistema) e quais são Híbridos (papel + upload).
- **Plano Avançado:** Totalmente Digital. IA, preenchimento automatizado e automações liberadas para todos os POPs.

## 4. Detalhes Técnicos

### Backend (SQL)
```sql
ALTER TABLE public.arquivos_bpf ADD COLUMN versao INTEGER DEFAULT 1;
ALTER TABLE public.empresas ADD COLUMN config_modos_preenchimento JSONB DEFAULT '{}';
ALTER TABLE public.empresas ADD COLUMN limite_pontos_digitais INTEGER DEFAULT 100;
```

### Frontend
- **`src/config/popsPesos.ts`:** Definição dos pesos de cada POP (Complexidade).
- **`src/components/TierGate.tsx`:** Lógica de validação baseada no plano e nas escolhas da empresa.
- **`src/pages/PlanilhasPop.tsx`:** Integração do seletor de modo e visualização de versões.

## Próximos Passos
1. Criar migração para os novos campos de versão e configuração.
2. Implementar a lógica de cálculo de pesos para os POPs.
3. Desenvolver a interface de "Configuração de Modos" para o plano Intermediário.
