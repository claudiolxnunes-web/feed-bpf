import { useState, useEffect, useCallback } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface NutrientDef {
  key: string;
  label: string;
  unit: string;
  category: "macro" | "mineral" | "vitamin" | "aminoacido" | "custom";
}

const MACRO_NUTRIENTS: NutrientDef[] = [
  { key: "umidade", label: "Umidade", unit: "g/kg", category: "macro" },
  { key: "proteina_bruta", label: "Proteína Bruta", unit: "g/kg", category: "macro" },
  { key: "extrato_etereo", label: "Extrato Etéreo", unit: "g/kg", category: "macro" },
  { key: "fibra_bruta", label: "Fibra Bruta", unit: "g/kg", category: "macro" },
  { key: "materia_mineral", label: "Matéria Mineral", unit: "g/kg", category: "macro" },
  { key: "fda", label: "FDA", unit: "g/kg", category: "macro" },
  { key: "materia_fibrosa", label: "Matéria Fibrosa", unit: "g/kg", category: "macro" },
  { key: "ndt", label: "NDT", unit: "g/kg", category: "macro" },
  { key: "nnp_eq_proteina", label: "NNP Equiv. Proteína", unit: "g/kg", category: "macro" },
  { key: "fluor", label: "Flúor", unit: "mg/kg", category: "macro" },
  { key: "monensina_sodica", label: "Monensina Sódica", unit: "mg/kg", category: "macro" },
  { key: "consumo_pb", label: "Consumo em PB", unit: "g/dia", category: "macro" },
  { key: "consumo_ndt", label: "Consumo em NDT", unit: "g/dia", category: "macro" },
];

const MINERAL_NUTRIENTS: NutrientDef[] = [
  { key: "calcio", label: "Cálcio", unit: "g/kg", category: "mineral" },
  { key: "fosforo", label: "Fósforo", unit: "g/kg", category: "mineral" },
  { key: "sodio", label: "Sódio", unit: "mg/kg", category: "mineral" },
  { key: "magnesio", label: "Magnésio", unit: "mg/kg", category: "mineral" },
  { key: "enxofre", label: "Enxofre", unit: "mg/kg", category: "mineral" },
  { key: "potassio", label: "Potássio", unit: "mg/kg", category: "mineral" },
  { key: "cobalto", label: "Cobalto", unit: "mg/kg", category: "mineral" },
  { key: "cobre", label: "Cobre", unit: "mg/kg", category: "mineral" },
  { key: "iodo", label: "Iodo", unit: "mg/kg", category: "mineral" },
  { key: "manganes", label: "Manganês", unit: "mg/kg", category: "mineral" },
  { key: "selenio", label: "Selênio", unit: "mg/kg", category: "mineral" },
  { key: "zinco", label: "Zinco", unit: "mg/kg", category: "mineral" },
  { key: "ferro", label: "Ferro", unit: "mg/kg", category: "mineral" },
  { key: "cloro", label: "Cloro", unit: "mg/kg", category: "mineral" },
  { key: "cromo", label: "Cromo", unit: "mg/kg", category: "mineral" },
];

const VITAMIN_NUTRIENTS: NutrientDef[] = [
  { key: "vitamina_a", label: "Vitamina A", unit: "UI/kg", category: "vitamin" },
  { key: "vitamina_d3", label: "Vitamina D3", unit: "UI/kg", category: "vitamin" },
  { key: "vitamina_e", label: "Vitamina E", unit: "UI/kg", category: "vitamin" },
  { key: "vitamina_k3", label: "Vitamina K3", unit: "mg/kg", category: "vitamin" },
  { key: "vitamina_b1", label: "Vitamina B1", unit: "mg/kg", category: "vitamin" },
  { key: "vitamina_b2", label: "Vitamina B2", unit: "mg/kg", category: "vitamin" },
  { key: "vitamina_b6", label: "Vitamina B6", unit: "mg/kg", category: "vitamin" },
  { key: "vitamina_b12", label: "Vitamina B12", unit: "mcg/kg", category: "vitamin" },
  { key: "vitamina_c", label: "Vitamina C", unit: "mg/kg", category: "vitamin" },
  { key: "niacina", label: "Niacina", unit: "mg/kg", category: "vitamin" },
  { key: "acido_folico", label: "Ácido Fólico", unit: "mg/kg", category: "vitamin" },
  { key: "biotina", label: "Biotina", unit: "mg/kg", category: "vitamin" },
  { key: "colina", label: "Colina", unit: "mg/kg", category: "vitamin" },
  { key: "acido_pantotenico", label: "Ácido Pantotênico", unit: "mg/kg", category: "vitamin" },
];

