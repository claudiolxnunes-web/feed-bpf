import { useEffect, useState } from "react";
import { ShieldCheck, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { differenceInDays, parseISO } from "date-fns";
import ChecklistResumo from "@/components/checklist-pre-auditoria/ChecklistResumo";
import ChecklistLista from "@/components/checklist-pre-auditoria/ChecklistLista";
import { CheckItem } from "@/components/checklist-pre-auditoria/types";
import {
  buildChecklistItems,
  filterByEmpresa,
  getChecklistMetrics,
} from "@/components/checklist-pre-auditoria/helpers";

export default function ChecklistPreAuditoria() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<CheckItem[]>([]);
  const [loading, setLoading] = useState(true);

  const runCheck = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const [docsRes, popsRes, calibRes, treinRes, checklistRes, ncRes, rastrRes, higieneRes, simulRes] = await Promise.all([
      supabase.from("documentos").select("codigo, nome, status, proxima_revisao, validade_revisao, empresa_id").eq("user_id", user.id),
      supabase.from("pop_planilhas").select("pop_codigo, pop_nome, status, mes, ano, empresa_id").eq("user_id", user.id),
      supabase.from("calibracoes").select("equipamento, proxima_calibracao, status, empresa_id").eq("user_id", user.id),
      supabase.from("treinamentos").select("funcionario, treinamento, validade, empresa_id").eq("user_id", user.id),
      supabase.from("checklist_items").select("area, conforme, empresa_id").eq("user_id", user.id),
      supabase.from("nao_conformidades").select("status").eq("user_id", user.id),
      supabase.from("rastreabilidade").select("id, empresa_id").eq("user_id", user.id).limit(20),
      supabase.from("cronogramas_higiene").select("id, status, empresa_id").eq("user_id", user.id),
      supabase.from("simulacoes_recall" as any).select("data, empresa_id").eq("user_id", user.id),
    ]);

    const hoje = new Date();
    const docs = filterByEmpresa(docsRes.data || [], empresaAtiva?.id);
    const pops = filterByEmpresa(popsRes.data || [], empresaAtiva?.id);
    const calibracoes = filterByEmpresa(calibRes.data || [], empresaAtiva?.id);
    const treinamentos = filterByEmpresa(treinRes.data || [], empresaAtiva?.id);
    const checklistData = filterByEmpresa(checklistRes.data || [], empresaAtiva?.id);
    const rastreabilidade = filterByEmpresa(rastrRes.data || [], empresaAtiva?.id);
    const higiene = filterByEmpresa(higieneRes.data || [], empresaAtiva?.id);
    const simulacoes = filterByEmpresa((simulRes.data || []) as any[], empresaAtiva?.id);
    const ncs = ncRes.data || [];

    setItems(
      buildChecklistItems({
        hoje,
        differenceInDays,
        parseISO,
        docs,
        pops,
        calibracoes,
        treinamentos,
        checklistData,
        ncs,
        rastreabilidade,
        higiene,
        simulacoes,
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    runCheck();
  }, [user, empresaAtiva?.id]);

  const metrics = getChecklistMetrics(items);

  return (
    <>
      <PageHeader icon={ShieldCheck} title="Checklist Pré-Auditoria" description="Verificação automática de conformidade antes de auditorias do MAPA"
        orientacaoModuloId="checklist-pre-auditoria" />

      <div className="space-y-6">
        <ChecklistResumo metrics={metrics} items={items} loading={loading}>
          <Button variant="outline" size="sm" onClick={runCheck} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </ChecklistResumo>

        <ChecklistLista items={items} loading={loading} />
      </div>
    </>
  );
}
