import { REGRAS_VISITA, DECLARACOES_BIOSSEGURIDADE } from "@/components/visitantes/constants";
import { useState, useRef } from "react";
import { Printer, FileCheck, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useAuth } from "@/hooks/useAuth";
import { inserirCarimbo, CARIMBO_PLACEHOLDER } from "@/utils/carimboDocumento";
import { toast } from "sonner";





export default function DeclaracaoVisitante() {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const [form, setForm] = useState({
    nome: "", empresa_origem: "", documento: "", cargo: "", telefone: "", motivo: "",
  });
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [regrasAceitas, setRegrasAceitas] = useState(false);

  const allDeclaracoes = DECLARACOES_BIOSSEGURIDADE.every(d => checks[d.id]);
  const formValido = form.nome && form.documento && regrasAceitas && allDeclaracoes;

  const handlePrint = async () => {
    if (!formValido) {
      toast.error("Preencha todos os campos e marque todas as declarações antes de imprimir.");
      return;
    }

    const now = new Date();
    const dataHora = now.toLocaleString("pt-BR");
    const nomeEmpresa = empresaAtiva?.nome || "Empresa não selecionada";
    const cnpj = empresaAtiva?.cnpj || "";

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Declaração de Visitante</title>
<style>
  @page { size: A4 portrait; margin: 15mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #111; line-height: 1.5; }
  .header { text-align: center; border-bottom: 2px solid #1a365d; padding-bottom: 10px; margin-bottom: 14px; }
  .header h1 { font-size: 16px; color: #1a365d; margin-bottom: 2px; }
  .header h2 { font-size: 13px; color: #2d3748; margin-bottom: 2px; }
  .header .meta { font-size: 9px; color: #666; }
  .section-title { background: #1a365d; color: white; padding: 5px 10px; font-size: 11px; font-weight: bold; margin: 12px 0 8px; border-radius: 2px; }
  .dados-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px; }
  .campo { border: 1px solid #ccc; padding: 5px 8px; border-radius: 2px; }
  .campo-label { font-weight: bold; font-size: 9px; color: #555; text-transform: uppercase; }
  .campo-valor { font-size: 11px; min-height: 14px; }
  .regras-lista { list-style: none; counter-reset: item; }
  .regras-lista li { counter-increment: item; padding: 3px 0 3px 8px; font-size: 10px; border-bottom: 1px dotted #e2e8f0; }
  .regras-lista li::before { content: counter(item) ". "; font-weight: bold; color: #1a365d; }
  .declaracao-item { display: flex; align-items: flex-start; gap: 6px; padding: 4px 0; border-bottom: 1px dotted #e2e8f0; }
  .check-box { width: 12px; height: 12px; border: 1.5px solid #1a365d; display: inline-block; flex-shrink: 0; margin-top: 2px; text-align: center; font-size: 9px; font-weight: bold; color: #1a365d; }
  .check-box.checked::after { content: "✓"; }
  .declaracao-texto { font-size: 10px; flex: 1; }
  .assinaturas { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px; }
  .assinatura-bloco { text-align: center; }
  .assinatura-linha { border-top: 1px solid #333; padding-top: 4px; margin-top: 40px; }
  .assinatura-label { font-size: 10px; font-weight: bold; }
  .assinatura-sub { font-size: 9px; color: #555; }
  .footer { margin-top: 20px; text-align: center; font-size: 8px; color: #888; border-top: 1px solid #ddd; padding-top: 6px; }
  .alerta { background: #fff3cd; border: 1px solid #ffc107; padding: 6px 10px; border-radius: 3px; font-size: 9px; margin: 10px 0; text-align: center; font-weight: bold; }
</style></head><body>

<div class="header">
  <h1>${nomeEmpresa}</h1>
  ${cnpj ? `<p style="font-size:10px;color:#555;">CNPJ: ${cnpj}</p>` : ""}
  <h2>DECLARAÇÃO E TERMO DE RESPONSABILIDADE DO VISITANTE</h2>
  <p class="meta">Controle de Biosseguridade — IN 15/2009 | Decreto 12.031/2024 | Gerado em: ${dataHora}</p>
</div>

<div class="section-title">1. IDENTIFICAÇÃO DO VISITANTE</div>
<div class="dados-grid">
  <div class="campo"><div class="campo-label">Nome Completo</div><div class="campo-valor">${form.nome}</div></div>
  <div class="campo"><div class="campo-label">Empresa de Origem</div><div class="campo-valor">${form.empresa_origem || "—"}</div></div>
  <div class="campo"><div class="campo-label">Documento (RG/CPF)</div><div class="campo-valor">${form.documento}</div></div>
  <div class="campo"><div class="campo-label">Cargo/Função</div><div class="campo-valor">${form.cargo || "—"}</div></div>
  <div class="campo"><div class="campo-label">Telefone</div><div class="campo-valor">${form.telefone || "—"}</div></div>
  <div class="campo"><div class="campo-label">Motivo da Visita</div><div class="campo-valor">${form.motivo || "—"}</div></div>
</div>

<div class="section-title">2. REGRAS OBRIGATÓRIAS PARA ACESSO ÀS INSTALAÇÕES</div>
<p style="font-size:10px;margin-bottom:6px;font-weight:bold;">O visitante declara ter ciência e se compromete a cumprir integralmente as seguintes normas:</p>
<ol class="regras-lista">
  ${REGRAS_VISITA.map(r => `<li>${r}</li>`).join("")}
</ol>

<div class="section-title">3. DECLARAÇÕES DE BIOSSEGURIDADE</div>
<div class="alerta">⚠ ATENÇÃO: O preenchimento falso desta declaração configura infração sanitária e pode ensejar responsabilização nos termos da legislação vigente.</div>
${DECLARACOES_BIOSSEGURIDADE.map(d => `
  <div class="declaracao-item">
    <span class="check-box ${checks[d.id] ? "checked" : ""}"></span>
    <span class="declaracao-texto">${d.texto}</span>
  </div>
`).join("")}

<div class="section-title">4. ASSINATURAS</div>
<p style="font-size:10px;margin-bottom:4px;">Declaro que li, compreendi e concordo com todas as regras e declarações acima, assumindo total responsabilidade pela veracidade das informações prestadas.</p>
<p style="font-size:10px;margin-bottom:4px;">Local e Data: _________________________________, ${now.toLocaleDateString("pt-BR")}</p>

<div class="assinaturas">
  <div class="assinatura-bloco">
    <div class="assinatura-linha">
      <div class="assinatura-label">${form.nome || "Visitante"}</div>
      <div class="assinatura-sub">Documento: ${form.documento || "_______________"}</div>
    </div>
  </div>
  <div class="assinatura-bloco">
    <div class="assinatura-linha">
      <div class="assinatura-label">Responsável pelo Acompanhamento</div>
      <div class="assinatura-sub">Nome / Cargo / Assinatura</div>
    </div>
  </div>
</div>

<div class="footer">
  ${nomeEmpresa}${cnpj ? " — CNPJ: " + cnpj : ""} | Documento gerado em ${dataHora} | Válido somente com assinatura do visitante e acompanhante
</div>
${CARIMBO_PLACEHOLDER}

</body></html>`;

    const w = window.open("", "_blank");
    const { html: htmlFinal } = await inserirCarimbo(html, {
      documentoTipo: "Declaração de Visitante (Biosseguridade)",
      documentoId: form.nome,
      empresa: nomeEmpresa,
      usuario: user?.email,
    });
    if (w) {
      w.document.write(htmlFinal);
      w.document.close();
      w.onload = () => setTimeout(() => w.print(), 300);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-display">
            <FileCheck className="w-5 h-5 text-primary" />
            Declaração e Termo de Responsabilidade do Visitante
          </CardTitle>
          <p className="text-xs text-muted-foreground">
 Formulário completo de biosseguridade.
 Preencha, marque todas as declarações e imprima para assinatura física.
 </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados do visitante */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">1</span>
              Identificação do Visitante
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label className="text-xs">Nome Completo *</Label><Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Nome completo do visitante" /></div>
              <div><Label className="text-xs">Empresa de Origem</Label><Input value={form.empresa_origem} onChange={e => setForm(p => ({ ...p, empresa_origem: e.target.value }))} placeholder="Empresa do visitante" /></div>
              <div><Label className="text-xs">Documento (RG/CPF) *</Label><Input value={form.documento} onChange={e => setForm(p => ({ ...p, documento: e.target.value }))} placeholder="RG ou CPF" /></div>
              <div><Label className="text-xs">Cargo/Função</Label><Input value={form.cargo} onChange={e => setForm(p => ({ ...p, cargo: e.target.value }))} /></div>
              <div><Label className="text-xs">Telefone</Label><Input value={form.telefone} onChange={e => setForm(p => ({ ...p, telefone: e.target.value }))} /></div>
              <div><Label className="text-xs">Motivo da Visita</Label><Input value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))} placeholder="Ex: Auditoria, Manutenção, Fornecedor..." /></div>
            </div>
          </div>

          <Separator />

          {/* Regras */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">2</span>
              Regras Obrigatórias para Acesso
            </h3>
            <div className="bg-muted/40 rounded-lg p-4 space-y-2">
              {REGRAS_VISITA.map((r, i) => (
                <p key={i} className="text-xs flex items-start gap-2">
                  <span className="font-bold text-primary flex-shrink-0">{i + 1}.</span>
                  {r}
                </p>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-3 p-3 rounded-lg border border-primary/30 bg-primary/5">
              <Checkbox checked={regrasAceitas} onCheckedChange={(v) => setRegrasAceitas(!!v)} id="aceitar-regras" />
              <label htmlFor="aceitar-regras" className="text-xs font-medium cursor-pointer">
                Li e concordo com todas as regras de acesso acima.
              </label>
            </div>
          </div>

          <Separator />

          {/* Declarações de Biosseguridade */}
          <div>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="bg-primary text-primary-foreground rounded px-2 py-0.5 text-xs">3</span>
              <ShieldCheck className="w-4 h-4 text-yellow-600" />
              Declarações de Biosseguridade
            </h3>
            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-500/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-yellow-800 dark:text-yellow-200 font-semibold text-center">
                ⚠ O preenchimento falso desta declaração configura infração sanitária e pode ensejar responsabilização civil e criminal.
              </p>
            </div>
            <div className="space-y-2">
              {DECLARACOES_BIOSSEGURIDADE.map(d => (
                <div key={d.id} className="flex items-start gap-3 p-2 rounded border border-border hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={!!checks[d.id]}
                    onCheckedChange={(v) => setChecks(p => ({ ...p, [d.id]: !!v }))}
                    id={`decl-${d.id}`}
                    className="mt-0.5"
                  />
                  <label htmlFor={`decl-${d.id}`} className="text-xs cursor-pointer flex-1 leading-relaxed">
                    {d.texto}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Imprimir */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
            <div>
              <p className="text-sm font-semibold">Pronto para impressão</p>
              <p className="text-xs text-muted-foreground">O documento será gerado com nome da empresa, data/hora e campos de assinatura.</p>
            </div>
            <Button onClick={handlePrint} disabled={!formValido} className="gap-2">
              <Printer className="w-4 h-4" />
              Imprimir Declaração
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
