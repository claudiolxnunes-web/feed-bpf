import { auth, defineMcp } from "@lovable.dev/mcp-js";
import listCompanies from "./tools/list-companies";
import listRecalls from "./tools/list-recalls";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";
export default defineMcp({
  name: "feed-bpf-pro", title: "Feed_BPF_Pro", version: "0.1.0",
  instructions: "Consultas de leitura do Feed_BPF. Liste empresas antes de consultar simulações de recall. As consultas respeitam a conta conectada, a empresa escolhida e as permissões existentes. Não há ferramentas de alteração, exclusão, pagamento ou envio.",
  auth: auth.oauth.issuer({ issuer: `https://${projectRef}.supabase.co/auth/v1`, acceptedAudiences: "authenticated", requireOAuthClientClaim: true }),
  tools: [listCompanies, listRecalls],
});