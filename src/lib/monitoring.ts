import * as Sentry from "@sentry/react";

let sentryInitialized = false;

// Sentry DSN é uma chave pública por design - seguro estar no código.
// Cada produto tem seu próprio projeto Sentry. Roteamos pelo hostname /
// pathname / query param "?product" para enviar erros ao projeto correto.
const DSN_DEFAULT = "https://d7a8cb48cdf7c7b4f4d554f6dd67d3fd@o4511515922006016.ingest.us.sentry.io/4511515977777152";

const DSN_BY_PRODUCT: Record<string, string> = {
  "audits-bpf": "https://8578fc93c64b486225957e22e281937d@o4511515922006016.ingest.us.sentry.io/4511520860733440",
  "nutri-agro-labels": "https://748d4b0598699748ac3e3178ccf77e4b@o4511515922006016.ingest.us.sentry.io/4511521005764608",
};

function detectProduct(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const url = new URL(window.location.href);
    const qp = url.searchParams.get("product");
    if (qp) return qp.toLowerCase();

    const host = window.location.hostname.toLowerCase();
    if (host.includes("audits") || host.includes("audit-bpf") || host.includes("audits-bpf")) return "audits-bpf";
    if (host.includes("nutri") && host.includes("label")) return "nutri-agro-labels";

    const path = window.location.pathname.toLowerCase();
    if (path.includes("/audit")) return "audits-bpf";
    if (path.includes("/label") || path.includes("/rotulo")) return "nutri-agro-labels";
  } catch {
    // ignore
  }
  return null;
}

function resolveDsn(): string {
  const product = detectProduct();
  if (product && DSN_BY_PRODUCT[product]) return DSN_BY_PRODUCT[product];
  return DSN_DEFAULT;
}

export const initSentry = () => {
  if (sentryInitialized || Sentry.getClient()) {
    sentryInitialized = true;
    return;
  }

  const dsn = resolveDsn();
  const product = detectProduct() ?? "default";
  if (dsn) {
    Sentry.init({
      dsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration(),
      ],
      tracesSampleRate: 0.1,
      replaysSessionSampleRate: 0.01,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      initialScope: { tags: { product } },
    });
    sentryInitialized = true;
    console.log(`Sentry initialized (product: ${product})`);
  }
};

export const captureError = (error: any, context?: any) => {
  console.error("Captured Error:", error, context);
  Sentry.captureException(error, { extra: context });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = "info") => {
  Sentry.captureMessage(message, level);
};
