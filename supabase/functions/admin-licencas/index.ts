import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller is admin via user_roles
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const isSuperAdminEmail = user.email?.toLowerCase() === "claudiolx.nunes@gmail.com";

    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData && !isSuperAdminEmail) {
      return new Response(JSON.stringify({ error: "Acesso negado" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, ...params } = await req.json();

    if (action === "list") {
      const { produto: filterProdutoRaw } = params;
      const filterProduto = filterProdutoRaw
        ? String(filterProdutoRaw).toLowerCase().replace(/[^a-z0-9]/g, "")
        : null;
      let licenseQuery = adminClient
        .from("licencas")
        .select("*, empresas(nome)")
        .order("created_at", { ascending: false });
      
      if (filterProduto) {
        licenseQuery = licenseQuery.eq("produto", filterProduto);
      }

      const [licensesRes, vinculosRes, authUsersRes] = await Promise.all([
        licenseQuery,
        adminClient
          .from("licenca_empresas")
          .select("id, ativo, excedente, vinculado_em, desvinculado_em, empresa_id, licenca_id, user_id, stripe_invoice_id, empresas(nome), licencas(*)")
          .order("vinculado_em", { ascending: false }),
        adminClient.auth.admin.listUsers({ perPage: 1000 }),
      ]);

      if (licensesRes.error) throw licensesRes.error;
      if (vinculosRes.error) throw vinculosRes.error;
      if (authUsersRes.error) throw authUsersRes.error;

      const authUsers = authUsersRes.data.users || [];

      const diretas = (licensesRes.data || []).map((lic: any) => {
        const authUser = authUsers.find((u: any) => u.id === lic.user_id);
        return {
          ...lic,
          email: authUser?.email || "—",
          empresa_nome: lic.empresas?.nome || "—",
          origem: "direta",
        };
      });

      const consultor = (vinculosRes.data || []).map((vinculo: any) => {
        const lic = vinculo.licencas || {};
        const authUser = authUsers.find((u: any) => u.id === lic.user_id || u.id === vinculo.user_id);

        return {
          id: vinculo.id,
          user_id: lic.user_id || vinculo.user_id,
          empresa_id: vinculo.empresa_id,
          email: authUser?.email || "—",
          empresa_nome: vinculo.empresas?.nome || "—",
          produto: lic.produto,
          plano: lic.plano || "consultor",
          status: vinculo.ativo ? lic.status || "ativa" : "revogada",
          data_inicio: lic.data_inicio || vinculo.vinculado_em,
          data_expiracao: lic.data_expiracao,
          liberado_admin: lic.liberado_admin || false,
          nivel: lic.nivel || null,
          origem: "consultor",
          licenca_id: vinculo.licenca_id,
          excedente: vinculo.excedente || false,
          ativo: vinculo.ativo,
        };
      });

      let result = [...consultor, ...diretas];
      if (filterProduto) {
        result = result.filter(r =>
          (r.produto || "").toString().toLowerCase().replace(/[^a-z0-9]/g, "") === filterProduto
        );
      }

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ===== Auditoria de licenças duplicadas / soltas =====
    if (action === "audit_duplicates" || action === "fix_duplicates") {
      const today = new Date().toISOString().split("T")[0];

      const [licRes, empresasRes, membrosRes, usersRes] = await Promise.all([
        adminClient.from("licencas").select("*").eq("status", "ativa"),
        adminClient.from("empresas").select("id, nome, user_id"),
        adminClient.from("empresa_membros").select("empresa_id, user_id, ativo, papel"),
        adminClient.auth.admin.listUsers({ perPage: 1000 }),
      ]);
      if (licRes.error) throw licRes.error;
      if (empresasRes.error) throw empresasRes.error;
      if (membrosRes.error) throw membrosRes.error;

      const users = usersRes.data?.users || [];
      const empresas = empresasRes.data || [];
      const membros = (membrosRes.data || []).filter((m: any) => m.ativo);

      const emailOf = (uid: string) =>
        users.find((u: any) => u.id === uid)?.email || "—";
      const empresaOf = (eid: string | null) =>
        eid ? empresas.find((e: any) => e.id === eid)?.nome || "—" : null;

      const empresasDoUsuario = (uid: string) => {
        const ids = new Set<string>();
        empresas.filter((e: any) => e.user_id === uid).forEach((e: any) => ids.add(e.id));
        membros.filter((m: any) => m.user_id === uid).forEach((m: any) => ids.add(m.empresa_id));
        return [...ids];
      };

      const nivelRank: Record<string, number> = { entrada: 1, intermediario: 2, avancado: 3 };
      const score = (l: any) => [
        l.empresa_id ? 1 : 0,
        l.data_expiracao ? new Date(l.data_expiracao).getTime() : 0,
        nivelRank[String(l.nivel || "").toLowerCase()] || 0,
        l.liberado_admin ? 1 : 0,
      ];
      const better = (a: any, b: any) => {
        const sa = score(a), sb = score(b);
        for (let i = 0; i < sa.length; i++) {
          if (sa[i] !== sb[i]) return sa[i] > sb[i] ? a : b;
        }
        return a;
      };

      const licencas = (licRes.data || []).filter(
        (l: any) => !l.data_expiracao || l.data_expiracao >= today
      );

      const grupos = new Map<string, any[]>();
      for (const l of licencas) {
        const prod = String(l.produto || "").toLowerCase().replace(/[^a-z0-9]/g, "");
        const key = `${l.user_id}::${prod}`;
        if (!grupos.has(key)) grupos.set(key, []);
        grupos.get(key)!.push({ ...l, _produto: prod });
      }

      const problemas: any[] = [];
      for (const [key, lics] of grupos) {
        const [uid, prod] = key.split("::");
        const manter = lics.reduce((acc: any, cur: any) => better(acc, cur));
        const empresasUser = empresasDoUsuario(uid);

        if (lics.length > 1) {
          problemas.push({
            tipo: "duplicada",
            user_id: uid,
            email: emailOf(uid),
            produto: prod,
            manter_id: manter.id,
            manter_empresa: empresaOf(manter.empresa_id),
            licencas: lics.map((l: any) => ({
              id: l.id,
              empresa_id: l.empresa_id,
              empresa_nome: empresaOf(l.empresa_id),
              nivel: l.nivel,
              plano: l.plano,
              data_expiracao: l.data_expiracao,
              liberado_admin: l.liberado_admin,
              manter: l.id === manter.id,
            })),
            acao: "Revogar as licenças extras, mantendo a vinculada à empresa",
          });
        } else if (!lics[0].empresa_id && empresasUser.length > 0) {
          problemas.push({
            tipo: "solta",
            user_id: uid,
            email: emailOf(uid),
            produto: prod,
            manter_id: lics[0].id,
            manter_empresa: null,
            empresa_sugerida_id: empresasUser.length === 1 ? empresasUser[0] : null,
            empresa_sugerida_nome:
              empresasUser.length === 1 ? empresaOf(empresasUser[0]) : null,
            licencas: [{
              id: lics[0].id,
              empresa_id: null,
              empresa_nome: null,
              nivel: lics[0].nivel,
              plano: lics[0].plano,
              data_expiracao: lics[0].data_expiracao,
              liberado_admin: lics[0].liberado_admin,
              manter: true,
            }],
            acao:
              empresasUser.length === 1
                ? "Vincular a licença à empresa do usuário"
                : "Usuário possui várias empresas — vincular manualmente",
          });
        }
      }

      if (action === "audit_duplicates") {
        return new Response(
          JSON.stringify({
            total: problemas.length,
            duplicadas: problemas.filter((p) => p.tipo === "duplicada").length,
            soltas: problemas.filter((p) => p.tipo === "solta").length,
            problemas,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { user_id: onlyUser, produto: onlyProduto } = params;
      const alvo = problemas.filter(
        (p) =>
          (!onlyUser || p.user_id === onlyUser) &&
          (!onlyProduto || p.produto === onlyProduto)
      );

      let revogadas = 0;
      let vinculadas = 0;
      const erros: string[] = [];

      for (const p of alvo) {
        try {
          if (p.tipo === "duplicada") {
            const extras = p.licencas.filter((l: any) => !l.manter).map((l: any) => l.id);
            if (extras.length) {
              const { error } = await adminClient
                .from("licencas")
                .update({ status: "revogada", updated_at: new Date().toISOString() })
                .in("id", extras);
              if (error) throw error;
              revogadas += extras.length;
            }
          } else if (p.tipo === "solta" && p.empresa_sugerida_id) {
            const { error } = await adminClient
              .from("licencas")
              .update({ empresa_id: p.empresa_sugerida_id, updated_at: new Date().toISOString() })
              .eq("id", p.manter_id);
            if (error) throw error;
            vinculadas++;
          }
        } catch (e) {
          erros.push(`${p.email} / ${p.produto}: ${(e as Error).message}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, revogadas, vinculadas, erros }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "create") {
      const { email, produto, empresa_id, dias, nivel } = params;
      if (!email) throw new Error("email é obrigatório");
      if (!produto) throw new Error("produto é obrigatório");
      if (!dias) throw new Error("dias é obrigatório");

      // Find user by email
      const allUsers = await adminClient.auth.admin.listUsers({ perPage: 1000 });
      const target = (allUsers.data.users || []).find(
        (u: any) => u.email?.toLowerCase() === String(email).toLowerCase()
      );
      if (!target) throw new Error("Usuário não encontrado para este e-mail");

      const planoMap: Record<number, string> = {
        30: "trial",
        90: "3_meses",
        180: "6_meses",
        365: "1_ano",
      };

      const now = new Date();
      const expDate = new Date(now);
      expDate.setDate(expDate.getDate() + Number(dias));

      const chave = `ADM-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

      const normalizedNivel = typeof nivel === "string" && ["entrada", "intermediario", "avancado"].includes(nivel.toLowerCase())
        ? nivel.toLowerCase()
        : "entrada";

      // Normaliza igual ao hook useLicense (remove _, -, espaços etc.)
      // para evitar divergência tipo "feed_bpf" vs "feedbpf"
      const normalizedProduto = String(produto).toLowerCase().replace(/[^a-z0-9]/g, "");

      // Check duplicate
      let existsQuery = adminClient
        .from("licencas")
        .select("id")
        .eq("user_id", target.id)
        .eq("produto", normalizedProduto);
      existsQuery = empresa_id ? existsQuery.eq("empresa_id", empresa_id) : existsQuery.is("empresa_id", null);
      const { data: existsRow } = await existsQuery.maybeSingle();
      if (existsRow) {
        throw new Error("Já existe uma licença deste produto para o usuário/empresa selecionado");
      }

      const { error } = await adminClient.from("licencas").insert({
        user_id: target.id,
        empresa_id: empresa_id || null,
        produto: normalizedProduto,
        plano: planoMap[Number(dias)] || `${dias}_dias`,
        nivel: normalizedNivel,
        data_inicio: now.toISOString().split("T")[0],
        data_expiracao: expDate.toISOString().split("T")[0],
        status: "ativa",
        chave_licenca: chave,
        liberado_admin: true,
      });
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "grant") {
      const { empresa_id, dias, licenca_id, user_id: targetUserId, nivel } = params;
      if (!dias) throw new Error("dias é obrigatório");
      if (!empresa_id && !licenca_id && !targetUserId) throw new Error("empresa_id, licenca_id ou user_id é obrigatório");

      const planoMap: Record<number, string> = {
        30: "trial",
        90: "3_meses",
        180: "6_meses",
        365: "1_ano",
      };

      const now = new Date();
      const expDate = new Date(now);
      expDate.setDate(expDate.getDate() + Number(dias));

      const chave = `ADM-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`;

      let ownerUserId: string | null = targetUserId || null;
      if (empresa_id && !ownerUserId) {
        const { data: empresa } = await adminClient
          .from("empresas")
          .select("user_id")
          .eq("id", empresa_id)
          .single();
        if (!empresa) throw new Error("Empresa não encontrada");
        ownerUserId = empresa.user_id;
      }

      // Find existing license: by id, by empresa_id, or by user_id with null empresa
      let existing: { id: string } | null = null;
      if (licenca_id) {
        existing = { id: licenca_id };
      } else if (empresa_id) {
        const { data } = await adminClient.from("licencas").select("id").eq("empresa_id", empresa_id).maybeSingle();
        existing = data;
      } else if (ownerUserId) {
        const { data } = await adminClient
          .from("licencas")
          .select("id")
          .eq("user_id", ownerUserId)
          .is("empresa_id", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        existing = data;
      }

      const normalizedNivel = typeof nivel === "string" && ["entrada", "intermediario", "avancado"].includes(nivel.toLowerCase())
        ? nivel.toLowerCase()
        : undefined;

      const updatePayload = {
        plano: planoMap[Number(dias)] || `${dias}_dias`,
        ...(normalizedNivel ? { nivel: normalizedNivel } : {}),
        data_inicio: now.toISOString().split("T")[0],
        data_expiracao: expDate.toISOString().split("T")[0],
        status: "ativa",
        chave_licenca: chave,
        liberado_admin: true,
      };

      if (existing) {
        const { error } = await adminClient.from("licencas").update(updatePayload).eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await adminClient.from("licencas").insert({
          user_id: ownerUserId,
          empresa_id: empresa_id || null,
          ...updatePayload,
        });
        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "update_level") {
      const { empresa_id, licenca_id, nivel } = params;
      if (!empresa_id && !licenca_id) throw new Error("empresa_id ou licenca_id é obrigatório");
      if (!nivel) throw new Error("nivel é obrigatório");

      const normalizedNivel = String(nivel).toLowerCase();
      if (!["entrada", "intermediario", "avancado"].includes(normalizedNivel)) {
        throw new Error("Nível inválido. Use entrada, intermediario ou avancado");
      }

      const query = adminClient.from("licencas").update({ nivel: normalizedNivel, updated_at: new Date().toISOString() });
      const { error } = licenca_id
        ? await query.eq("id", licenca_id)
        : await query.eq("empresa_id", empresa_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "revoke") {
      const { empresa_id, licenca_id, force } = params;
      if (!empresa_id && !licenca_id) throw new Error("empresa_id ou licenca_id é obrigatório");

      // Buscar licença para verificar assinatura Paddle ativa paga
      const { data: licencaAtual } = licenca_id
        ? await adminClient.from("licencas").select("*").eq("id", licenca_id).maybeSingle()
        : await adminClient.from("licencas").select("*").eq("empresa_id", empresa_id).maybeSingle();

      // Bloquear revogação se houver assinatura Paddle ativa e paga (não liberada manualmente).
      // Obs.: as colunas stripe_subscription_id/stripe_customer_id são reutilizadas
      // pelo webhook do Paddle (legado de schema).
      const temAssinaturaAtiva =
        (licencaAtual?.stripe_subscription_id || licencaAtual?.stripe_customer_id) &&
        licencaAtual?.status === "ativa" &&
        !licencaAtual?.liberado_admin &&
        new Date(licencaAtual.data_expiracao) > new Date();

      if (temAssinaturaAtiva && !force) {
        return new Response(
          JSON.stringify({
            error:
              "Esta licença possui uma assinatura ativa no Paddle. Cancele a assinatura no provedor primeiro ou use 'Forçar Revogação'.",
            assinatura_protegida: true,
          }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const updateData = {
        status: "revogada",
        data_expiracao: new Date().toISOString().split("T")[0],
        liberado_admin: false,
      };

      const query = adminClient.from("licencas").update(updateData);
      const { error } = licenca_id
        ? await query.eq("id", licenca_id)
        : await query.eq("empresa_id", empresa_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Ação inválida" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
