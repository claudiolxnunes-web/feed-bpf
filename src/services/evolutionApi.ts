/**
 * Service to interact with Evolution API
 * Documentation: https://doc.evolution-api.com/
 */

import { supabase } from "@/integrations/supabase/client";

export interface EvolutionInstance {
  instanceName: string;
  owner?: string;
  profileName?: string;
  profilePictureUrl?: string;
  status: 'open' | 'connecting' | 'disconnecting' | 'close';
  serverUrl?: string;
  apikey?: string;
}

export interface EvolutionQrCode {
  base64?: string;
  code?: string;
  pairingCode?: string;
  count?: number;
  state?: string;
  raw?: unknown;
}

export interface EvolutionConnectParams {
  empresaId: string;
  instanceName: string;
  phoneNumber?: string;
  action?: "connect" | "create" | "renew_qr";
}

export interface EvolutionSendViaBackendParams {
  empresaId: string;
  instanceName: string;
  number: string;
  text: string;
}

export class EvolutionApiError extends Error {
  details?: unknown;
  status?: number;

  constructor(message: string, details?: unknown, status?: number) {
    super(message);
    this.name = "EvolutionApiError";
    this.details = details;
    this.status = status;
  }
}

const normalizeConnectionStatus = (value?: string): EvolutionInstance["status"] => {
  const status = value?.toLowerCase().trim();
  if (["open", "connected", "conectado"].includes(status || "")) return "open";
  if (["connecting", "qrcode", "qr", "pairing", "loading", "conectando"].includes(status || "")) return "connecting";
  if (["disconnecting", "desconectando"].includes(status || "")) return "disconnecting";
  return "close";
};

const normalizeInstance = (item: any): EvolutionInstance => {
  const source = item?.instance ?? item;
  const rawStatus = source?.status ?? source?.connectionStatus ?? source?.state ?? item?.status ?? item?.connectionStatus ?? item?.state;
  return {
    instanceName: source?.instanceName ?? source?.name ?? item?.instanceName ?? "Instância sem nome",
    owner: source?.owner ?? item?.owner,
    profileName: source?.profileName ?? item?.profileName,
    profilePictureUrl: source?.profilePictureUrl ?? item?.profilePictureUrl,
    status: normalizeConnectionStatus(rawStatus),
    serverUrl: source?.serverUrl ?? item?.serverUrl,
    apikey: source?.apikey ?? item?.apikey,
  };
};

const readEvolutionError = async (response: Response, fallback: string) => {
  const errorData = await response.json().catch(() => null);
  const message = Array.isArray(errorData?.message)
    ? errorData.message.join(" ")
    : errorData?.message || errorData?.error || fallback;
  return `${message} (${response.status})`;
};

