/**
 * Definição de pesos (complexidade) para cada POP.
 * Utilizado no plano Intermediário para equilibrar a carga digital.
 */
export const POP_PESOS: Record<string, number> = {
  "POP-01": 15, // Recebimento - Complexo (Fornecedores + Inspeção)
  "POP-02": 10, // Higiene - Médio
  "POP-03": 8,  // Saúde - Simples
  "POP-04": 10, // Água - Médio (Laudos + Cloro)
  "POP-05": 25, // Produção - Muito Complexo (OP + Batidas + Fórmulas)
  "POP-06": 12, // Manutenção - Médio
  "POP-07": 8,  // Pragas - Simples
  "POP-08": 8,  // Resíduos - Simples
  "POP-09": 20, // Rastreabilidade - Complexo (Recall + Fluxo)
  "POP-10": 15, // PAC - Complexo (Auditoria + Matriz de Risco)
};

export const LIMITE_PONTOS_INTERMEDIARIO = 60; // Permite ~4 a 6 POPs digitais

export type PreenchimentoModo = "digital" | "hibrido";

export interface ConfigPreenchimento {
  [popCodigo: string]: PreenchimentoModo;
}

export function calcularTotalPontos(config: ConfigPreenchimento): number {
  return Object.entries(config).reduce((total, [pop, modo]) => {
    if (modo === "digital") {
      return total + (POP_PESOS[pop] || 0);
    }
    return total;
  }, 0);
}
