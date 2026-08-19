import { describe, it, expect, beforeEach, vi } from "vitest";

// Banco em memória: guarda (empresa_id, it_codigo) já inseridos e recusa
// duplicata como a UNIQUE faria, para o teste de idempotência valer alguma
// coisa e não só repetir a lógica do módulo.
const tabela: { empresa_id: string; it_codigo: string }[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (nome: string) => {
      if (nome !== "modelos_bpf") throw new Error(`tabela inesperada: ${nome}`);
      return {
        select: () => ({
          eq: (_coluna: string, valor: string) =>
            Promise.resolve({
              data: tabela.filter((r) => r.empresa_id === valor).map((r) => ({
                it_codigo: r.it_codigo,
              })),
              error: null,
            }),
        }),
        insert: (linhas: { empresa_id: string; it_codigo: string }[]) => ({
          select: () => {
            for (const l of linhas) {
              const jaTem = tabela.some(
                (r) => r.empresa_id === l.empresa_id && r.it_codigo === l.it_codigo,
              );
              if (jaTem) {
                return Promise.resolve({
                  data: null,
                  error: { message: "duplicate key value violates unique constraint" },
                });
              }
            }
            tabela.push(...linhas.map((l) => ({ empresa_id: l.empresa_id, it_codigo: l.it_codigo })));
            return Promise.resolve({
              data: linhas.map((l) => ({ it_codigo: l.it_codigo })),
              error: null,
            });
          },
        }),
      };
    },
  },
}));

const { importarModelosIt, MODELOS_IT, valoresIniciais, camposObrigatoriosVazios } = await import(
  "@/lib/importadorIts"
);

const EMPRESA = "11111111-2222-3333-4444-555555555555";
const USER = "99999999-8888-7777-6666-555555555555";

beforeEach(() => {
  tabela.length = 0;
});

describe("MODELOS_IT", () => {
  it("deriva um modelo para cada IT oficial", () => {
    expect(MODELOS_IT.length).toBeGreaterThan(0);
    for (const m of MODELOS_IT) {
      expect(m.codigo).toMatch(/^IT-/);
      expect(m.pop).toMatch(/^POP-/);
      expect(m.titulo.length).toBeGreaterThan(0);
      expect(m.secoes.length).toBeGreaterThan(0);
    }
  });

  it("não repete código de IT", () => {
    const codigos = MODELOS_IT.map((m) => m.codigo);
    expect(new Set(codigos).size).toBe(codigos.length);
  });
});

describe("importarModelosIt — idempotência", () => {
  it("segunda execução não duplica e não reporta falha", async () => {
    const primeira = await importarModelosIt({ empresaId: EMPRESA, userId: USER });
    expect(primeira.criados).toHaveLength(MODELOS_IT.length);
    expect(primeira.ignorados).toHaveLength(0);
    expect(primeira.falhas).toHaveLength(0);

    const segunda = await importarModelosIt({ empresaId: EMPRESA, userId: USER });
    expect(segunda.criados).toHaveLength(0);
    expect(segunda.ignorados).toHaveLength(MODELOS_IT.length);
    expect(segunda.falhas).toHaveLength(0);

    expect(tabela).toHaveLength(MODELOS_IT.length);
  });

  it("importa só o que falta quando parte já existe", async () => {
    const doisCodigos = MODELOS_IT.slice(0, 2).map((m) => m.codigo);
    await importarModelosIt({ empresaId: EMPRESA, userId: USER, codigos: doisCodigos });
    expect(tabela).toHaveLength(2);

    const resto = await importarModelosIt({ empresaId: EMPRESA, userId: USER });
    expect(resto.ignorados).toEqual(expect.arrayContaining(doisCodigos));
    expect(resto.criados).toHaveLength(MODELOS_IT.length - 2);
    expect(tabela).toHaveLength(MODELOS_IT.length);
  });

  it("isola por empresa", async () => {
    await importarModelosIt({ empresaId: EMPRESA, userId: USER });
    const outra = await importarModelosIt({ empresaId: "outra-empresa", userId: USER });
    expect(outra.criados).toHaveLength(MODELOS_IT.length);
    expect(outra.ignorados).toHaveLength(0);
  });
});

describe("auxiliares de preenchimento", () => {
  it("valoresIniciais parte dos valorPadrao e não deixa campo undefined", () => {
    const modelo = MODELOS_IT[0];
    const valores = valoresIniciais(modelo);
    for (const secao of modelo.secoes) {
      for (const campo of secao.campos) {
        expect(valores[`${secao.id}.${campo.id}`]).toBeDefined();
      }
    }
  });

  it("camposObrigatoriosVazios aponta o que falta e some quando preenchido", () => {
    const modelo = MODELOS_IT[0];
    const valores = valoresIniciais(modelo);

    const pendentes = camposObrigatoriosVazios(modelo, valores);
    expect(pendentes.length).toBeGreaterThan(0);

    for (const p of pendentes) {
      const campo = modelo.secoes
        .flatMap((s) => s.campos.map((c) => ({ chave: `${s.id}.${c.id}`, c })))
        .find((x) => x.chave === p.chave)!.c;
      valores[p.chave] = campo.tipo === "checkbox" ? true : "preenchido";
    }

    expect(camposObrigatoriosVazios(modelo, valores)).toHaveLength(0);
  });
});
