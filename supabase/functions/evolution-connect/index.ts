import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

type ConnectPayload = {
  empresa_id?: string;
  instance_name?: string;
  phone_number?: string;
  to_number?: string;
  message?: string;
  action?: 'connect' | 'create' | 'status' | 'send' | 'renew_qr';
};

type EvolutionConfig = {
  api_url: string;
  api_key: string;
  instance_name: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function readJson(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function ensureCompanyAccess(admin: ReturnType<typeof createClient>, empresaId: string, userId: string) {
  const [{ data: owner }, { data: member }] = await Promise.all([
    admin.from('empresas').select('id').eq('id', empresaId).eq('user_id', userId).maybeSingle(),
    admin.from('empresa_membros').select('id').eq('empresa_id', empresaId).eq('user_id', userId).eq('ativo', true).maybeSingle(),
  ]);

  return Boolean(owner || member);
}

async function loadConfig(admin: ReturnType<typeof createClient>, empresaId: string): Promise<EvolutionConfig | null> {
  const { data, error } = await admin
    .from('whatsapp_config')
    .select('api_url, api_key, instance_name')
    .eq('empresa_id', empresaId)
    .maybeSingle();

  if (error) throw new Error(`Falha ao carregar configuração WhatsApp: ${error.message}`);
  if (!data?.api_url || !data?.api_key || !data?.instance_name) return null;
  return data as EvolutionConfig;
}

async function callEvolutionRaw(url: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      apikey: apiKey,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
  const data = await readJson(response);
  return { ok: response.ok, status: response.status, data };
}

async function callEvolution(url: string, apiKey: string, init?: RequestInit) {
  let result = await callEvolutionRaw(url, apiKey, init);
  // Fallback: se a key do banco for rejeitada (401/403), tenta a key global do projeto
  if (!result.ok && (result.status === 401 || result.status === 403)) {
    const fallbackKey = Deno.env.get('EVOLUTION_API_KEY');
    if (fallbackKey && fallbackKey !== apiKey) {
      console.warn('Evolution rejeitou api_key do banco; tentando EVOLUTION_API_KEY do secret.');
      const retry = await callEvolutionRaw(url, fallbackKey, init);
      if (retry.ok) return retry;
      // Se o fallback funcionou parcialmente (status diferente), prefere o que não é 401
      if (retry.status !== 401 && retry.status !== 403) return retry;
    }
  }
  return result;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function evolutionErrorText(data: unknown) {
  if (typeof data === 'string') return data.toLowerCase();
  try {
    return JSON.stringify(data).toLowerCase();
  } catch {
    return '';
  }
}

function isConnectionClosedError(data: unknown) {
  const text = evolutionErrorText(data);
  return text.includes('connection closed')
    || text.includes('socket closed')
    || text.includes('not connected')
    || text.includes('session closed')
    || text.includes('wa disconnected')
    || text.includes('disconnected');
}

function isUnauthorizedError(status: number, data: unknown) {
  const text = evolutionErrorText(data);
  return status === 401 || status === 403 || text.includes('unauthorized') || text.includes('forbidden');
}

function hasQrPayload(data: any) {
  const values = [
    data?.base64,
    data?.qrcode?.base64,
    data?.qrcode?.code,
    data?.qrcode?.pairingCode,
    data?.code,
    data?.pairingCode,
    data?.data?.base64,
    data?.data?.qrcode,
  ];
  return values.some((value) => {
    if (typeof value !== 'string' || !value.trim()) return false;
    const normalized = value.toLowerCase().trim();
    return !normalized.includes('scan qr code')
      && !normalized.includes('whatsapp web')
      && !normalized.includes('escaneie')
      && !normalized.includes('leia o qr');
  });
}

function collectStates(data: any, acc: string[] = []): string[] {
  if (!data || typeof data !== 'object') return acc;
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && ['state', 'status', 'connectionstatus', 'instancestatus'].includes(key.toLowerCase())) {
      acc.push(value.toLowerCase().trim());
    } else if (value && typeof value === 'object') {
      collectStates(value, acc);
    }
  }
  return acc;
}

function isAlreadyConnected(data: any) {
  const states = collectStates(data);
  return states.some((s) => ['open', 'connected', 'conectado'].includes(s));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Método não permitido' }, 405);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'Não autenticado' }, 401);

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: 'Sessão inválida' }, 401);

    const body = (await req.json().catch(() => ({}))) as ConnectPayload;
    const empresaId = body.empresa_id;
    if (!empresaId) return json({ error: 'Empresa obrigatória' }, 400);

    const hasAccess = await ensureCompanyAccess(admin, empresaId, userData.user.id);
    if (!hasAccess) return json({ error: 'Sem acesso a esta empresa' }, 403);

    const config = await loadConfig(admin, empresaId);
    if (!config) return json({ error: 'Configuração Evolution incompleta para esta empresa' }, 400);

    const instanceName = (body.instance_name || config.instance_name).trim();
    if (!instanceName) return json({ error: 'Nome da instância obrigatório' }, 400);

    const baseUrl = config.api_url.replace(/\/+$/, '');

    if (body.action === 'status') {
      const list = await callEvolution(`${baseUrl}/instance/fetchInstances`, config.api_key);
      if (!list.ok) {
        // Responde 200 com campo "error" para a tela mostrar o aviso sem quebrar.
        const errorMessage = isUnauthorizedError(list.status, list.data)
          ? 'Chave da Evolution rejeitada (401). Confira se a API Key salva é a Global API Key (AUTHENTICATION_API_KEY) do seu servidor Evolution.'
          : 'Falha ao consultar Evolution';
        return json({ error: errorMessage, status: list.status, details: list.data });
      }
      return json({ success: true, instances: list.data });
    }

    if (body.action === 'send') {
      const toNumber = body.to_number?.replace(/\D/g, '');
      const message = body.message?.trim();
      if (!toNumber) return json({ error: 'Número de destino obrigatório' }, 400);
      if (!message) return json({ error: 'Mensagem obrigatória' }, 400);

      const sendUrl = `${baseUrl}/message/sendText/${encodeURIComponent(instanceName)}`;
      // Evolution v2 aceita { number, text }; v1 aceita { number, textMessage: { text } }.
      let sent = await callEvolution(sendUrl, config.api_key, {
        method: 'POST',
        body: JSON.stringify({ number: toNumber, text: message }),
      });
      if (!sent.ok && (sent.status === 400 || sent.status === 422)) {
        sent = await callEvolution(sendUrl, config.api_key, {
          method: 'POST',
          body: JSON.stringify({ number: toNumber, textMessage: { text: message } }),
        });
      }

      if (!sent.ok) {
        const errorMessage = isConnectionClosedError(sent.data)
          ? 'A Evolution está online, mas a sessão do WhatsApp está inconsistente/fechada. Gere um novo QR Code no portal e leia novamente em Aparelhos conectados.'
          : isUnauthorizedError(sent.status, sent.data)
          ? 'Chave da Evolution rejeitada. Verifique a Chave Mestra/API Key salva na configuração do WhatsApp.'
          : 'Falha ao enviar mensagem pela Evolution';
        return json({ error: errorMessage, details: sent.data }, sent.status);
      }
      return json({ success: true, response: sent.data });
    }



    const encodedInstance = encodeURIComponent(instanceName);
    const number = body.phone_number?.replace(/\D/g, '');

    const forceRenewQr = body.action === 'renew_qr';

    // Se a instância já está conectada (celular pareado), não há QR a gerar,
    // exceto quando o usuário pediu explicitamente para renovar uma sessão inconsistente.
    const stateCheck = await callEvolution(`${baseUrl}/instance/connectionState/${encodedInstance}`, config.api_key);
    if (!forceRenewQr && stateCheck.ok && isAlreadyConnected(stateCheck.data)) {
      return json({
        success: true,
        alreadyConnected: true,
        state: 'open',
        qrcode: stateCheck.data,
        message: 'Instância já está conectada ao WhatsApp.',
      });
    }

    const renewResults: Array<{ step: string; status: number; data: unknown }> = [];

    // Quando a chave salva não tem permissão para apagar/desconectar instâncias
    // (ex.: é o token da própria instância, e não a Global API Key), a renovação
    // completa é impossível. Nesse caso pulamos a remoção e tentamos apenas gerar
    // o QR Code pela rota de conexão, que aceita o token da instância.
    let renewSkipped = false;

    if (forceRenewQr) {
      // Importante: em algumas versões da Evolution/Baileys, o fluxo logout -> connect
      // devolve QR Code, mas o WhatsApp nunca completa o pareamento. Para renovar de
      // verdade, a instância precisa ser removida e criada novamente antes de conectar.
      const deleted = await callEvolution(`${baseUrl}/instance/delete/${encodedInstance}`, config.api_key, {
        method: 'DELETE',
      });
      renewResults.push({ step: 'delete_before_recreate', status: deleted.status, data: deleted.data });

      if (!deleted.ok && isUnauthorizedError(deleted.status, deleted.data)) {
        renewSkipped = true;
      } else if (!deleted.ok && deleted.status !== 404) {
        const loggedOut = await callEvolution(`${baseUrl}/instance/logout/${encodedInstance}`, config.api_key, {
          method: 'DELETE',
        });
        renewResults.push({ step: 'logout_fallback', status: loggedOut.status, data: loggedOut.data });
        await wait(1500);

        const deletedAfterLogout = await callEvolution(`${baseUrl}/instance/delete/${encodedInstance}`, config.api_key, {
          method: 'DELETE',
        });
        renewResults.push({ step: 'delete_after_logout_fallback', status: deletedAfterLogout.status, data: deletedAfterLogout.data });

        if (!deletedAfterLogout.ok && deletedAfterLogout.status !== 404) {
          // Responde 200 com "error" para a tela mostrar o aviso sem travar.
          return json({
            error: 'A Evolution não permitiu remover a instância antiga. Crie uma instância com outro nome, salve como principal e gere o QR Code nela.',
            status: deletedAfterLogout.status,
            details: renewResults,
          });
        }
      }

      if (!renewSkipped) {
        await wait(2500);

        const recreated = await callEvolution(`${baseUrl}/instance/create`, config.api_key, {
          method: 'POST',
          body: JSON.stringify({
            instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
          }),
        });
        renewResults.push({ step: 'recreate_clean_instance', status: recreated.status, data: recreated.data });

        if (!recreated.ok && recreated.status !== 403 && recreated.status !== 409) {
          return json({
            error: 'A instância antiga foi removida, mas a Evolution não conseguiu recriar uma instância limpa.',
            status: recreated.status,
            details: renewResults,
          });
        }

        if (hasQrPayload(recreated.data)) {
          return json({ success: true, qrcode: recreated.data, recreated: true, renew: renewResults });
        }
      }
    }

    let createData: unknown = null;
    if (body.action === 'create') {
      const created = await callEvolution(`${baseUrl}/instance/create`, config.api_key, {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
      createData = created.data;
      if (!created.ok && created.status !== 403 && created.status !== 409) {
        return json({ error: 'Falha ao criar instância na Evolution', details: created.data }, created.status);
      }
      if (hasQrPayload(created.data)) return json({ success: true, qrcode: created.data, created: true });
      if (isAlreadyConnected(created.data)) {
        return json({ success: true, alreadyConnected: true, state: 'open', qrcode: created.data });
      }
    }

    const query = number ? `?number=${encodeURIComponent(number)}` : '';
    const attempts = [
      () => callEvolution(`${baseUrl}/instance/connect/${encodedInstance}${query}`, config.api_key),
      () => callEvolution(`${baseUrl}/instance/connect/${encodedInstance}`, config.api_key, {
        method: 'POST',
        body: JSON.stringify(number ? { number } : {}),
      }),
      () => callEvolution(`${baseUrl}/instance/connect`, config.api_key, {
        method: 'POST',
        body: JSON.stringify(number ? { instanceName, number } : { instanceName }),
      }),
    ];

    const results = [];
    for (const attempt of attempts) {
      const result = await attempt();
      results.push({ status: result.status, data: result.data });
      if (result.ok && hasQrPayload(result.data)) {
        return json({ success: true, qrcode: result.data, create: createData });
      }
      if (result.ok && isAlreadyConnected(result.data)) {
        return json({ success: true, alreadyConnected: true, state: 'open', qrcode: result.data });
      }
    }

    if (forceRenewQr && !renewSkipped) {
      const deleted = await callEvolution(`${baseUrl}/instance/delete/${encodedInstance}`, config.api_key, {
        method: 'DELETE',
      });
      renewResults.push({ step: 'delete', status: deleted.status, data: deleted.data });
      await wait(1200);

      const recreated = await callEvolution(`${baseUrl}/instance/create`, config.api_key, {
        method: 'POST',
        body: JSON.stringify({
          instanceName,
          qrcode: true,
          integration: 'WHATSAPP-BAILEYS',
        }),
      });
      renewResults.push({ step: 'recreate', status: recreated.status, data: recreated.data });

      if (!recreated.ok && recreated.status !== 403 && recreated.status !== 409) {
        return json({
          error: 'Não foi possível recriar a instância para gerar um QR Code novo.',
          status: recreated.status,
          details: renewResults,
        });
      }

      if (hasQrPayload(recreated.data)) {
        return json({ success: true, qrcode: recreated.data, recreated: true, renew: renewResults });
      }

      for (const attempt of attempts) {
        const result = await attempt();
        renewResults.push({ step: 'connect_after_recreate', status: result.status, data: result.data });
        if (result.ok && hasQrPayload(result.data)) {
          return json({ success: true, qrcode: result.data, recreated: true, renew: renewResults });
        }
      }
    }

    const allUnauthorized = results.length > 0
      && results.every((r) => isUnauthorizedError(r.status, r.data));

    return json({
      error: renewSkipped || allUnauthorized
        ? 'A chave salva não tem permissão para apagar ou reconectar esta instância na Evolution (401). Cole no campo API Key a Global API Key do servidor (AUTHENTICATION_API_KEY), salve e tente de novo. Se preferir, use "Gerar QR Code" normal, sem renovar.'
        : forceRenewQr
        ? 'A instância foi forçada a renovar, mas a Evolution ainda não devolveu um QR Code. Aguarde alguns segundos e tente novamente; se persistir, confira os logs da Evolution/Traefik.'
        : number
        ? 'A Evolution respondeu sem QR Code/código de pareamento. Confira se o número está correto e tente novamente. Se o celular já está pareado, desconecte em Aparelhos Conectados no WhatsApp e tente de novo.'
        : 'A Evolution respondeu sem QR Code. Se o celular já está pareado nesta instância, desconecte em Aparelhos Conectados no WhatsApp e tente de novo, ou recrie a instância.',
      details: forceRenewQr ? { attempts: results, renew: renewResults } : results,
    });
  } catch (error) {
    console.error('evolution-connect error', error);
    return json({ error: (error as Error).message }, 500);
  }
});