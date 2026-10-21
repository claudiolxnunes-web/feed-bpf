import { z } from "zod";

export const respostaEquipe = z.object({ ok: z.boolean(), error: z.string().optional(), token: z.string().optional(), empresa_id: z.string().optional() });
export function conferirRespostaEquipe(data: unknown) {
  const resposta = respostaEquipe.parse(data);
  if (!resposta.ok) throw new Error(resposta.error ?? "Não foi possível concluir a operação.");
  return resposta;
}
export function linkConvite(token: string) {
  return new URL(`/aceitar-convite?token=${encodeURIComponent(token)}`, window.location.origin).href;
}
export async function copiarLink(link: string) {
  if (!navigator.clipboard) throw new Error("Não foi possível copiar. Selecione o link e copie manualmente.");
  await navigator.clipboard.writeText(link);
}