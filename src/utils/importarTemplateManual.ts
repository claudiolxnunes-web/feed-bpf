import { supabase } from "@/integrations/supabase/client";
import { MANUAL_BPF_SECTIONS } from "@/config/manualBpfContent";
import { INSTRUCOES_TRABALHO } from "@/config/instrucoesTrabalho";
import { CampoModelo } from "@/config/feedBpfCustomConfig";

export async function importarTemplateManualBPF(empresaId: string, userId: string) {
  try {
    const camposManual: CampoModelo[] = MANUAL_BPF_SECTIONS.map((section) => ({
      id: `manual-${section.id}`,
      nome: section.titulo,
      tipo: "textarea",
      obrigatorio: true,
      valorPadrao: section.conteudo.join("\n"),
    }));

    // Importar Manual BPF
    const { error: errorManual } = await supabase.from("modelos_empresa" as any).insert({
      empresa_id: empresaId,
      user_id: userId,
      nome: "Manual de BPF - Template Oficial (Atualizado)",
      descricao: "Manual de Boas Práticas de Fabricação conforme IN 04/2007 e novos modelos enviados.",
      pop_codigo: "Manual",
      campos: camposManual as any,
      ativo: true,
    });

    if (errorManual) throw errorManual;

    // Criar modelos para cada Instrução de Trabalho (IT)
    for (const it of INSTRUCOES_TRABALHO) {
      const camposIT: CampoModelo[] = [
        { id: `${it.id}-objetivo`, nome: "Objetivo", tipo: "textarea", obrigatorio: true, valorPadrao: it.objetivo },
        { id: `${it.id}-materiais`, nome: "Materiais", tipo: "textarea", obrigatorio: false, valorPadrao: it.materiais.join("\n") },
        { id: `${it.id}-epis`, nome: "EPIs", tipo: "textarea", obrigatorio: false, valorPadrao: it.epis.join("\n") },
        { id: `${it.id}-passos`, nome: "Passo a Passo", tipo: "textarea", obrigatorio: true, valorPadrao: it.passos.join("\n") },
        { id: `${it.id}-criterios`, nome: "Critérios de Aceitação", tipo: "textarea", obrigatorio: true, valorPadrao: it.criteriosAceitacao.join("\n") },
        { id: `${it.id}-frequencia`, nome: "Frequência", tipo: "texto", obrigatorio: false, valorPadrao: it.frequencia },
        { id: `${it.id}-registro`, nome: "Registro Vinculado", tipo: "texto", obrigatorio: false, valorPadrao: it.registroVinculado || "" }
      ];

      await supabase.from("modelos_empresa" as any).insert({
        empresa_id: empresaId,
        user_id: userId,
        nome: `${it.id} — ${it.titulo}`,
        descricao: `Instrução de Trabalho vinculada ao ${it.popCodigo}.`,
        pop_codigo: it.popCodigo,
        campos: camposIT as any,
        ativo: true,
      });
    }

    return { success: true };
  } catch (error) {
    console.error("Erro ao importar templates:", error);
    return { success: false, error };
  }
}
