import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { getBaseLegal } from "@/config/baseLegal";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { registrarAuditLog } from "@/utils/auditLog";
import { mensagemErroRegistro } from "@/utils/registroImutavel";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Droplets,
  CheckCircle2,
  Clock,
  Trash2,
  FileWarning,
  ClipboardList,
  Download,
  ShieldCheck,
  Layers,
  FlaskConical,
  Container,
  Printer,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";
import { printElement } from "@/utils/printUtils";
import {
  AREAS,
  FREQUENCIAS,
  PONTOS_AGUA,
  CHECKLIST_PRE_OP,
  CHECKLIST_LIBERACAO_LINHA,
  CHECKLIST_SILOS_TRANSPORT,
  CHECKLIST_SUPERFICIES,
} from "@/components/higiene/constants";

export default function HigieneSanitizacao() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const empId = empresaAtiva?.id;
  /** Restringe qualquer consulta à empresa ativa (isolamento multiempresa). */
  const scope = <T,>(q: T): T => (empId ? (q as any).eq("empresa_id", empId) : q);
  const navigate = useNavigate();

  const qc = useQueryClient();
  const [openCronograma, setOpenCronograma] = useState(false);
  const [openRegistro, setOpenRegistro] = useState(false);
  const [openAgua, setOpenAgua] = useState(false);
  const [preOpChecklist, setPreOpChecklist] = useState<Record<string, boolean>>({});
  const [preOpResponsavel, setPreOpResponsavel] = useState("");
  const [preOpSetor, setPreOpSetor] = useState("");
  const [preOpData, setPreOpData] = useState(new Date().toISOString().split("T")[0]);
  const [savingPreOp, setSavingPreOp] = useState(false);
  const [selectedCronograma, setSelectedCronograma] = useState<string | null>(null);

  // Liberação de Linha state
  const [libLinhaChecklist, setLibLinhaChecklist] = useState<Record<string, boolean>>({});
  const [libLinhaResp, setLibLinhaResp] = useState("");
  const [libLinhaData, setLibLinhaData] = useState(new Date().toISOString().split("T")[0]);
  const [libLinhaProdAnterior, setLibLinhaProdAnterior] = useState("");
  const [libLinhaProdSeguinte, setLibLinhaProdSeguinte] = useState("");
  const [libLinhaLinha, setLibLinhaLinha] = useState("");
  const [libLinhaObs, setLibLinhaObs] = useState("");
  const [savingLibLinha, setSavingLibLinha] = useState(false);

  // Monitoramento de Superfícies state
  const [supChecklist, setSupChecklist] = useState<Record<string, boolean>>({});
  const [supResp, setSupResp] = useState("");
  const [supData, setSupData] = useState(new Date().toISOString().split("T")[0]);
  const [supSetor, setSupSetor] = useState("");
  const [supProdQuimico, setSupProdQuimico] = useState("");
  const [supConcentracao, setSupConcentracao] = useState("");
  const [supObs, setSupObs] = useState("");
  const [savingSup, setSavingSup] = useState(false);

  // Silos & Transportadores state
  const [silosChecklist, setSilosChecklist] = useState<Record<string, boolean>>({});
  const [silosResp, setSilosResp] = useState("");
  const [silosData, setSilosData] = useState(new Date().toISOString().split("T")[0]);
  const [silosEquipamento, setSilosEquipamento] = useState("");
  const [silosProdAnterior, setSilosProdAnterior] = useState("");
  const [silosObs, setSilosObs] = useState("");
  const [savingSilos, setSavingSilos] = useState(false);

  const [form, setForm] = useState({
    area: "",
    equipamento: "",
    procedimento: "",
    produto_utilizado: "",
    concentracao: "",
    frequencia: "diario",
    responsavel: "",
    horario_previsto: "",
    observacoes: "",
  });

  const [aguaChecklist, setAguaChecklist] = useState<Record<string, boolean>>({});
  const [aguaCheckResp, setAguaCheckResp] = useState("");
  const [aguaCheckData, setAguaCheckData] = useState(new Date().toISOString().split("T")[0]);
  const [savingAguaCheck, setSavingAguaCheck] = useState(false);

  // POP-03 Higiene Pessoal state
  const [higPesChecklist, setHigPesChecklist] = useState<Record<string, boolean>>({});
  const [higPesResp, setHigPesResp] = useState("");
  const [higPesData, setHigPesData] = useState(new Date().toISOString().split("T")[0]);
  const [higPesTurno, setHigPesTurno] = useState("");
  const [savingHigPes, setSavingHigPes] = useState(false);

  // Higienização de Reservatório state
  const [resChecklist, setResChecklist] = useState<Record<string, boolean>>({});
  const [resResp, setResResp] = useState("");
  const [resData, setResData] = useState(new Date().toISOString().split("T")[0]);
  const [resIdentificacao, setResIdentificacao] = useState("");
  const [resCapacidade, setResCapacidade] = useState("");
  const [resEmpresa, setResEmpresa] = useState("");
  const [resObs, setResObs] = useState("");
  const [savingRes, setSavingRes] = useState(false);

  const [sintomaChecklist, setSintomaChecklist] = useState<Record<string, boolean>>({});
  const [sintomaFuncionario, setSintomaFuncionario] = useState("");
  const [sintomaData, setSintomaData] = useState(new Date().toISOString().split("T")[0]);
  const [sintomaObs, setSintomaObs] = useState("");
  const [sintomaApto, setSintomaApto] = useState(true);
  const [savingSintoma, setSavingSintoma] = useState(false);

  const [regForm, setRegForm] = useState({
    cronograma_id: "",
    data_execucao: new Date().toISOString().split("T")[0],
    hora_inicio: "",
    hora_fim: "",
    executor: "",
    conforme: true,
    observacoes: "",
  });

  const [aguaForm, setAguaForm] = useState({
    ponto: PONTOS_AGUA[0],
    cloro_residual: "",
    ph: "",
    turbidez: "",
    data: new Date().toISOString().split("T")[0],
    responsavel: "",
    laudo_numero: "",
    laudo_valido: true,
    reservatorio_limpo: true,
    certificado_limpeza: "",
    observacoes: "",
  });

  const { data: cronogramas = [] } = useQuery({
    queryKey: ["cronogramas_higiene", empId],
    queryFn: async () => {
      const { data, error } = await scope(supabase.from("cronogramas_higiene").select("*").order("area"));
      if (error) throw error;
      return data;
    },
  });

  const { data: registros = [] } = useQuery({
    queryKey: ["registros_limpeza", selectedCronograma, empId],
    queryFn: async () => {
      let q = scope(supabase.from("registros_limpeza").select("*").order("data_execucao", { ascending: false }));
      if (selectedCronograma) q = q.eq("cronograma_id", selectedCronograma);
      const { data, error } = await q.limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: registrosAgua = [] } = useQuery({
    queryKey: ["registros_agua", empId],
    queryFn: async () => {
      const { data, error } = await scope(supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-04-AGUA"))
        .order("data_execucao", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
  });

  const { data: laudosAgua = [] } = useQuery({
    queryKey: ["laudos_agua", empId],
    queryFn: async () => {
      const { data, error } = await scope(
        supabase
          .from("analises_laboratorio")
          .select("*")
          .or(
            "produto.ilike.%água%,produto.ilike.%agua%,parametro.ilike.%cloro%,parametro.ilike.%coliform%,parametro.ilike.%turbidez%,parametro.ilike.%ph%",
          ),
      )
        .order("data_analise", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Histórico de Liberação de Linha
  const { data: historicoLibLinha = [] } = useQuery({
    queryKey: ["historico_lib_linha", empId],
    queryFn: async () => {
      const { data, error } = await scope(
        supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-02-LIB-LINHA"),
      )
        .order("data_execucao", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // ASO / Saúde dos manipuladores
  const { data: saudeManipuladores = [] } = useQuery({
    queryKey: ["saude_manipuladores_higiene", empId],
    queryFn: async () => {
      const { data, error } = await scope(supabase.from("saude_manipuladores").select("*")).order("data_validade", {
        ascending: true,
      });
      if (error) throw error;
      return data;
    },
  });

  // Histórico de sintomas diários
  const { data: historicoSintomas = [] } = useQuery({
    queryKey: ["historico_sintomas", empId],
    queryFn: async () => {
      const { data, error } = await scope(
        supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-03-SINTOMAS"),
      )
        .order("data_execucao", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: historicoSup = [] } = useQuery({
    queryKey: ["historico_sup", empId],
    queryFn: async () => {
      const { data, error } = await scope(
        supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-02-SUPERFICIE"),
      )
        .order("data_execucao", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const { data: historicoPreOp = [] } = useQuery({
    queryKey: ["historico_preop", empId],
    queryFn: async () => {
      const { data, error } = await scope(
        supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-02/03-PREOP"),
      )
        .order("data_execucao", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Histórico de Silos
  const { data: historicoSilos = [] } = useQuery({
    queryKey: ["historico_silos", empId],
    queryFn: async () => {
      const { data, error } = await scope(
        supabase.from("execucao_pops").select("*").in("codigo_pop", ["POP-02-SILOS", "POP-03-SILOS"]),
      )
        .order("data_execucao", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  const [mesAno, setMesAno] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const exportPlanilhaMensal = () => {
    const [ano, mes] = mesAno.split("-");
    const mesNome = new Date(parseInt(ano), parseInt(mes) - 1).toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    const registrosMes = registros.filter((r: any) => r.data_execucao?.startsWith(mesAno));
    const aguaMes = registrosAgua.filter((r: any) => r.data_execucao?.startsWith(mesAno));

    const lines = [
      `PLANILHA MENSAL DE HIGIENE E SANITIZAÇÃO — ${mesNome.toUpperCase()}`,
      `POPs 02, 03 e 04 — ${getBaseLegal("bpf_geral").citacao} | IN 15/2009`,
      "",
      "=== REGISTROS DE LIMPEZA ===",
      "Data;Executor;Hora Início;Hora Fim;Conforme;Observações",
      ...registrosMes.map((r: any) =>
        [
          r.data_execucao,
          r.executor,
          r.hora_inicio || "",
          r.hora_fim || "",
          r.conforme ? "Sim" : "Não",
          r.observacoes || "",
        ].join(";"),
      ),
      "",
      "=== CONTROLE DE ÁGUA (POP-04) ===",
      "Data;Ponto;Executor;Status;Detalhes",
      ...aguaMes.map((r: any) =>
        [
          r.data_execucao,
          r.setor || "",
          r.executor,
          r.status === "concluido" ? "Conforme" : "NC",
          (r.observacoes || "").replace(/\n/g, " | "),
        ].join(";"),
      ),
      "",
      `Total Registros Limpeza: ${registrosMes.length}`,
      `Total Registros Água: ${aguaMes.length}`,
      `Conformes Limpeza: ${registrosMes.filter((r: any) => r.conforme).length}`,
      `NCs Limpeza: ${registrosMes.filter((r: any) => !r.conforme).length}`,
    ];
    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `planilha_higiene_${mesAno}.csv`;
    link.click();
    toast.success("Planilha mensal exportada!");
  };

  const addCronograma = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("cronogramas_higiene")
        .insert({ ...form, user_id: user!.id, empresa_id: empId ?? null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] });
      toast.success("Cronograma cadastrado");
      setOpenCronograma(false);
      setForm({
        area: "",
        equipamento: "",
        procedimento: "",
        produto_utilizado: "",
        concentracao: "",
        frequencia: "diario",
        responsavel: "",
        horario_previsto: "",
        observacoes: "",
      });
    },
    onError: () => toast.error("Erro ao cadastrar"),
  });

  const addRegistro = useMutation({
    mutationFn: async () => {
      const payload = {
        ...regForm,
        user_id: user!.id,
        empresa_id: empId ?? null,
        tipo_limpeza: (regForm as any).tipo_limpeza || "umida",
      };
      const { data, error } = await supabase
        .from("registros_limpeza")
        .insert(payload as any)
        .select()
        .single();
      if (error) throw error;

      // Automatic NC Flow
      if (!regForm.conforme) {
        await supabase.from("nao_conformidades").insert({
          user_id: user!.id,
          empresa_id: empresaAtiva?.id || null,
          data: regForm.data_execucao,
          setor: "Higiene / Sanitização",
          descricao: `NC identificada no registro de limpeza: ${regForm.observacoes || "Sem descrição"}`,
          status: "pendente",
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registros_limpeza"] });
      toast.success("Registro salvo");
      setOpenRegistro(false);
    },
    onError: () => toast.error("Erro ao registrar"),
  });

  const addRegistroAgua = useMutation({
    mutationFn: async () => {
      const cloro = parseFloat(aguaForm.cloro_residual.replace(",", "."));
      const ph = parseFloat(aguaForm.ph.replace(",", "."));
      const turb = parseFloat(aguaForm.turbidez.replace(",", "."));
      const cloroOk = !isNaN(cloro) && cloro >= 0.2 && cloro <= 2.0;
      const phOk = !isNaN(ph) && ph >= 6.0 && ph <= 9.5;
      const turbOk = !isNaN(turb) && turb <= 5;
      const conforme = cloroOk && phOk && turbOk && aguaForm.laudo_valido && aguaForm.reservatorio_limpo;

      const obs = [
        `[CONTROLE DE ÁGUA — POP-04 / ${getBaseLegal("bpf_geral").citacao}]`,
        `Ponto: ${aguaForm.ponto}`,
        `Cloro residual: ${aguaForm.cloro_residual} mg/L ${cloroOk ? "✅" : "❌ FORA (0,2-2,0)"}`,
        `pH: ${aguaForm.ph} ${phOk ? "✅" : "❌ FORA (6,0-9,5)"}`,
        `Turbidez: ${aguaForm.turbidez} NTU ${turbOk ? "✅" : "❌ FORA (≤5)"}`,
        `Laudo nº: ${aguaForm.laudo_numero || "—"} | Válido: ${aguaForm.laudo_valido ? "Sim" : "Não"}`,
        `Reservatório limpo: ${aguaForm.reservatorio_limpo ? "Sim" : "Não"}`,
        aguaForm.certificado_limpeza ? `Cert. limpeza reserv.: ${aguaForm.certificado_limpeza}` : "",
        aguaForm.observacoes ? `Obs: ${aguaForm.observacoes}` : "",
      ]
        .filter(Boolean)
        .join("\n");

      const { error } = await supabase.from("execucao_pops").insert({
        user_id: user!.id,
        empresa_id: empId ?? null,
        codigo_pop: "POP-04-AGUA",
        nome_pop: "Controle Potabilidade da Água",
        executor: aguaForm.responsavel,
        setor: aguaForm.ponto,
        status: conforme ? "concluido" : "nao_conforme",
        observacoes: obs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["registros_agua"] });
      toast.success("Registro de água salvo");
      setOpenAgua(false);
      setAguaForm({
        ponto: PONTOS_AGUA[0],
        cloro_residual: "",
        ph: "",
        turbidez: "",
        data: new Date().toISOString().split("T")[0],
        responsavel: "",
        laudo_numero: "",
        laudo_valido: true,
        reservatorio_limpo: true,
        certificado_limpeza: "",
        observacoes: "",
      });
    },
    onError: () => toast.error("Erro ao registrar"),
  });

  const deleteCronograma = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cronogramas_higiene").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cronogramas_higiene"] });
      toast.success("Removido");
    },
  });

  const freqLabel = (v: string) => FREQUENCIAS.find((f) => f.value === v)?.label || v;

  // ── Save Liberação de Linha ──
  const salvarLibLinha = async () => {
    if (!user) return;
    setSavingLibLinha(true);
    const totalItens = CHECKLIST_LIBERACAO_LINHA.reduce((a, g) => a + g.itens.length, 0);
    const marcados = Object.values(libLinhaChecklist).filter(Boolean).length;
    const todosOk = marcados === totalItens;
    const ncs = CHECKLIST_LIBERACAO_LINHA.flatMap((g) =>
      g.itens.filter((item) => !libLinhaChecklist[`${g.area}__${item}`]).map((item) => `${g.area}: ${item}`),
    );

    const obs = [
      `[LIBERAÇÃO DE LINHA — POP-02 / ${getBaseLegal("bpf_geral").citacao} | IN 15/2009]`,
      `Data: ${libLinhaData} | Linha: ${libLinhaLinha || "—"}`,
      `Produto anterior: ${libLinhaProdAnterior || "—"}`,
      `Produto seguinte: ${libLinhaProdSeguinte || "—"}`,
      `Itens conformes: ${marcados}/${totalItens}`,
      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅",
      libLinhaObs ? `Obs: ${libLinhaObs}` : "",
      `[Registro com identificação do responsável, data e hora: ${libLinhaResp} — ${new Date().toLocaleString("pt-BR")}]`,
    ]
      .filter(Boolean)
      .join("\n");

    const { data: record, error } = await supabase
      .from("execucao_pops")
      .insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        codigo_pop: "POP-02-LIB-LINHA",
        nome_pop: "Checklist Liberação de Linha",
        executor: libLinhaResp,
        setor: libLinhaLinha || "Linha de Produção",
        status: todosOk ? "concluido" : "nao_conforme",
        observacoes: obs,
        data_execucao: libLinhaData,
      })
      .select()
      .single();

    if (!error && !todosOk) {
      await supabase.from("nao_conformidades").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        data: libLinhaData,
        setor: "Produção / Liberação de Linha",
        descricao: `NC identificada na Liberação de Linha: ${ncs.join("; ")}`,
        status: "pendente",
      });
    }
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Checklist de Liberação de Linha salvo!");
      qc.invalidateQueries({ queryKey: ["historico_lib_linha"] });
      setLibLinhaChecklist({});
      setLibLinhaResp("");
      setLibLinhaProdAnterior("");
      setLibLinhaProdSeguinte("");
      setLibLinhaLinha("");
      setLibLinhaObs("");
    }
    setSavingLibLinha(false);
  };

  const handleVerificar = async (tabela: string, id: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("nome").eq("user_id", user.id).single();
    const verificador = profile?.nome || user.email;

    const { error } = await (supabase.from(tabela as any) as any)
      .update({
        verificado_por: verificador,
        data_verificacao: new Date().toISOString(),
        status_verificacao: "aprovado",
      })
      .eq("id", id);

    if (error) toast.error("Erro ao verificar");
    else {
      toast.success("Registro verificado com sucesso!");
      qc.invalidateQueries();
    }
  };

  /** Registros de higiene não são excluídos (baseLegal: decreto_base) — correção via NC. */
  const handleCorrigirRegistro = (tabela: string, id: string, descricao: string) => {
    corrigirViaNC(navigate, { tabela, registroId: id, descricao });
  };

  // ── Save Monitoramento de Superfícies ──

  const salvarSup = async () => {
    if (!user) return;
    setSavingSup(true);
    const totalItens = CHECKLIST_SUPERFICIES.reduce((a, g) => a + g.itens.length, 0);
    const marcados = Object.values(supChecklist).filter(Boolean).length;
    const todosOk = marcados === totalItens;
    const ncs = CHECKLIST_SUPERFICIES.flatMap((g) =>
      g.itens.filter((item) => !supChecklist[`${g.area}__${item}`]).map((item) => `${g.area}: ${item}`),
    );

    const obs = [
      `[MONITORAMENTO DE SUPERFÍCIES — POP-02/03 / ${getBaseLegal("bpf_geral").citacao}]`,
      `Data: ${supData} | Setor: ${supSetor || "—"}`,
      `Produto químico: ${supProdQuimico || "—"} | Concentração: ${supConcentracao || "—"}`,
      `Itens conformes: ${marcados}/${totalItens}`,
      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todas as superfícies conformes ✅",
      supObs ? `Obs: ${supObs}` : "",
      `[Registro com identificação do responsável, data e hora: ${supResp} — ${new Date().toLocaleString("pt-BR")}]`,
    ]
      .filter(Boolean)
      .join("\n");

    const { data: record, error } = await supabase
      .from("execucao_pops")
      .insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        codigo_pop: "POP-02-SUPERFICIE",
        nome_pop: "Monitoramento de Limpeza de Superfícies",
        executor: supResp,
        setor: supSetor || "Produção",
        status: todosOk ? "concluido" : "nao_conforme",
        observacoes: obs,
        data_execucao: supData,
      })
      .select()
      .single();

    if (!error && !todosOk) {
      await supabase.from("nao_conformidades").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        data: supData,
        setor: "Higiene / Superfícies",
        descricao: `NC identificada no Monitoramento de Superfícies: ${ncs.join("; ")}`,
        status: "pendente",
      });
    }
    if (error) toast.error("Erro ao salvar: " + error.message);
    else {
      toast.success("Monitoramento de superfícies salvo!");
      qc.invalidateQueries({ queryKey: ["historico_sup"] });
      setSupChecklist({});
      setSupResp("");
      setSupSetor("");
      setSupProdQuimico("");
      setSupConcentracao("");
      setSupObs("");
    }
    setSavingSup(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Droplets}
        title="POP 02 - Higiene e Sanitização"
        description="Procedimentos de limpeza de instalações, equipamentos e utensílios"
        orientacaoModuloId="higiene"
        assuntoBaseLegal="bpf_geral"
      />

      <div className="flex flex-wrap justify-between items-center gap-3 mb-3">
        <Button variant="outline" size="sm" onClick={() => navigate("/documentos-bpf?tab=retencao")} className="gap-2">
          <Clock className="w-4 h-4" /> Gestão de Retenção (2 Anos)
        </Button>
        <AnexarPlanilhaPop popCodigo="POP-02" popNome="Higiene e Sanitização" />
      </div>

      <Tabs defaultValue="preop">
        <div className="w-full overflow-x-auto pb-1">
          <TabsList className="inline-flex w-max h-auto gap-1 p-1">
            <TabsTrigger value="preop" className="whitespace-nowrap">
              <ShieldCheck className="w-4 h-4 mr-1" />
              Pré-Operacional
            </TabsTrigger>
            <TabsTrigger value="liberacao" className="whitespace-nowrap">
              <Layers className="w-4 h-4 mr-1" />
              Liberação de Linha
            </TabsTrigger>
            <TabsTrigger value="superficies" className="whitespace-nowrap">
              <FlaskConical className="w-4 h-4 mr-1" />
              Superfícies
            </TabsTrigger>
            <TabsTrigger value="silos" className="whitespace-nowrap">
              <Container className="w-4 h-4 mr-1" />
              Silos & Transportadores
            </TabsTrigger>
            <TabsTrigger value="cronogramas" className="whitespace-nowrap">
              <Droplets className="w-4 h-4 mr-1" />
              Cronogramas
            </TabsTrigger>
            <TabsTrigger value="registros" className="whitespace-nowrap">
              <CheckCircle2 className="w-4 h-4 mr-1" />
              Registros Limpeza
            </TabsTrigger>
            <TabsTrigger value="planilha" className="whitespace-nowrap">
              <ClipboardList className="w-4 h-4 mr-1" />
              Planilha Mensal
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── CHECKLIST PRÉ-OPERACIONAL ── */}
        <TabsContent value="preop" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">
                    Checklist Pré-Operacional — POP 02/03 <BaseLegalBadge assunto="bpf_geral" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação obrigatória antes do início de cada turno/produção. Todos os itens devem ser
                    inspecionados e registrados{" "}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Responsável pela Inspeção *</Label>
              <Input
                value={preOpResponsavel}
                onChange={(e) => setPreOpResponsavel(e.target.value)}
                placeholder="Nome do inspetor"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Data</Label>
                <Input type="date" value={preOpData} onChange={(e) => setPreOpData(e.target.value)} />
              </div>
              <div>
                <Label>Setor/Turno</Label>
                <Select value={preOpSetor} onValueChange={setPreOpSetor}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Turno 1 (Manhã)">Turno 1 (Manhã)</SelectItem>
                    <SelectItem value="Turno 2 (Tarde)">Turno 2 (Tarde)</SelectItem>
                    <SelectItem value="Turno 3 (Noite)">Turno 3 (Noite)</SelectItem>
                    <SelectItem value="Turno Único">Turno Único</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_PRE_OP.map((grupo) => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map((item) => {
                      const key = `${grupo.area}__${item}`;
                      const checked = preOpChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch
                              checked={checked}
                              onCheckedChange={(v) => setPreOpChecklist((p) => ({ ...p, [key]: v }))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_PRE_OP.reduce((acc, g) => acc + g.itens.length, 0);
            const marcados = Object.values(preOpChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">
                    {marcados}/{totalItens} itens verificados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todosOk ? "✅ Todos os itens conformes" : "Conclua todos os itens para liberar"}
                  </p>
                </div>
                <Button
                  disabled={!preOpResponsavel || !preOpSetor || savingPreOp}
                  onClick={async () => {
                    if (!user) return;
                    setSavingPreOp(true);
                    const ncs = CHECKLIST_PRE_OP.flatMap((g) =>
                      g.itens
                        .filter((item) => !preOpChecklist[`${g.area}__${item}`])
                        .map((item) => `${g.area}: ${item}`),
                    );
                    const obs = [
                      `[CHECKLIST PRÉ-OPERACIONAL — POP-02/03]`,
                      `Data: ${preOpData} | Turno: ${preOpSetor}`,
                      `Itens conformes: ${marcados}/${totalItens}`,
                      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes",
                      `[Registro com identificação do responsável, data e hora: ${preOpResponsavel} — ${new Date().toLocaleString("pt-BR")}]`,
                    ].join("\n");
                    const { data: record, error } = await supabase
                      .from("execucao_pops")
                      .insert({
                        user_id: user.id,
                        empresa_id: empresaAtiva?.id || null,
                        codigo_pop: "POP-02/03-PREOP",
                        nome_pop: "Checklist Pré-Operacional Limpeza",
                        executor: preOpResponsavel,
                        setor: preOpSetor,
                        status: todosOk ? "concluido" : "nao_conforme",
                        observacoes: obs,
                        data_execucao: preOpData,
                      })
                      .select()
                      .single();

                    if (!error && !todosOk) {
                      await supabase.from("nao_conformidades").insert({
                        user_id: user.id,
                        empresa_id: empresaAtiva?.id || null,
                        data: preOpData,
                        setor: "Higiene / Pré-Operacional",
                        descricao: `NC identificada no Checklist Pré-Operacional: ${ncs.join("; ")}`,
                        status: "pendente",
                      });
                    }
                    if (error) toast.error("Erro ao salvar: " + error.message);
                    else {
                      toast.success("Checklist pré-operacional salvo!");
                      setPreOpChecklist({});
                      setPreOpResponsavel("");
                      setPreOpSetor("");
                    }
                    setSavingPreOp(false);
                  }}
                >
                  Salvar Checklist
                </Button>
              </div>
            );
          })()}

          {/* Histórico Pré-Op */}
          {historicoPreOp.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico Pré-Operacional</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Turno</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="max-w-[250px]">Detalhes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoPreOp.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                        ) : (
                          <Badge variant="destructive">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.status_verificacao === "aprovado" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {r.verificado_por}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => handleVerificar("execucao_pops", r.id)}
                          >
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs whitespace-pre-line truncate">
                        {(r.observacoes || "").slice(0, 120)}
                        {(r.observacoes?.length || 0) > 120 ? "…" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            handleCorrigirRegistro(
                              "execucao_pops",
                              r.id,
                              `Registro ${r.id} — ${r.data_execucao || r.data_limpeza || r.created_at}`,
                            )
                          }
                        >
                          <FileWarning className="w-3.5 h-3.5 text-primary" /> Corrigir via NC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── LIBERAÇÃO DE LINHA (POP-02 / baseLegal: bpf_geral | IN 15/2009) ── */}
        <TabsContent value="liberacao" className="space-y-4">
          <Card className="border-orange-500/20 bg-orange-50 dark:bg-orange-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Layers className="w-6 h-6 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">
                    Checklist de Liberação de Linha — POP-02 <BaseLegalBadge assunto="bpf_geral" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação obrigatória antes da troca de produto/lote na linha de produção. Garante ausência de
                    contaminação cruzada, conformidade com limites de carry-over (Ionóforos {"<"} 1%, Medicados {"<"}{" "}
                    3%) e rastreabilidade do flushing.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <Label>Responsável *</Label>
              <Input
                value={libLinhaResp}
                onChange={(e) => setLibLinhaResp(e.target.value)}
                placeholder="Nome do inspetor"
              />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={libLinhaData} onChange={(e) => setLibLinhaData(e.target.value)} />
            </div>
            <div>
              <Label>Produto Anterior</Label>
              <Input
                value={libLinhaProdAnterior}
                onChange={(e) => setLibLinhaProdAnterior(e.target.value)}
                placeholder="Ex: Ração Bovinos Engorda"
              />
            </div>
            <div>
              <Label>Produto Seguinte</Label>
              <Input
                value={libLinhaProdSeguinte}
                onChange={(e) => setLibLinhaProdSeguinte(e.target.value)}
                placeholder="Ex: Ração Suínos Crescimento"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Linha de Produção</Label>
              <Input
                value={libLinhaLinha}
                onChange={(e) => setLibLinhaLinha(e.target.value)}
                placeholder="Ex: Linha 01 — Farelados"
              />
            </div>
            <div>
              <Label>Observações Gerais</Label>
              <Input value={libLinhaObs} onChange={(e) => setLibLinhaObs(e.target.value)} placeholder="Opcional" />
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_LIBERACAO_LINHA.map((grupo) => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map((item) => {
                      const key = `${grupo.area}__${item}`;
                      const checked = libLinhaChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch
                              checked={checked}
                              onCheckedChange={(v) => setLibLinhaChecklist((p) => ({ ...p, [key]: v }))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_LIBERACAO_LINHA.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(libLinhaChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">
                    {marcados}/{totalItens} itens verificados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todosOk
                      ? "✅ Linha liberada — todos os itens conformes"
                      : "Conclua todos os itens para liberar a linha"}
                  </p>
                </div>
                <Button disabled={!libLinhaResp || savingLibLinha} onClick={salvarLibLinha}>
                  Salvar Liberação de Linha
                </Button>
              </div>
            );
          })()}

          {/* Histórico */}
          {historicoLibLinha.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico de Liberações de Linha</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Linha/Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="max-w-[250px]">Detalhes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {historicoLibLinha.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Liberada</Badge>
                        ) : (
                          <Badge variant="destructive">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.status_verificacao === "aprovado" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {r.verificado_por}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => handleVerificar("execucao_pops", r.id)}
                          >
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs whitespace-pre-line truncate">
                        {(r.observacoes || "").slice(0, 120)}
                        {(r.observacoes?.length || 0) > 120 ? "…" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            handleCorrigirRegistro(
                              "execucao_pops",
                              r.id,
                              `Registro ${r.id} — ${r.data_execucao || r.data_limpeza || r.created_at}`,
                            )
                          }
                        >
                          <FileWarning className="w-3.5 h-3.5 text-primary" /> Corrigir via NC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── MONITORAMENTO DE SUPERFÍCIES (POP-02/03 / baseLegal: bpf_geral) ── */}
        <TabsContent value="superficies" className="space-y-4">
          <Card className="border-emerald-500/20 bg-emerald-50 dark:bg-emerald-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FlaskConical className="w-6 h-6 text-emerald-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">
                    Monitoramento de Limpeza de Superfícies — POP-02/03 <BaseLegalBadge assunto="bpf_geral" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação da eficácia da limpeza em superfícies de contato direto e indireto. Inclui inspeção
                    visual, swab de superfície, teste de água de enxágue e bioluminescência ATP conforme os
                    procedimentos de BPF.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div>
              <Label>Responsável *</Label>
              <Input value={supResp} onChange={(e) => setSupResp(e.target.value)} placeholder="Nome do inspetor" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={supData} onChange={(e) => setSupData(e.target.value)} />
            </div>
            <div>
              <Label>Setor</Label>
              <Select value={supSetor} onValueChange={setSupSetor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Produção — Mistura">Produção — Mistura</SelectItem>
                  <SelectItem value="Produção — Ensaque">Produção — Ensaque</SelectItem>
                  <SelectItem value="Recepção de MP">Recepção de MP</SelectItem>
                  <SelectItem value="Expedição">Expedição</SelectItem>
                  <SelectItem value="Todas as áreas">Todas as áreas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Produto Químico</Label>
                <Input
                  value={supProdQuimico}
                  onChange={(e) => setSupProdQuimico(e.target.value)}
                  placeholder="Ex: Hipoclorito"
                />
              </div>
              <div>
                <Label>Concentração</Label>
                <Input
                  value={supConcentracao}
                  onChange={(e) => setSupConcentracao(e.target.value)}
                  placeholder="Ex: 200 ppm"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_SUPERFICIES.map((grupo) => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map((item) => {
                      const key = `${grupo.area}__${item}`;
                      const checked = supChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch
                              checked={checked}
                              onCheckedChange={(v) => setSupChecklist((p) => ({ ...p, [key]: v }))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Label>Observações</Label>
            <Textarea
              value={supObs}
              onChange={(e) => setSupObs(e.target.value)}
              placeholder="Detalhes sobre resultados de swab, ATP, ou outras observações relevantes"
            />
          </div>

          {(() => {
            const totalItens = CHECKLIST_SUPERFICIES.reduce((a, g) => a + g.itens.length, 0);
            const marcados = Object.values(supChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">
                    {marcados}/{totalItens} itens verificados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todosOk ? "✅ Todas as superfícies conformes" : "Conclua a inspeção de todas as superfícies"}
                  </p>
                </div>
                <Button disabled={!supResp || savingSup} onClick={salvarSup}>
                  Salvar Monitoramento
                </Button>
              </div>
            );
          })()}

          {/* Histórico */}
          {historicoSup.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico de Monitoramento de Superfícies</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="max-w-[250px]">Detalhes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {historicoSup.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                        ) : (
                          <Badge variant="destructive">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.status_verificacao === "aprovado" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {r.verificado_por}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => handleVerificar("execucao_pops", r.id)}
                          >
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs whitespace-pre-line truncate">
                        {(r.observacoes || "").slice(0, 120)}
                        {(r.observacoes?.length || 0) > 120 ? "…" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            handleCorrigirRegistro(
                              "execucao_pops",
                              r.id,
                              `Registro ${r.id} — ${r.data_execucao || r.data_limpeza || r.created_at}`,
                            )
                          }
                        >
                          <FileWarning className="w-3.5 h-3.5 text-primary" /> Corrigir via NC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── SILOS & TRANSPORTADORES (POP-03 / IN 15/2009) ── */}
        <TabsContent value="silos" className="space-y-4">
          <Card className="border-amber-500/20 bg-amber-50 dark:bg-amber-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Container className="w-6 h-6 text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Limpeza de Silos & Transportadores — POP-02 </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cronograma e checklist dedicado à higienização de silos e linhagens de transporte para prevenir o
                    arraste de medicamentos e aditivos entre lotes. Obrigatório{" "}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div>
              <Label>Responsável *</Label>
              <Input value={silosResp} onChange={(e) => setSilosResp(e.target.value)} placeholder="Nome do executor" />
            </div>
            <div>
              <Label>Data</Label>
              <Input type="date" value={silosData} onChange={(e) => setSilosData(e.target.value)} />
            </div>
            <div>
              <Label>Equipamento / Silo</Label>
              <Select value={silosEquipamento} onValueChange={setSilosEquipamento}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Silo 01">Silo 01</SelectItem>
                  <SelectItem value="Silo 02">Silo 02</SelectItem>
                  <SelectItem value="Silo 03">Silo 03</SelectItem>
                  <SelectItem value="Silo 04">Silo 04</SelectItem>
                  <SelectItem value="Silo 05">Silo 05</SelectItem>
                  <SelectItem value="Rosca Transportadora">Rosca Transportadora</SelectItem>
                  <SelectItem value="Elevador de Canecas">Elevador de Canecas</SelectItem>
                  <SelectItem value="Redler">Redler</SelectItem>
                  <SelectItem value="Transportador Pneumático">Transportador Pneumático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <Label>Produto anterior no equipamento</Label>
              <Input
                value={silosProdAnterior}
                onChange={(e) => setSilosProdAnterior(e.target.value)}
                placeholder="Ex: Ração Medicada Frangos"
              />
            </div>
            <div>
              <Label>Observações</Label>
              <Input
                value={silosObs}
                onChange={(e) => setSilosObs(e.target.value)}
                placeholder="Detalhes da limpeza..."
              />
            </div>
          </div>

          <div className="space-y-4">
            {CHECKLIST_SILOS_TRANSPORT.map((grupo) => (
              <Card key={grupo.area}>
                <CardHeader className="py-3">
                  <CardTitle className="text-sm font-display">{grupo.area}</CardTitle>
                </CardHeader>
                <CardContent className="py-0 pb-3">
                  <div className="space-y-2">
                    {grupo.itens.map((item) => {
                      const key = `${grupo.area}__${item}`;
                      const checked = silosChecklist[key] ?? false;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded border bg-background">
                          <span className="text-sm">{item}</span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-xs font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}
                            >
                              {checked ? "OK" : "—"}
                            </span>
                            <Switch
                              checked={checked}
                              onCheckedChange={(v) => setSilosChecklist((p) => ({ ...p, [key]: v }))}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(() => {
            const totalItens = CHECKLIST_SILOS_TRANSPORT.reduce((acc, g) => acc + g.itens.length, 0);
            const marcados = Object.values(silosChecklist).filter(Boolean).length;
            const todosOk = marcados === totalItens;
            return (
              <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                <div>
                  <p className="text-sm font-semibold">
                    {marcados}/{totalItens} itens verificados
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {todosOk
                      ? "✅ Todos os itens conformes — Equipamento liberado"
                      : "Conclua todos os itens para liberar"}
                  </p>
                </div>
                <Button
                  disabled={!silosResp || !silosEquipamento || savingSilos}
                  onClick={async () => {
                    if (!user) return;
                    setSavingSilos(true);
                    const ncs = CHECKLIST_SILOS_TRANSPORT.flatMap((g) =>
                      g.itens
                        .filter((item) => !silosChecklist[`${g.area}__${item}`])
                        .map((item) => `${g.area}: ${item}`),
                    );
                    const obs = [
                      `[LIMPEZA SILOS & TRANSPORTADORES — POP-02 / IN 15/2009]`,
                      `Data: ${silosData} | Equipamento: ${silosEquipamento}`,
                      `Produto anterior: ${silosProdAnterior || "—"}`,
                      `Itens conformes: ${marcados}/${totalItens}`,
                      ncs.length > 0 ? `NCs: ${ncs.join("; ")}` : "Todos conformes ✅",
                      silosObs ? `Obs: ${silosObs}` : "",
                    ]
                      .filter(Boolean)
                      .join("\n");
                    const { data: record, error } = await supabase
                      .from("execucao_pops")
                      .insert({
                        user_id: user.id,
                        empresa_id: empresaAtiva?.id || null,
                        codigo_pop: "POP-02-SILOS",
                        nome_pop: "Limpeza de Silos & Transportadores",
                        executor: silosResp,
                        setor: silosEquipamento,
                        status: todosOk ? "concluido" : "nao_conforme",
                        observacoes: obs,
                        data_execucao: silosData,
                      })
                      .select()
                      .single();

                    if (!error && !todosOk) {
                      await supabase.from("nao_conformidades").insert({
                        user_id: user.id,
                        empresa_id: empresaAtiva?.id || null,
                        data: silosData,
                        setor: `Higiene / ${silosEquipamento}`,
                        descricao: `NC identificada na Limpeza de Silos: ${ncs.join("; ")}`,
                        status: "pendente",
                      });
                    }
                    if (error) toast.error("Erro ao salvar: " + error.message);
                    else {
                      toast.success("Checklist de silos & transportadores salvo!");
                      setSilosChecklist({});
                      setSilosResp("");
                      setSilosEquipamento("");
                      setSilosProdAnterior("");
                      setSilosObs("");
                    }
                    setSavingSilos(false);
                  }}
                >
                  Salvar Checklist
                </Button>
              </div>
            );
          })()}

          {/* Histórico Silos */}
          {historicoSilos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Histórico de Limpeza de Silos</CardTitle>
              </CardHeader>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead className="max-w-[250px]">Detalhes</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historicoSilos.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>{r.setor}</TableCell>
                      <TableCell>
                        {r.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                        ) : (
                          <Badge variant="destructive">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.status_verificacao === "aprovado" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {r.verificado_por}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => handleVerificar("execucao_pops", r.id)}
                          >
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[250px] text-xs whitespace-pre-line truncate">
                        {(r.observacoes || "").slice(0, 120)}
                        {(r.observacoes?.length || 0) > 120 ? "…" : ""}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            handleCorrigirRegistro(
                              "execucao_pops",
                              r.id,
                              `Registro ${r.id} — ${r.data_execucao || r.data_limpeza || r.created_at}`,
                            )
                          }
                        >
                          <FileWarning className="w-3.5 h-3.5 text-primary" /> Corrigir via NC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── CRONOGRAMAS ── */}
        <TabsContent value="cronogramas" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openCronograma} onOpenChange={setOpenCronograma}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cronograma
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Cadastrar Cronograma de Limpeza</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Área / Setor *</Label>
                    <Select value={form.area} onValueChange={(v) => setForm((p) => ({ ...p, area: v }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {AREAS.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Equipamento</Label>
                    <Input
                      value={form.equipamento}
                      onChange={(e) => setForm((p) => ({ ...p, equipamento: e.target.value }))}
                      placeholder="Ex: Misturador 01"
                    />
                  </div>
                  <div>
                    <Label>Procedimento *</Label>
                    <Textarea
                      value={form.procedimento}
                      onChange={(e) => setForm((p) => ({ ...p, procedimento: e.target.value }))}
                      placeholder="Descreva o procedimento de limpeza"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Produto Utilizado</Label>
                      <Input
                        value={form.produto_utilizado}
                        onChange={(e) => setForm((p) => ({ ...p, produto_utilizado: e.target.value }))}
                        placeholder="Ex: Hipoclorito 2%"
                      />
                    </div>
                    <div>
                      <Label>Concentração</Label>
                      <Input
                        value={form.concentracao}
                        onChange={(e) => setForm((p) => ({ ...p, concentracao: e.target.value }))}
                        placeholder="Ex: 200 ppm"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Frequência *</Label>
                      <Select value={form.frequencia} onValueChange={(v) => setForm((p) => ({ ...p, frequencia: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FREQUENCIAS.map((f) => (
                            <SelectItem key={f.value} value={f.value}>
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Horário Previsto</Label>
                      <Input
                        value={form.horario_previsto}
                        onChange={(e) => setForm((p) => ({ ...p, horario_previsto: e.target.value }))}
                        placeholder="Ex: 06:00"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Responsável</Label>
                    <Input
                      value={form.responsavel}
                      onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={form.observacoes}
                      onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                    />
                  </div>
                  <Button onClick={() => addCronograma.mutate()} disabled={!form.area || !form.procedimento}>
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {cronogramas.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Droplets className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum cronograma cadastrado</p>
              </CardContent>
            </Card>
          ) : (
            <>
              {(() => {
                const silosEquips = [
                  "Silo 01",
                  "Silo 02",
                  "Silo 03",
                  "Silo 04",
                  "Silo 05",
                  "Misturador",
                  "Moinho",
                  "Peletizadora",
                  "Extrusora",
                  "Transportador / Elevador",
                ];
                const comCronograma = cronogramas.map((c: any) => c.area);
                const semCronograma = silosEquips.filter((s) => !comCronograma.includes(s));
                if (semCronograma.length === 0) return null;
                return (
                  <Card className="border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10 mb-4">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplets className="w-4 h-4 text-yellow-600" />
                        <h4 className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                          POP-02: Silos/Equipamentos sem Cronograma de Higienização
                        </h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        Mantenha o cronograma de higienização de todos os silos e equipamentos de produção.
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {semCronograma.map((s) => (
                          <Badge key={s} variant="outline" className="border-yellow-500 text-yellow-700">
                            {s}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })()}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Área</TableHead>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Frequência</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cronogramas.map((c: any) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.area}</TableCell>
                        <TableCell>{c.equipamento}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{c.procedimento}</TableCell>
                        <TableCell>
                          {c.produto_utilizado} {c.concentracao && `(${c.concentracao})`}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{freqLabel(c.frequencia)}</Badge>
                        </TableCell>
                        <TableCell>{c.responsavel}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" onClick={() => deleteCronograma.mutate(c.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── REGISTROS LIMPEZA ── */}
        <TabsContent value="registros" className="space-y-4">
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <Select
              value={selectedCronograma || "__all__"}
              onValueChange={(v) => setSelectedCronograma(v === "__all__" ? null : v)}
            >
              <SelectTrigger className="w-[300px]">
                <SelectValue placeholder="Filtrar por cronograma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos</SelectItem>
                {cronogramas.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.area} — {c.procedimento?.substring(0, 30)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Dialog open={openRegistro} onOpenChange={setOpenRegistro}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Registrar Execução
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Limpeza Realizada</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Cronograma *</Label>
                    <Select
                      value={regForm.cronograma_id}
                      onValueChange={(v) => setRegForm((p) => ({ ...p, cronograma_id: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {cronogramas.map((c: any) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.area} — {c.procedimento?.substring(0, 40)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {/* POP-02: Tipo de limpeza — IN 15/2009 */}
                  <div>
                    <Label>Tipo de Limpeza *</Label>
                    <Select
                      value={(regForm as any).tipo_limpeza || "umida"}
                      onValueChange={(v) => setRegForm((p) => ({ ...p, tipo_limpeza: v }) as any)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="seca">🧹 Limpeza Seca (vassouragem, aspiração, ar comprimido)</SelectItem>
                        <SelectItem value="umida">💧 Limpeza Úmida (lavagem com água e detergente)</SelectItem>
                        <SelectItem value="sanitizacao">🧴 Sanitização (aplicação de sanitizante)</SelectItem>
                        <SelectItem value="seca_umida">🔄 Seca + Úmida (combinada)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {(regForm as any).tipo_limpeza === "seca"
                        ? "Indicada para áreas onde umidade é indesejável (silos, elevadores, moegas). Não utilizar água."
                        : (regForm as any).tipo_limpeza === "sanitizacao"
                          ? "Aplicação de sanitizante após limpeza prévia. Registrar produto e concentração nas observações."
                          : (regForm as any).tipo_limpeza === "seca_umida"
                            ? "Processo completo: remoção mecânica seca + lavagem + enxágue."
                            : "Lavagem completa com água, detergente e enxágue final. Verificar secagem antes de retomar produção."}
                    </p>
                  </div>
                  <div>
                    <Label>Data</Label>
                    <Input
                      type="date"
                      value={regForm.data_execucao}
                      onChange={(e) => setRegForm((p) => ({ ...p, data_execucao: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Hora Início</Label>
                      <Input
                        value={regForm.hora_inicio}
                        onChange={(e) => setRegForm((p) => ({ ...p, hora_inicio: e.target.value }))}
                        placeholder="06:00"
                      />
                    </div>
                    <div>
                      <Label>Hora Fim</Label>
                      <Input
                        value={regForm.hora_fim}
                        onChange={(e) => setRegForm((p) => ({ ...p, hora_fim: e.target.value }))}
                        placeholder="06:30"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Executor *</Label>
                    <Input
                      value={regForm.executor}
                      onChange={(e) => setRegForm((p) => ({ ...p, executor: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={regForm.conforme}
                      onChange={(e) => setRegForm((p) => ({ ...p, conforme: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <Label>Conforme</Label>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={regForm.observacoes}
                      onChange={(e) => setRegForm((p) => ({ ...p, observacoes: e.target.value }))}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => printElement("registro-limpeza-preview", { title: "Registro de Limpeza" })}
                    >
                      <Printer className="w-4 h-4 mr-2" /> Imprimir
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => addRegistro.mutate()}
                      disabled={!regForm.cronograma_id || !regForm.executor}
                    >
                      Salvar Registro
                    </Button>
                  </div>

                  {/* Hidden preview for printing */}
                  <div id="registro-limpeza-preview" className="hidden">
                    <div className="p-8 text-black bg-white">
                      <h1 className="text-xl font-bold mb-4 text-center border-b pb-2 uppercase">
                        Registro de Execução de Limpeza
                      </h1>
                      <div className="grid grid-cols-2 gap-4 mb-6 border p-4 rounded">
                        <div>
                          <p>
                            <strong>Área:</strong>{" "}
                            {cronogramas.find((c: any) => c.id === regForm.cronograma_id)?.area || "—"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Data:</strong> {regForm.data_execucao}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Equipamento:</strong>{" "}
                            {cronogramas.find((c: any) => c.id === regForm.cronograma_id)?.equipamento || "—"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Executor:</strong> {regForm.executor}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Procedimento:</strong>{" "}
                            {cronogramas.find((c: any) => c.id === regForm.cronograma_id)?.procedimento || "—"}
                          </p>
                        </div>
                        <div>
                          <p>
                            <strong>Status:</strong> {regForm.conforme ? "CONFORME" : "NÃO CONFORME"}
                          </p>
                        </div>
                      </div>
                      <div className="border p-4 rounded min-h-[100px]">
                        <p className="font-bold mb-2">Observações:</p>
                        <p>{regForm.observacoes || "Sem observações adicionais."}</p>
                      </div>
                      <div className="mt-12 flex justify-between">
                        <div className="border-t border-black pt-2 w-48 text-center">
                          <p className="text-sm font-bold">Responsável</p>
                        </div>
                        <div className="border-t border-black pt-2 w-48 text-center">
                          <p className="text-sm font-bold">Data</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {registros.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum registro encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Tipo Limpeza</TableHead>
                    <TableHead>Horário</TableHead>
                    <TableHead>Conforme</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {registros.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.data_execucao}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {r.tipo_limpeza === "seca"
                            ? "🧹 Seca"
                            : r.tipo_limpeza === "sanitizacao"
                              ? "🧴 Sanitização"
                              : r.tipo_limpeza === "seca_umida"
                                ? "🔄 Seca+Úmida"
                                : "💧 Úmida"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.hora_inicio}
                        {r.hora_fim ? ` — ${r.hora_fim}` : ""}
                      </TableCell>
                      <TableCell>
                        {r.conforme ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                        ) : (
                          <Badge variant="destructive">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {r.status_verificacao === "aprovado" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {r.verificado_por}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => handleVerificar("registros_limpeza", r.id)}
                          >
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">{r.observacoes}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            handleCorrigirRegistro(
                              "registros_limpeza",
                              r.id,
                              `Registro ${r.id} — ${r.data_execucao || r.data_limpeza || r.created_at}`,
                            )
                          }
                        >
                          <FileWarning className="w-3.5 h-3.5 text-primary" /> Corrigir via NC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── LAUDOS VINCULADOS ── */}

        {/* ── PLANILHA MENSAL ── */}
        <TabsContent value="planilha" className="space-y-4">
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ClipboardList className="w-6 h-6 text-accent mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Planilha Mensal de Higiene e Sanitização</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Consolidação mensal dos registros de limpeza (POP-02/03) e controle de água (POP-04) para
                    acompanhamento e fiscalização.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <div>
              <Label>Mês/Ano</Label>
              <Input type="month" value={mesAno} onChange={(e) => setMesAno(e.target.value)} className="w-48" />
            </div>
            <Button variant="outline" onClick={exportPlanilhaMensal}>
              <Download className="w-4 h-4 mr-2" />
              Exportar Planilha Mensal
            </Button>
          </div>

          {(() => {
            const registrosMes = registros.filter((r: any) => r.data_execucao?.startsWith(mesAno));
            const aguaMes = registrosAgua.filter((r: any) => r.data_execucao?.startsWith(mesAno));
            const conformesLimp = registrosMes.filter((r: any) => r.conforme).length;
            const ncsLimp = registrosMes.filter((r: any) => !r.conforme).length;
            const conformesAgua = aguaMes.filter((r: any) => r.status === "concluido").length;
            const ncsAgua = aguaMes.filter((r: any) => r.status !== "concluido").length;

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-primary">{registrosMes.length}</p>
                      <p className="text-xs text-muted-foreground">Limpezas Realizadas</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{conformesLimp}</p>
                      <p className="text-xs text-muted-foreground">Conformes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{aguaMes.length}</p>
                      <p className="text-xs text-muted-foreground">Registros Água</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-destructive">{ncsLimp + ncsAgua}</p>
                      <p className="text-xs text-muted-foreground">Total NCs</p>
                    </CardContent>
                  </Card>
                </div>

                {registrosMes.length === 0 && aguaMes.length === 0 ? (
                  <Card>
                    <CardContent className="py-8 text-center text-muted-foreground">
                      Nenhum registro neste mês
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {registrosMes.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Registros de Limpeza — {mesAno}</CardTitle>
                        </CardHeader>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Executor</TableHead>
                              <TableHead>Horário</TableHead>
                              <TableHead>Conforme</TableHead>
                              <TableHead>Observações</TableHead>
                              <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {registrosMes.map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell>{r.data_execucao}</TableCell>
                                <TableCell>{r.executor}</TableCell>
                                <TableCell>
                                  {r.hora_inicio}
                                  {r.hora_fim ? ` — ${r.hora_fim}` : ""}
                                </TableCell>
                                <TableCell>
                                  {r.conforme ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                  ) : (
                                    <Badge variant="destructive">NC</Badge>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate">{r.observacoes}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 gap-1 text-xs"
                                    title="Registros não são excluídos — correção via Não Conformidade"
                                    onClick={() =>
                                      handleCorrigirRegistro(
                                        "registros_limpeza",
                                        r.id,
                                        `Registro ${r.id} — ${r.data_execucao || r.data_limpeza || r.created_at}`,
                                      )
                                    }
                                  >
                                    <FileWarning className="w-3.5 h-3.5 text-primary" /> Corrigir via NC
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                    {aguaMes.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Controle de Água — {mesAno}</CardTitle>
                        </CardHeader>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Data</TableHead>
                              <TableHead>Ponto</TableHead>
                              <TableHead>Executor</TableHead>
                              <TableHead>Status</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {aguaMes.map((r: any) => (
                              <TableRow key={r.id}>
                                <TableCell>{r.data_execucao}</TableCell>
                                <TableCell>{r.setor}</TableCell>
                                <TableCell>{r.executor}</TableCell>
                                <TableCell>
                                  {r.status === "concluido" ? (
                                    <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                                  ) : (
                                    <Badge variant="destructive">NC</Badge>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    )}
                  </>
                )}
              </>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
