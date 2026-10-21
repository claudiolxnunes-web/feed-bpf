import listCompanies from "./tools/list-companies";
import listRecalls from "./tools/list-recalls";

export const mcpServerInfo = { name: "feed-bpf-pro", title: "Feed_BPF_Pro", version: "0.1.0" };

export const mcpInstructions =
  "Consultas de leitura do Feed_BPF. Liste empresas antes de consultar simulações de recall. As consultas respeitam a conta conectada, a empresa escolhida e as permissões existentes. Não há ferramentas de alteração, exclusão, pagamento ou envio.";

export const mcpTools = [listCompanies, listRecalls];