const AMINOACID_NUTRIENTS: NutrientDef[] = [
  { key: "lisina", label: "Lisina", unit: "g/kg", category: "aminoacido" },
  { key: "metionina", label: "Metionina", unit: "g/kg", category: "aminoacido" },
  { key: "treonina", label: "Treonina", unit: "g/kg", category: "aminoacido" },
  { key: "triptofano", label: "Triptofano", unit: "g/kg", category: "aminoacido" },
];

const ALL_DEFAULT_NUTRIENTS = [...MACRO_NUTRIENTS, ...MINERAL_NUTRIENTS, ...VITAMIN_NUTRIENTS, ...AMINOACID_NUTRIENTS];

interface NutrientValue {
  min?: string;
  max?: string;
  unit: string;
}

interface Props {
  produtoId: string | null;
  onSaved: () => void;
}

export default function ProdutoForm({ produtoId, onSaved }: Props) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!produtoId);
  const draftKey = `draft_produto_${produtoId || "new"}`;

  // Restore draft from sessionStorage
  const getDraft = useCallback(() => {
    try {
      const saved = sessionStorage.getItem(draftKey);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }, [draftKey]);

  const draft = getDraft();

  const [nome, setNome] = useState(draft?.nome || "");
  const [marca, setMarca] = useState(draft?.marca || "");
  const [classificacao, setClassificacao] = useState(draft?.classificacao || "racao");
  const [especieAlvo, setEspecieAlvo] = useState(draft?.especieAlvo || "");
  const [categoriaAnimal, setCategoriaAnimal] = useState(draft?.categoriaAnimal || "");
  const [registroMapa, setRegistroMapa] = useState(draft?.registroMapa || "");
  const [pesoLiquido, setPesoLiquido] = useState(draft?.pesoLiquido || "");
  const [unidadePeso, setUnidadePeso] = useState(draft?.unidadePeso || "kg");
  const [validadeMeses, setValidadeMeses] = useState(draft?.validadeMeses || "6");
  const [formaFisica, setFormaFisica] = useState(draft?.formaFisica || "");
  const [armazenamento, setArmazenamento] = useState(draft?.armazenamento || "");
  const [modoUso, setModoUso] = useState(draft?.modoUso || "");
  const [precaucoes, setPrecaucoes] = useState(draft?.precaucoes || "");
  const [indicacoes, setIndicacoes] = useState(draft?.indicacoes || "");
  const [composicao, setComposicao] = useState(draft?.composicao || "");
  const [eventuaisSubstitutos, setEventuaisSubstitutos] = useState(draft?.eventuaisSubstitutos || "");
  const [diferenciais, setDiferenciais] = useState(draft?.diferenciais || "");
  const [modoPreparo, setModoPreparo] = useState(draft?.modoPreparo || "");
  const [embalagem, setEmbalagem] = useState(draft?.embalagem || "");
  const [observacoes, setObservacoes] = useState(draft?.observacoes || "");
  const [especieDestino, setEspecieDestino] = useState(draft?.especieDestino || "");
  const [linhaCompartilhada, setLinhaCompartilhada] = useState<boolean>(draft?.linhaCompartilhada || false);

  const [activeNutrients, setActiveNutrients] = useState<Set<string>>(() => draft?.activeNutrients ? new Set(draft.activeNutrients) : new Set());
  const [nutrientValues, setNutrientValues] = useState<Record<string, NutrientValue>>(draft?.nutrientValues || {});
  const [customNutrients, setCustomNutrients] = useState<NutrientDef[]>(draft?.customNutrients || []);
  const [newNutrientName, setNewNutrientName] = useState("");
  const [newNutrientUnit, setNewNutrientUnit] = useState("mg/kg");
  const [nutrientTab, setNutrientTab] = useState("macro");

  // Persist draft on every change
  useEffect(() => {
    const data = {
      nome, marca, classificacao, especieAlvo, categoriaAnimal, registroMapa,
      pesoLiquido, unidadePeso, validadeMeses, formaFisica, armazenamento,
      modoUso, precaucoes, indicacoes, composicao, eventuaisSubstitutos,
      diferenciais, modoPreparo, embalagem, observacoes,
      activeNutrients: Array.from(activeNutrients),
      nutrientValues, customNutrients,
    };
    sessionStorage.setItem(draftKey, JSON.stringify(data));
  }, [nome, marca, classificacao, especieAlvo, categoriaAnimal, registroMapa,
    pesoLiquido, unidadePeso, validadeMeses, formaFisica, armazenamento,
    modoUso, precaucoes, indicacoes, composicao, eventuaisSubstitutos,
    diferenciais, modoPreparo, embalagem, observacoes,
    activeNutrients, nutrientValues, customNutrients, draftKey]);

  const clearDraft = useCallback(() => sessionStorage.removeItem(draftKey), [draftKey]);

  useEffect(() => {
    if (produtoId) loadProduto();
  }, [produtoId]);

  async function loadProduto() {
    const { data } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
    if (data) {
      setNome(data.nome);
      setMarca(data.marca || "");
      setClassificacao(data.classificacao);
      setEspecieAlvo(data.especie_alvo || "");
      setCategoriaAnimal(data.categoria_animal || "");
      setRegistroMapa(data.registro_mapa || "");
      setPesoLiquido(data.peso_liquido || "");
      setUnidadePeso(data.unidade_peso || "kg");
      setValidadeMeses(String(data.validade_meses || 6));
      setFormaFisica(data.forma_fisica || "");
      setArmazenamento(data.armazenamento || "");
      setModoUso(data.modo_uso || "");
      setPrecaucoes(data.precaucoes || "");
      setIndicacoes(data.indicacoes || "");
      setComposicao(data.composicao || "");
      setDiferenciais(data.diferenciais || "");
      setModoPreparo(data.modo_preparo || "");
      setEmbalagem(data.embalagem || "");
      setObservacoes(data.observacoes || "");
      setEspecieDestino((data as any).especie_destino || "");
      setLinhaCompartilhada(!!(data as any).linha_compartilhada);

      // Parse niveis_garantia JSON - extract eventuais_substitutos if stored there
      const saved = (data.niveis_garantia as Record<string, any>) || {};
      if (saved._eventuais_substitutos) {
        setEventuaisSubstitutos(saved._eventuais_substitutos);
      }
      const active = new Set<string>();
      const vals: Record<string, NutrientValue> = {};
      const customs: NutrientDef[] = [];

      Object.entries(saved).forEach(([key, val]) => {
        if (key.startsWith("_")) return; // skip metadata keys
        active.add(key);
        if (typeof val === "object" && val !== null) {
          vals[key] = val as NutrientValue;
        } else {
          const def = ALL_DEFAULT_NUTRIENTS.find(n => n.key === key);
          vals[key] = { min: String(val || ""), unit: def?.unit || "mg/kg" };
        }
        if (!ALL_DEFAULT_NUTRIENTS.find(n => n.key === key)) {
          const v = vals[key];
          customs.push({ key, label: key, unit: v.unit || "mg/kg", category: "custom" });
        }
      });

      setActiveNutrients(active);
      setNutrientValues(vals);
      setCustomNutrients(customs);
    }
    setLoading(false);
  }

  function toggleNutrient(key: string, checked: boolean) {
    setActiveNutrients(prev => {
      const next = new Set(prev);
      if (checked) next.add(key); else next.delete(key);
      return next;
    });
    if (!checked) {
      setNutrientValues(prev => { const next = { ...prev }; delete next[key]; return next; });
    }
  }

  function updateNutrientVal(key: string, field: "min" | "max", val: string, unit: string) {
    setNutrientValues(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: val, unit }
    }));
  }

  function addCustomNutrient() {
    if (!newNutrientName.trim()) return;
    const key = newNutrientName.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_àáâãéêíóôõúç]/g, "");
    if (ALL_DEFAULT_NUTRIENTS.find(n => n.key === key) || customNutrients.find(n => n.key === key)) {
      toast.error("Nutriente já existe!");
      return;
    }
    const def: NutrientDef = { key, label: newNutrientName.trim(), unit: newNutrientUnit, category: "custom" };
    setCustomNutrients(prev => [...prev, def]);
    setActiveNutrients(prev => new Set(prev).add(key));
    setNewNutrientName("");
    setNewNutrientUnit("mg/kg");
    toast.success(`"${def.label}" adicionado!`);
  }

  function removeCustomNutrient(key: string) {
    setCustomNutrients(prev => prev.filter(n => n.key !== key));
    toggleNutrient(key, false);
  }

  async function handleSave() {
    if (!nome || !user) return;
    setSaving(true);

    const niveis: Record<string, any> = {};
    activeNutrients.forEach(key => {
      if (nutrientValues[key]) {
        niveis[key] = { min: nutrientValues[key].min || "", max: nutrientValues[key].max || "", unit: nutrientValues[key].unit || "" };
      }
    });
    // Store eventuais_substitutos alongside nutrients
    if (eventuaisSubstitutos.trim()) {
      niveis._eventuais_substitutos = eventuaisSubstitutos;
    }

    const payload = {
      user_id: user.id,
      nome, marca, classificacao,
      especie_alvo: especieAlvo,
      categoria_animal: categoriaAnimal,
      registro_mapa: registroMapa,
      peso_liquido: pesoLiquido,
      unidade_peso: unidadePeso,
      validade_meses: parseInt(validadeMeses) || 6,
      forma_fisica: formaFisica,
      armazenamento, modo_uso: modoUso,
      precaucoes, indicacoes, composicao,
      diferenciais, modo_preparo: modoPreparo,
      embalagem, observacoes,
      especie_destino: especieDestino || null,
      linha_compartilhada: linhaCompartilhada,
      niveis_garantia: niveis as any,
    };

    const { error } = produtoId
      ? await supabase.from("produtos").update(payload as any).eq("id", produtoId)
      : await supabase.from("produtos").insert(payload as any);

    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Produto salvo!"); clearDraft(); onSaved(); }
    setSaving(false);
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  function renderNutrientGrid(nutrients: NutrientDef[]) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {nutrients.map((n) => {
          const isActive = activeNutrients.has(n.key);
          const val: NutrientValue = nutrientValues[n.key] || { unit: n.unit };
          return (
            <div key={n.key} className={`border rounded-lg p-2.5 transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border"}`}>
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`nut-${n.key}`}
                  checked={isActive}
                  onCheckedChange={(c) => toggleNutrient(n.key, !!c)}
                />
                <label htmlFor={`nut-${n.key}`} className="text-sm font-medium cursor-pointer flex-1">
                  {n.label}
                </label>
                <span className="text-xs text-muted-foreground">{n.unit}</span>
                {n.category === "custom" && (
                  <button onClick={() => removeCustomNutrient(n.key)} className="text-destructive hover:text-destructive/80 ml-1">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              {isActive && (
                <div className="flex gap-2 mt-2">
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Mín.</Label>
                    <Input
                      className="h-7 text-xs"
                      value={val.min || ""}
                      onChange={(e) => updateNutrientVal(n.key, "min", e.target.value, n.unit)}
                      placeholder="0,00"
                    />
                  </div>
                  <div className="flex-1">
                    <Label className="text-[10px] text-muted-foreground">Máx.</Label>
                    <Input
                      className="h-7 text-xs"
                      value={val.max || ""}
                      onChange={(e) => updateNutrientVal(n.key, "max", e.target.value, n.unit)}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  const activeCount = (nutrients: NutrientDef[]) => nutrients.filter(n => activeNutrients.has(n.key)).length;

  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Informações Básicas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Nome do Produto *</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Ração Bovinos Engorda 22%" /></div>
            <div><Label>Marca Comercial</Label><Input value={marca} onChange={(e) => setMarca(e.target.value)} placeholder="Ex: NutriMax" /></div>
            <div>
              <Label>Classificação *</Label>
              <Select value={classificacao} onValueChange={setClassificacao}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="racao">Ração</SelectItem>
                  <SelectItem value="suplemento">Suplemento</SelectItem>
                  <SelectItem value="premix">Premix</SelectItem>
                  <SelectItem value="nucleo">Núcleo</SelectItem>
                  <SelectItem value="aditivo">Aditivo</SelectItem>
                  <SelectItem value="sal_mineral">Sal Mineral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Espécie Alvo</Label><Input value={especieAlvo} onChange={(e) => setEspecieAlvo(e.target.value)} placeholder="Ex: Bovinos" /></div>
            <div><Label>Categoria Animal</Label><Input value={categoriaAnimal} onChange={(e) => setCategoriaAnimal(e.target.value)} placeholder="Ex: Engorda, Cria, Lactação" /></div>
            <div><Label>Registro MAPA</Label><Input value={registroMapa} onChange={(e) => setRegistroMapa(e.target.value)} placeholder="Nº registro" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><Label>Peso Líquido</Label><Input value={pesoLiquido} onChange={(e) => setPesoLiquido(e.target.value)} placeholder="Ex: 40" /></div>
              <div><Label>Unidade</Label>
                <Select value={unidadePeso} onValueChange={setUnidadePeso}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">kg</SelectItem>
                    <SelectItem value="g">g</SelectItem>
                    <SelectItem value="t">ton</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Forma Física</Label><Input value={formaFisica} onChange={(e) => setFormaFisica(e.target.value)} placeholder="Ex: Farelado, Peletizado, Extrusado" /></div>
            <div><Label>Validade (meses)</Label><Input type="number" value={validadeMeses} onChange={(e) => setValidadeMeses(e.target.value)} /></div>
            <div><Label>Embalagem</Label><Input value={embalagem} onChange={(e) => setEmbalagem(e.target.value)} placeholder="Ex: Saco de ráfia 40kg" /></div>
            <div className="md:col-span-2 lg:col-span-3 border-t pt-3 mt-2">
              <Label className="text-sm font-semibold text-orange-700">⚠️ Risco Regulatório (MAPA/EEB)</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                <div>
                  <Label className="text-xs">Espécie de Destino</Label>
                  <Select value={especieDestino} onValueChange={setEspecieDestino}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monogastrico">Monogástrico (aves, suínos, peixes)</SelectItem>
                      <SelectItem value="ruminante">Ruminante (bovinos, ovinos, caprinos)</SelectItem>
                      <SelectItem value="equinos">Equinos</SelectItem>
                      <SelectItem value="pet">Pet (cães e gatos)</SelectItem>
                      <SelectItem value="ambos">Ambos (Mono + Rumi) ⚠️</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <Checkbox id="linha-comp" checked={linhaCompartilhada} onCheckedChange={(c) => setLinhaCompartilhada(!!c)} />
                  <label htmlFor="linha-comp" className="text-sm cursor-pointer">
                    Produzido em <strong>linha compartilhada</strong> com outras espécies
                  </label>
                </div>
              </div>
              {linhaCompartilhada && especieDestino === "ruminante" && (
                <p className="text-xs text-destructive mt-2 bg-destructive/10 p-2 rounded">
 ⚠️ Linha compartilhada para ruminantes exige validação de carry-over (PCP/Flushing).
 </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Composição e Substitutos */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Composição e Ingredientes</h3>
          <div>
            <Label>Composição Básica</Label>
            <Textarea value={composicao} onChange={(e) => setComposicao(e.target.value)} placeholder="Milho moído, farelo de soja, calcário calcítico, cloreto de sódio, enxofre ventilado..." rows={3} />
          </div>
          <div>
            <Label>Eventuais Substitutivos</Label>
            <Textarea value={eventuaisSubstitutos} onChange={(e) => setEventuaisSubstitutos(e.target.value)} placeholder="Farelo de algodão, casca de soja, milheto, sorgo integral moído, carbonato de cálcio..." rows={3} />
            <p className="text-[11px] text-muted-foreground mt-1">Ingredientes que podem substituir os da composição básica conforme disponibilidade.</p>
          </div>
        </CardContent>
      </Card>

      {/* Níveis de Garantia com abas */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <h3 className="font-semibold text-foreground">Níveis de Garantia por kg do Produto</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Marque os nutrientes que compõem o produto e preencha os valores mín./máx. 
              {activeNutrients.size > 0 && <span className="font-medium text-primary ml-1">({activeNutrients.size} selecionados)</span>}
            </p>
          </div>

          <Tabs value={nutrientTab} onValueChange={setNutrientTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              <TabsTrigger value="macro" className="text-xs">
                Macronutrientes {activeCount(MACRO_NUTRIENTS) > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{activeCount(MACRO_NUTRIENTS)}</span>}
              </TabsTrigger>
              <TabsTrigger value="mineral" className="text-xs">
                Minerais {activeCount(MINERAL_NUTRIENTS) > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{activeCount(MINERAL_NUTRIENTS)}</span>}
              </TabsTrigger>
              <TabsTrigger value="vitamin" className="text-xs">
                Vitaminas {activeCount(VITAMIN_NUTRIENTS) > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{activeCount(VITAMIN_NUTRIENTS)}</span>}
              </TabsTrigger>
              <TabsTrigger value="aminoacido" className="text-xs">
                Aminoácidos {activeCount(AMINOACID_NUTRIENTS) > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{activeCount(AMINOACID_NUTRIENTS)}</span>}
              </TabsTrigger>
              <TabsTrigger value="custom" className="text-xs">
                Personalizados {customNutrients.length > 0 && <span className="ml-1 text-[10px] bg-primary/20 text-primary rounded-full px-1.5">{customNutrients.length}</span>}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="macro" className="mt-4">
              {renderNutrientGrid(MACRO_NUTRIENTS)}
            </TabsContent>
            <TabsContent value="mineral" className="mt-4">
              {renderNutrientGrid(MINERAL_NUTRIENTS)}
            </TabsContent>
            <TabsContent value="vitamin" className="mt-4">
              {renderNutrientGrid(VITAMIN_NUTRIENTS)}
            </TabsContent>
            <TabsContent value="aminoacido" className="mt-4">
              {renderNutrientGrid(AMINOACID_NUTRIENTS)}
            </TabsContent>
            <TabsContent value="custom" className="mt-4 space-y-4">
              {customNutrients.length > 0 && renderNutrientGrid(customNutrients)}

              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-muted-foreground mb-2">Adicionar Novo Nutriente</h4>
                <div className="flex gap-2 items-end flex-wrap">
                  <div className="flex-1 min-w-[180px]">
                    <Label className="text-xs">Nome</Label>
                    <Input value={newNutrientName} onChange={(e) => setNewNutrientName(e.target.value)} placeholder="Ex: Fosfatidilcolina" className="h-8 text-sm" />
                  </div>
                  <div className="w-28">
                    <Label className="text-xs">Unidade</Label>
                    <Select value={newNutrientUnit} onValueChange={setNewNutrientUnit}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="g/kg">g/kg</SelectItem>
                        <SelectItem value="mg/kg">mg/kg</SelectItem>
                        <SelectItem value="mcg/kg">mcg/kg</SelectItem>
                        <SelectItem value="UI/kg">UI/kg</SelectItem>
                        <SelectItem value="%">%</SelectItem>
                        <SelectItem value="g/dia">g/dia</SelectItem>
                        <SelectItem value="mg/dia">mg/dia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" size="sm" className="h-8" onClick={addCustomNutrient} disabled={!newNutrientName.trim()}>
                    <Plus className="w-3 h-3 mr-1" />Adicionar
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Uso e Armazenamento */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <h3 className="font-semibold text-foreground">Uso, Armazenamento e Comercial</h3>
          <div><Label>Indicações de Uso</Label><Textarea value={indicacoes} onChange={(e) => setIndicacoes(e.target.value)} rows={2} /></div>
          <div><Label>Modo de Uso</Label><Textarea value={modoUso} onChange={(e) => setModoUso(e.target.value)} rows={2} /></div>
          <div><Label>Modo de Preparo</Label><Textarea value={modoPreparo} onChange={(e) => setModoPreparo(e.target.value)} rows={2} /></div>
          <div><Label>Precauções e Restrições</Label><Textarea value={precaucoes} onChange={(e) => setPrecaucoes(e.target.value)} rows={2} /></div>
          <div><Label>Armazenamento</Label><Input value={armazenamento} onChange={(e) => setArmazenamento(e.target.value)} placeholder="Local seco, arejado..." /></div>
          <div><Label>Diferenciais do Produto</Label><Textarea value={diferenciais} onChange={(e) => setDiferenciais(e.target.value)} rows={2} /></div>
          <div><Label>Observações</Label><Textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving || !nome} className="w-full md:w-auto">
        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {produtoId ? "Atualizar Produto" : "Cadastrar Produto"}
      </Button>
    </div>
  );
}
