import { describe, it, expect } from "vitest";
import {
  montarPathBpf,
  nomePadronizadoBpf,
  normalizarSegmento,
  inferirFrequencia,
  removerPrefixoDeBucket,
  extrairDeUrlAbsoluta,
  agruparPorPopItFrequencia,
  FREQUENCIAS,
  SEGMENTO_SEM_IT,
  SEGMENTO_SEM_FREQUENCIA,
} from "@/lib/bpfStorage";

const EMPRESA = "3f2b9c10-1111-2222-3333-444455556666";

describe("montarPathBpf", () => {
  it("grava no path hierárquico completo", () => {
    const path = montarPathBpf(
      {
        empresaId: EMPRESA,
        popCodigo: "POP-07",
        itCodigo: "IT-07-01",
        frequencia: "SEMANAL",
        dataRef: "2026-08-19",
      },
      "relatorio pragas.pdf",
      1755600000000,
    );

    expect(path).toBe(
      `bpf/${EMPRESA}/pop-07/it-07-01/semanal/1755600000000_pop-07_it-07-01_semanal_19-08-2026.pdf`,
    );
  });

  it("mantém a profundidade constante quando falta IT e frequência", () => {
    const path = montarPathBpf(
      { empresaId: EMPRESA, popCodigo: "POP-03" },
      "doc.pdf",
      1755600000000,
    );

    const segmentos = path.split("/");
    expect(segmentos).toHaveLength(6);
    expect(segmentos[3]).toBe(SEGMENTO_SEM_IT);
    expect(segmentos[4]).toBe(SEGMENTO_SEM_FREQUENCIA);
  });

  it("não colide quando o mesmo POP/IT/frequência sobe duas vezes na mesma data", () => {
    const meta = {
      empresaId: EMPRESA,
      popCodigo: "POP-01",
      itCodigo: "IT-01-01",
      frequencia: "ANUAL",
      dataRef: "2026-08-19",
    };
    const a = montarPathBpf(meta, "x.pdf", 1755600000000);
    const b = montarPathBpf(meta, "x.pdf", 1755600000001);
    expect(a).not.toBe(b);
  });

  it("remove acento do segmento de path", () => {
    expect(normalizarSegmento("Manutenção Preventiva")).toBe("manutencao-preventiva");
    expect(normalizarSegmento("POP-04 — Água")).toBe("pop-04-agua");
  });
});

describe("nomePadronizadoBpf", () => {
  it("omite as partes ausentes em vez de deixar buraco", () => {
    expect(
      nomePadronizadoBpf({ empresaId: EMPRESA, popCodigo: "POP-02", dataRef: "2026-08-19" }),
    ).toBe("pop-02_19-08-2026");
  });

  it("nunca devolve string vazia", () => {
    expect(nomePadronizadoBpf({ empresaId: EMPRESA })).toBe("documento");
  });
});

describe("inferirFrequencia", () => {
  it("devolve sempre um valor aceito pelo CHECK do banco", () => {
    const amostras = [
      "Mensal",
      "Semanal (armadilhas internas) / Quinzenal (perímetro externo)",
      "Diária (a cada turno) e após cada troca de produto",
      "A cada novo fornecedor e reavaliação anual",
      "texto que não casa com nada",
      "",
    ];
    for (const t of amostras) {
      expect(FREQUENCIAS).toContain(inferirFrequencia(t));
    }
  });

  it("vence a periodicidade mais frequente quando o texto cita duas", () => {
    expect(inferirFrequencia("Semanal (internas) / Quinzenal (externas)")).toBe("SEMANAL");
    expect(inferirFrequencia("Mensal (parcial) / Trimestral (completa)")).toBe("MENSAL");
  });

  it("trata 'a cada X' como evento, não calendário", () => {
    expect(inferirFrequencia("A cada recebimento")).toBe("EVENTUAL");
    expect(inferirFrequencia("A cada lote produzido/expedido")).toBe("EVENTUAL");
  });
});

describe("compatibilidade com paths antigos", () => {
  it("tira o nome do bucket embutido no começo do path", () => {
    expect(removerPrefixoDeBucket("documentos-bpf/user-1/arq.pdf")).toEqual({
      path: "user-1/arq.pdf",
      bucket: "documentos-bpf",
    });
  });

  it("deixa intacto o path que não começa por bucket conhecido", () => {
    expect(removerPrefixoDeBucket("user-1/geral/123.pdf")).toEqual({
      path: "user-1/geral/123.pdf",
    });
  });

  it("extrai bucket e path de URL pública absoluta", () => {
    expect(
      extrairDeUrlAbsoluta(
        "https://xgvapaebustyotrwnzqa.supabase.co/storage/v1/object/public/feed-bpf/emp/cat/2026-08-19/1_x.pdf",
      ),
    ).toEqual({ bucket: "feed-bpf", path: "emp/cat/2026-08-19/1_x.pdf" });
  });

  it("extrai de URL assinada, descartando a query", () => {
    expect(
      extrairDeUrlAbsoluta(
        "https://x.supabase.co/storage/v1/object/sign/documentos-bpf/u/a.pdf?token=abc",
      ),
    ).toEqual({ bucket: "documentos-bpf", path: "u/a.pdf" });
  });

  it("devolve null para URL que não é do storage", () => {
    expect(extrairDeUrlAbsoluta("https://exemplo.com.br/arquivo.pdf")).toBeNull();
  });
});

describe("agruparPorPopItFrequencia", () => {
  it("monta a árvore e joga os não classificados para o fim", () => {
    const arvore = agruparPorPopItFrequencia([
      { pop_codigo: "POP-01", it_codigo: "IT-01-01", frequencia: "ANUAL" },
      { pop_codigo: "POP-01", it_codigo: "IT-01-01", frequencia: "ANUAL" },
      { pop_codigo: "POP-01", it_codigo: null, frequencia: null },
      { pop_codigo: null, it_codigo: null, frequencia: null },
    ]);

    expect(arvore.map((p) => p.popCodigo)).toEqual(["POP-01", "_sem-pop"]);
    expect(arvore[0].total).toBe(3);
    expect(arvore[0].its[0].itCodigo).toBe("IT-01-01");
    expect(arvore[0].its[0].frequencias[0].itens).toHaveLength(2);
    // Não classificado vai por último, mas não some.
    expect(arvore[0].its[1].itCodigo).toBe(SEGMENTO_SEM_IT);
  });
});
