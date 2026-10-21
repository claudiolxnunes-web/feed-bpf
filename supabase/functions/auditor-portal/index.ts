import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-auditor-token",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface ValidateResult {
  ok: boolean;
  empresa_id?: string;
  empresa_nome?: string;
  token_id?: string;
  expira_em?: string;
  error?: string;
}

async function validateToken(token: string): Promise<ValidateResult> {
  if (!token || token.length < 20) return { ok: false, error: "Token inválido" };

  const { data: rows, error } = await supabase.rpc("validar_auditor_token", { _token: token });
  const row = Array.isArray(rows) ? rows[0] : null;
  if (error || !row) return { ok: false, error: "Token não encontrado" };
  if (!row.ativo) return { ok: false, error: "Token revogado" };
  if (new Date(row.expira_em).getTime() < Date.now()) {
    return { ok: false, error: "Token expirado" };
  }

  const { data: empresa } = await supabase
    .from("empresas")
    .select("nome")
    .eq("id", row.empresa_id)
    .maybeSingle();

  return {
    ok: true,
    token_id: row.id,
    empresa_id: row.empresa_id,
    empresa_nome: empresa?.nome ?? "Empresa",
    expira_em: row.expira_em,
  };
}


async function logAccess(
  token_id: string,
  empresa_id: string,
  modulo: string,
  req: Request,
  recurso_id?: string,
) {
  await supabase.from("auditor_acessos").insert({
    token_id,
    empresa_id,
    modulo,
    recurso_id: recurso_id ?? null,
    ip_address: req.headers.get("x-forwarded-for") ?? req.headers.get("cf-connecting-ip") ?? null,
    user_agent: req.headers.get("user-agent")?.slice(0, 500) ?? null,
  });
  await supabase
    .from("auditor_tokens")
    .update({ ultimo_acesso_em: new Date().toISOString() })
    .eq("id", token_id);
}

async function incrementHit(token_id: string) {
  const { data } = await supabase
    .from("auditor_tokens")
    .select("total_acessos")
    .eq("id", token_id)
    .maybeSingle();
  await supabase
    .from("auditor_tokens")
    .update({ total_acessos: (data?.total_acessos ?? 0) + 1 })
    .eq("id", token_id);
}

const MODULES: Record<string, { table: string; columns: string; orderBy: string }> = {
  documentos: { table: "documentos", columns: "id, codigo, nome, versao, status, data_revisao, proxima_revisao, responsavel", orderBy: "codigo" },
  execucao_pops: { table: "execucao_pops", columns: "id, codigo_pop, nome_pop, executor, setor, data_execucao, status, observacoes", orderBy: "data_execucao" },
  analises: { table: "analises_laboratorio", columns: "id, produto, lote, parametro, resultado, limite_referencia, conforme, laboratorio, data_resultado", orderBy: "data_resultado" },
  calibracoes: { table: "calibracoes", columns: "id, equipamento, codigo, tipo, data_calibracao, proxima_calibracao, status, certificado_numero", orderBy: "proxima_calibracao" },
  fornecedores: { table: "fornecedores", columns: "id, nome, cnpj, registro_sipeagro, status_qualificacao, ultima_avaliacao, proxima_avaliacao", orderBy: "nome" },
  manutencoes: { table: "manutencoes", columns: "id, equipamento, tipo, descricao, data_programada, data_execucao, status", orderBy: "data_programada" },
  higiene: { table: "cronogramas_higiene", columns: "id, area, equipamento, procedimento, frequencia, produto_utilizado, responsavel, status", orderBy: "area" },
  pragas: { table: "controle_pragas", columns: "id, data, local, tipo_praga, acao, responsavel", orderBy: "data" },
  residuos: { table: "controle_residuos", columns: "id, tipo_residuo, classificacao, quantidade, unidade, data_coleta, destino_final, manifesto_numero, status", orderBy: "data_coleta" },
  visitantes: { table: "controle_visitantes", columns: "id, nome_visitante, empresa, documento, data_visita, motivo, hora_entrada, hora_saida, epi_fornecido", orderBy: "data_visita" },
  substancias: { table: "controle_substancias", columns: "id, materia_prima, substancia, tipo, resultado, limite_maximo, conforme, data_analise, status", orderBy: "data_analise" },
  formulas: { table: "formulas", columns: "id, codigo, produto_nome, versao, data_versao, status", orderBy: "codigo" },
  expedicoes: { table: "expedicoes", columns: "id, numero_nf, cliente_nome, data_emissao, data_saida, valor_total, status", orderBy: "data_emissao" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "validate";
    // Token aceito apenas pelo header: na query string ele vaza em logs de borda e no Referer.
    const headerToken = req.headers.get("x-auditor-token");
    if (!headerToken && url.searchParams.get("token")) {
      console.warn("[auditor-portal] DEPRECATED: token via query string; use header x-auditor-token");
    }
    const token = headerToken ?? "";

    const validation = await validateToken(token);
    if (!validation.ok) {
      return new Response(JSON.stringify(validation), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { token_id, empresa_id, empresa_nome, expira_em } = validation;

    if (action === "validate") {
      await logAccess(token_id!, empresa_id!, "portal_open", req);
      await incrementHit(token_id!);
      const { data: empresa } = await supabase
        .from("empresas")
        .select("nome, cnpj, endereco, responsavel_tecnico, crmv, capacidade, tipo_producao")
        .eq("id", empresa_id!)
        .maybeSingle();
      return new Response(
        JSON.stringify({ ok: true, empresa_nome, expira_em, empresa }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action === "list") {
      const modulo = url.searchParams.get("modulo") ?? "";
      const cfg = MODULES[modulo];
      if (!cfg) {
        return new Response(JSON.stringify({ ok: false, error: "Módulo inválido" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      await logAccess(token_id!, empresa_id!, modulo, req);

      const { data, error } = await supabase
        .from(cfg.table)
        .select(cfg.columns)
        .eq("empresa_id", empresa_id!)
        .order(cfg.orderBy, { ascending: false })
        .limit(500);

      if (error) {
        return new Response(JSON.stringify({ ok: false, error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ ok: true, items: data ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: err instanceof Error ? err.message : "Erro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
