import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tabelas cobertas pelo backup JSON do modulo Custom.
const BACKUP_TABLES = ["documentos_bpf", "modelos_empresa", "registros_customizados"] as const;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing Authorization header");
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.split(" ")[1]
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, empresa_id, backup } = body;

    if (!empresa_id) {
      return new Response(JSON.stringify({ error: "empresa_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Este client usa a service_role e portanto ignora RLS: o vinculo entre o
    // usuario autenticado e a empresa alvo precisa ser checado explicitamente,
    // senao qualquer usuario logado consegue exportar/sobrescrever os dados de
    // qualquer outra empresa passando o empresa_id no body.
    const { data: empresa } = await supabaseClient
      .from("empresas")
      .select("id, user_id")
      .eq("id", empresa_id)
      .maybeSingle();

    let autorizado = !!empresa && empresa.user_id === user.id;

    if (!autorizado) {
      const { data: membro } = await supabaseClient
        .from("empresa_membros")
        .select("id")
        .eq("empresa_id", empresa_id)
        .eq("user_id", user.id)
        .eq("ativo", true)
        .limit(1)
        .maybeSingle();
      autorizado = !!membro;
    }

    if (!autorizado) {
      console.warn(`Acesso negado: user ${user.id} tentou ${action ?? "export"} na empresa ${empresa_id}`);
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Acao: Exportar Dados
    if (action === "export" || !action) {
      const backupData: Record<string, unknown[]> = {};

      for (const table of BACKUP_TABLES) {
        const { data, error } = await supabaseClient
          .from(table)
          .select("*")
          .eq("empresa_id", empresa_id);

        if (error) {
          console.error(`Error fetching table ${table}:`, error);
          backupData[table] = [];
        } else {
          backupData[table] = data ?? [];
        }
      }

      return new Response(JSON.stringify({
        ok: true,
        generated_at: new Date().toISOString(),
        backup: backupData,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Acao: Restaurar Dados
    if (action === "restore") {
      if (!backup) {
        throw new Error("Backup data is required for restore action");
      }

      const results: Record<string, unknown> = {};

      for (const table of BACKUP_TABLES) {
        const data = backup[table];
        if (!Array.isArray(data) || data.length === 0) continue;

        // Forca empresa_id/user_id do chamador: um arquivo de backup editado a
        // mao nao pode injetar linhas em outra empresa nem sob outro usuario.
        const sanitizedData = data.map((item: Record<string, unknown>) => ({
          ...item,
          empresa_id,
          user_id: user.id,
        }));

        const { error } = await supabaseClient
          .from(table)
          .upsert(sanitizedData, { onConflict: "id" });

        if (error) {
          console.error(`Error restoring table ${table}:`, error);
          results[table] = { success: false, error: error.message };
        } else {
          results[table] = { success: true, count: data.length };
        }
      }

      return new Response(JSON.stringify({
        ok: true,
        message: "Restauração concluída",
        results,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Backup Edge Function error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
