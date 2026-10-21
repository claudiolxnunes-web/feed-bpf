import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, ClipboardCheck, ShieldCheck, Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CONFIG } from "@/config/popsConfig";
import { INSTRUCOES_TRABALHO } from "@/config/instrucoesTrabalho";
import { garantirPlanilhaOperacional } from "@/lib/popPlanilhas";
import { sha256, gerarCarimbo } from "@/utils/carimboHash";
import { Link } from "react-router-dom";

interface Props {
  onVoltar: () => void;
}

export function RegistroPopGenerico({ onVoltar }: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [saving, setSaving] = useState(false);
  const [pinConfigurado, setPinConfigurado] = useState<boolean | null>(null);

  const [popCodigo, setPopCodigo] = useState("");
  const [itId, setItId] = useState("");
  const [setor, setSetor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [operadorNome, setOperadorNome] = useState("");
  const [pin, setPin] = useState("");

  const itsDoPop = useMemo(
    () => INSTRUCOES_TRABALHO.filter((it) => it.popCodigo === popCodigo),
    [popCodigo]
  );

  const itSelecionada = useMemo(
    () => INSTRUCOES_TRABALHO.find((it) => it.id === itId),
    [itId]
  );

  const popSelecionado = useMemo(
    () => POPS_CONFIG.find((p) => p.codigo === popCodigo),
    [popCodigo]
  );

  // Verifica se a empresa já tem PIN configurado
  useEffect(() => {
    if (!empresaAtiva?.id) return;
    supabase
      .from("empresa_pin")
      .select("id")
      .eq("empresa_id", empresaAtiva.id)
      .maybeSingle()
      .then(({ data }) => setPinConfigurado(!!data));
  }, [empresaAtiva?.id]);

  const salvar = async () => {
    if (!user || !empresaAtiva?.id) {
      toast({ title: "Selecione uma empresa ativa", variant: "destructive" });
      return;
    }
    if (!popCodigo || !itId || !operadorNome.trim() || !pin.trim()) {
      toast({ title: "Preencha POP, IT, nome e PIN", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // 1. Validar PIN
      const { data: pinRow } = await supabase
        .from("empresa_pin")
        .select("pin_hash")
        .eq("empresa_id", empresaAtiva.id)
        .maybeSingle();

      if (!pinRow) {
        toast({
          title: "PIN não configurado",
          description: "Peça ao Responsável Técnico para configurar o PIN da empresa em Configurações.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }

      const pinHashInput = await sha256(`${empresaAtiva.id}:${pin.trim()}`);
      if (pinHashInput !== pinRow.pin_hash) {
        toast({ title: "PIN incorreto", variant: "destructive" });
        setSaving(false);
        return;
      }

      // 2. Inserir execução POP
      const { data: execucao, error: errExec } = await supabase
        .from("execucao_pops")
        .insert({
          user_id: user.id,
          empresa_id: empresaAtiva.id,
          codigo_pop: popCodigo,
          nome_pop: popSelecionado?.nome || popCodigo,
          executor: operadorNome.trim(),
          setor: setor || itSelecionada?.titulo || "",
          status: "concluido",
          observacoes: [
            itSelecionada ? `IT: ${itSelecionada.id} — ${itSelecionada.titulo}` : null,
            observacoes,
          ]
            .filter(Boolean)
            .join("\n"),
        })
        .select()
        .single();

      if (errExec || !execucao) throw errExec || new Error("Falha ao criar execução");

      // 3. Gerar e salvar carimbo SHA-256
      const carimbo = await gerarCarimbo({
        execucao_id: execucao.id,
        empresa_id: empresaAtiva.id,
        operador: operadorNome.trim(),
        pop: popCodigo,
        it: itId,
        setor,
      });

      await supabase.from("execucao_pop_carimbos").insert({
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        execucao_id: execucao.id,
        operador_nome: operadorNome.trim(),
        hash_sha256: carimbo.hash,
        user_agent: carimbo.userAgent,
        carimbo_data: carimbo.timestamp,
      });

      const planilhaResult = await garantirPlanilhaOperacional({
        userId: user.id,
        empresaId: empresaAtiva.id,
        popCodigo,
        popNome: popSelecionado?.nome || popCodigo,
        itSelecionada,
      });

      if (planilhaResult.documentoId) {
        await supabase
          .from("execucao_pops")
          .update({ documento_id: planilhaResult.documentoId })
          .eq("id", execucao.id);
      }

      toast({
        title: "✅ Execução registrada com selo antifraude",
        description: planilhaResult.periodicidade
          ? planilhaResult.documentoVinculado
            ? planilhaResult.created
            ? `Hash: ${carimbo.hash.slice(0, 16)}... • Planilha ${planilhaResult.periodicidade.label} criada automaticamente.`
            : `Hash: ${carimbo.hash.slice(0, 16)}... • Planilha ${planilhaResult.periodicidade.label} já estava disponível.`
            : `Hash: ${carimbo.hash.slice(0, 16)}... • Cadastre o POP em Documentos para liberar a planilha automática.`
          : `Hash: ${carimbo.hash.slice(0, 16)}...`,
      });

      // Reset
      setPopCodigo("");
      setItId("");
      setSetor("");
      setObservacoes("");
      setOperadorNome("");
      setPin("");
      onVoltar();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao salvar";
      toast({ title: "Erro", description: msg, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-4">
      <Button variant="ghost" onClick={onVoltar} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardCheck className="w-6 h-6 text-primary" /> Registrar Execução POP / IT
            </h2>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />  Selo antifraude SHA-256 </p>
          </div>

          {pinConfigurado === false && (
            <div className="rounded-lg border-2 border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="font-semibold text-destructive flex items-center gap-2">
                <Lock className="w-4 h-4" /> PIN da empresa não configurado
              </p>
              <p className="text-muted-foreground mt-1">
                O Responsável Técnico precisa definir o PIN antes do uso.
              </p>
              <Link to="/configurar-pin">
                <Button size="sm" variant="outline" className="mt-2">
                  Configurar PIN agora
                </Button>
              </Link>
            </div>
          )}

          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">Antes de registrar uma nova execução</p>
            <p className="mt-1">
              Esta aba só mostra atividades depois que o POP/IT for cadastrado no módulo
              {" "}<span className="font-medium text-foreground">Documentos</span> para a empresa ativa.
            </p>
          </div>

          <div>
            <Label className="text-base">POP *</Label>
            <Select
              value={popCodigo}
              onValueChange={(v) => {
                setPopCodigo(v);
                setItId("");
              }}
            >
              <SelectTrigger className="h-12 text-base mt-1">
                <SelectValue placeholder="Selecione o POP executado" />
              </SelectTrigger>
              <SelectContent>
                {POPS_CONFIG.map((p) => (
                  <SelectItem key={p.codigo} value={p.codigo}>
                    {p.codigo} — {p.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-base">
              Instrução de Trabalho (IT) *
              {popCodigo && (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                  exibindo apenas ITs do {popCodigo}
                </span>
              )}
            </Label>
            <Select value={itId} onValueChange={setItId} disabled={!popCodigo}>
              <SelectTrigger className="h-12 text-base mt-1">
                <SelectValue placeholder={popCodigo ? "Selecione a IT" : "Escolha o POP primeiro"} />
              </SelectTrigger>
              <SelectContent>
                {itsDoPop.map((it) => (
                  <SelectItem key={it.id} value={it.id}>
                    [{it.popCodigo}] {it.id} — {it.titulo}
                  </SelectItem>
                ))}
                {itsDoPop.length === 0 && popCodigo && (
                  <div className="px-2 py-3 text-xs text-muted-foreground">
                    Nenhuma IT cadastrada para este POP.
                  </div>
                )}
              </SelectContent>
            </Select>
          </div>

          {itSelecionada && (
            <div className="rounded-lg border-l-4 border-primary bg-muted/50 p-3 text-xs space-y-1">
              <p className="flex items-center gap-2 mb-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary text-primary-foreground text-[10px] font-bold">
                  {itSelecionada.popCodigo}
                </span>
                <span className="font-mono text-[10px] text-muted-foreground">{itSelecionada.id}</span>
                <span className="font-semibold">{itSelecionada.titulo}</span>
              </p>
              <p><span className="font-semibold">Objetivo:</span> {itSelecionada.objetivo}</p>
              <p><span className="font-semibold">Frequência:</span> {itSelecionada.frequencia}</p>
            </div>
          )}

          <div>
            <Label className="text-base">Setor / Local</Label>
            <Input
              value={setor}
              onChange={(e) => setSetor(e.target.value)}
              className="text-lg h-12 mt-1"
              placeholder="Ex: Mistura, Silo 2, Depósito MP..."
            />
          </div>

          <div>
            <Label className="text-base">Observações</Label>
            <Textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              className="text-base mt-1"
              rows={3}
              placeholder="Detalhes do procedimento realizado..."
            />
          </div>

          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Lock className="w-4 h-4" /> Identificação do Operador
            </p>
            <div>
              <Label className="text-base">Nome do operador *</Label>
              <Input
                value={operadorNome}
                onChange={(e) => setOperadorNome(e.target.value)}
                className="text-lg h-12 mt-1"
                placeholder="Seu nome completo"
              />
            </div>
            <div>
              <Label className="text-base">PIN da empresa *</Label>
              <Input
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="text-lg h-12 mt-1 tracking-widest"
                type="password"
                inputMode="numeric"
                maxLength={10}
                placeholder="••••"
              />
            </div>
          </div>

          <Button
            onClick={salvar}
            disabled={saving || !popCodigo || !itId || !operadorNome || !pin}
            className="w-full h-14 text-lg"
            size="lg"
          >
            <CheckCircle2 className="w-5 h-5 mr-2" />
            {saving ? "Selando..." : "Registrar com Selo Antifraude"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