const normalizeBase64Image = (value?: string) => {
  if (!value) return undefined;
  if (value.startsWith("data:image") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value}`;
};

const collectObjects = (value: any): any[] => {
  if (!value || typeof value !== "object") return [];
  const nested = Object.values(value).flatMap((item) => collectObjects(item));
  return [value, ...nested];
};

const firstString = (objects: any[], keys: string[]) => {
  for (const object of objects) {
    for (const key of keys) {
      const value = object?.[key];
      if (typeof value === "string" && value.trim()) return value.trim();
    }
  }
  return undefined;
};

const firstNumber = (objects: any[], keys: string[]) => {
  for (const object of objects) {
    for (const key of keys) {
      const value = object?.[key];
      if (typeof value === "number") return value;
      if (typeof value === "string" && value.trim() && !Number.isNaN(Number(value))) return Number(value);
    }
  }
  return undefined;
};

const looksLikeImage = (value: string) => (
  value.startsWith("data:image") ||
  value.startsWith("http") ||
  value.startsWith("iVBOR") ||
  value.startsWith("/9j/") ||
  (value.length > 500 && /^[A-Za-z0-9+/=\r\n]+$/.test(value))
);

const isInstructionalQrMessage = (value?: string) => {
  const normalized = value?.toLowerCase().trim() ?? "";
  return Boolean(normalized) && (
    normalized.includes("scan qr code") ||
    normalized.includes("whatsapp web") ||
    normalized.includes("escaneie") ||
    normalized.includes("leia o qr")
  );
};

const isUsableQrString = (value?: string) => Boolean(value?.trim()) && !isInstructionalQrMessage(value);

const normalizeQrCode = (data: any): EvolutionQrCode => {
  if (typeof data === "string") {
    const value = data.trim();
    if (looksLikeImage(value)) return { base64: normalizeBase64Image(value) };
    return isUsableQrString(value) ? { code: value } : { raw: data };
  }

  const directCandidates = [
    data?.base64,
    data?.base64Image,
    data?.qrCodeBase64,
    data?.qrcode,
    data?.qrCode,
    data?.qr,
    data?.code,
    data?.data?.base64,
    data?.data?.qrcode,
    data?.data?.qrCode,
    data?.instance?.qrcode,
  ].filter((value): value is string => typeof value === "string" && value.trim().length > 0);

  for (const candidate of directCandidates) {
    const value = candidate.trim();
    if (looksLikeImage(value)) return { base64: normalizeBase64Image(value), raw: data };
  }

  const objects = collectObjects(data);
  const base64 = firstString(objects, ["base64", "base64Image", "qrCodeBase64", "qrBase64", "qrcodeBase64", "base64Qr", "base64QRCode", "qrCodeImage", "qrcodeImage", "image", "src"]);
  const code = directCandidates.find((value) => !looksLikeImage(value) && isUsableQrString(value))
    ?? firstString(objects, ["code", "qrCode", "qrcode", "qr", "qrCodeString", "qr_code"]);
  const pairingCode = firstString(objects, ["pairingCode", "pairing_code"]);
  return {
    base64: normalizeBase64Image(base64),
    code: isUsableQrString(code) ? code : undefined,
    pairingCode: isUsableQrString(pairingCode) ? pairingCode : undefined,
    count: typeof data?.count === "number" ? data.count : firstNumber(objects, ["count"]),
    state: firstString(objects, ["state", "status", "connectionStatus"]),
    raw: data,
  };
};

const hasQrPayload = (qr: EvolutionQrCode) => Boolean(qr.base64 || qr.code || qr.pairingCode);

const connectUrl = (apiUrl: string, instanceName: string, phoneNumber?: string) => {
  const base = `${apiUrl.replace(/\/$/, "")}/instance/connect/${encodeURIComponent(instanceName)}`;
  const number = phoneNumber?.replace(/\D/g, "");
  return number ? `${base}?number=${encodeURIComponent(number)}` : base;
};

export const evolutionService = {
  /**
   * Fetch all instances directly from Evolution (may fail with CORS).
   */
  async fetchInstances(apiUrl: string, apiKey: string): Promise<EvolutionInstance[]> {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/fetchInstances`, {
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error(await readEvolutionError(response, "Falha ao buscar instâncias"));
    const data = await response.json();
    return Array.isArray(data) ? data.map(normalizeInstance) : [];
  },

  /**
   * Fetch instances through the backend (bypasses CORS).
   */
  async fetchInstancesViaBackend(empresaId: string, instanceName: string): Promise<EvolutionInstance[]> {
    const { data, error } = await supabase.functions.invoke("evolution-connect", {
      body: { empresa_id: empresaId, instance_name: instanceName, action: "status" },
    });
    if (error) throw error;
    if (data?.error) throw new EvolutionApiError(data.error, data.details ?? data);
    const list = data?.instances;
    return Array.isArray(list) ? list.map(normalizeInstance) : [];
  },

  /**
   * Create a new instance
   */
  async createInstance(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/create`, {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        instanceName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      })
    });
    if (!response.ok) {
      // 403/409 = já existe → tratar como sucesso silencioso
      if (response.status === 403 || response.status === 409) {
        return { alreadyExists: true, instanceName };
      }
      throw new Error(await readEvolutionError(response, "Falha ao criar instância"));
    }
    const data = await response.json();
    return { ...data, normalizedQrCode: normalizeQrCode(data) };
  },

  /**
   * Create/connect through the backend so CORS and API-key exposure don't block QR generation.
   */
  async connectViaBackend({ empresaId, instanceName, phoneNumber, action = "connect" }: EvolutionConnectParams) {
    const { data, error } = await supabase.functions.invoke("evolution-connect", {
      body: {
        empresa_id: empresaId,
        instance_name: instanceName,
        phone_number: phoneNumber,
        action,
      },
    });
    if (error) throw error;
    if (data?.error) throw new EvolutionApiError(data.error, data.details ?? data, data.status);
    const normalized = normalizeQrCode(data?.qrcode ?? data);
    return { ...normalized, alreadyConnected: Boolean(data?.alreadyConnected), raw: data };
  },

  /**
   * Send a text message through the backend (bypasses browser CORS and hides the API key).
   */
  async sendMessageViaBackend({ empresaId, number, text }: EvolutionSendViaBackendParams) {
    // Envio agora passa pelo canal oficial (WhatsApp Business/Meta) via evolution-send.
    // O servidor Evolution legado ficava em timeout e não é mais usado para envio.
    const { data, error } = await supabase.functions.invoke("evolution-send", {
      body: {
        to: number,
        message: text,
        empresa_id: empresaId,
        modulo: "portal",
        tipo: "manual",
      },
    });
    if (error) {
      let details: unknown = error.message;
      let friendly = "Falha ao enviar mensagem pelo WhatsApp oficial";
      let status: number | undefined;
      const ctx = (error as { context?: Response }).context;
      if (ctx && typeof ctx.text === "function") {
        try {
          const txt = await ctx.text();
          details = txt;
          const parsed = JSON.parse(txt) as { error?: unknown; details?: unknown; status?: unknown };
          if (typeof parsed?.error === "string" && parsed.error) friendly = parsed.error;
          if (parsed?.details !== undefined) details = parsed.details;
          if (typeof parsed?.status === "number") status = parsed.status;
        } catch { /* corpo não-JSON: mantém mensagem padrão */ }
      }
      throw new EvolutionApiError(friendly, details, status);
    }
    if (data?.error) throw new EvolutionApiError(data.error, data.details ?? data, data.status);
    return data?.response ?? data;
  },

  /**
   * Get QR Code for an instance
   */
  async getQrCode(apiUrl: string, apiKey: string, instanceName: string, phoneNumber?: string) {
    const response = await fetch(connectUrl(apiUrl, instanceName, phoneNumber), {
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error(await readEvolutionError(response, "Falha ao buscar QR Code"));
    const data = await response.json();
    return { ...normalizeQrCode(data), raw: data };
  },

  /**
   * Logout an instance
   */
  async logoutInstance(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error("Falha ao desconectar");
    return response.json();
  },

  /**
   * Delete an instance
   */
  async deleteInstance(apiUrl: string, apiKey: string, instanceName: string) {
    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: {
        "apikey": apiKey
      }
    });
    if (!response.ok) throw new Error("Falha ao deletar instância");
    return response.json();
  },

  /**
   * Send a text message
   */
  async sendMessage(apiUrl: string, apiKey: string, instanceName: string, number: string, text: string) {
    // Clean number: remove all non-digits
    const cleanNumber = number.replace(/\D/g, "");
    
    // Check if it's a Brazilian number and fix common formatting issues
    let formattedNumber = cleanNumber;
    if (cleanNumber.startsWith("55") && cleanNumber.length === 13) {
      // Often Brazilian mobile numbers are sent with 9 digits but Evolution/WhatsApp API 
      // sometimes expects the 8-digit format (without the extra 9) for older accounts.
      // However, most modern APIs handle the 13-digit format fine. 
      // We keep as is but ensure no '+' prefix.
    }

    const response = await fetch(`${apiUrl.replace(/\/$/, "")}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: {
        "apikey": apiKey,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        number: formattedNumber,
        options: {
          delay: 1200,
          presence: "composing",
          linkPreview: false
        },
        textMessage: {
          text
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Evolution API Error:", errorData);
      throw new Error(errorData.message || `Erro ${response.status}: Falha ao enviar mensagem`);
    }
    return response.json();
  }
};
