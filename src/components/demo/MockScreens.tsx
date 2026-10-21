import { textoTela } from "@/lib/textoTela";
import { BaseLegalBadge } from "@/components/BaseLegalBadge";
/**
 * Mockups visuais (HTML/Tailwind) para a página de Demo.
 * Dados 100% fictícios — empresa "Fábrica Demo Ltda".
 * Texto em português correto, substituindo as imagens geradas por IA.
 */
import {
  CheckCircle2, AlertTriangle, XCircle, Clock, FileText, Users, Truck, Factory,
  ClipboardCheck, ShieldCheck, BarChart3, MapPin, Target, Calendar, BookOpen,
  TrendingUp, AlertCircle, FlaskConical, Package, GitBranch, Search, Star,
  Phone, Mail, Building2, Award, DollarSign, Activity,
} from "lucide-react";

// ============ helpers visuais ============
const Frame = ({ children, title }: { children: React.ReactNode; title: string }) => (
  <div className="w-full bg-slate-50 rounded-lg overflow-hidden border border-slate-200 text-slate-800 text-sm">
    {/* barra de janela */}
    <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 border-b border-slate-200">
      <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      <span className="ml-3 text-[11px] text-slate-500 truncate">{title}</span>
    </div>
    <div className="p-4 sm:p-5">{children}</div>
  </div>
);

const Kpi = ({ icon: Icon, label, value, tone = "emerald", sub }: any) => (
  <div className="bg-white rounded-md border border-slate-200 p-3">
    <div className="flex items-center justify-between">
      <span className="text-[11px] uppercase tracking-wide text-slate-500">{label}</span>
      <Icon className={`h-4 w-4 text-${tone}-600`} />
    </div>
    <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    {sub && <div className="text-[11px] text-slate-500 mt-0.5">{sub}</div>}
  </div>
);

const Bar = ({ label, pct, tone = "emerald" }: { label: string; pct: number; tone?: string }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span>{label}</span>
      <span className="font-medium">{pct}%</span>
    </div>
    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
      <div className={`h-full bg-${tone}-500`} style={{ width: `${pct}%` }} />
    </div>
  </div>
);

const Pill = ({ children, tone = "emerald" }: any) => (
  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-${tone}-100 text-${tone}-700`}>
    {children}
  </span>
);

// =================================================================
// FEED_BPF — 10 telas
// =================================================================

export const FeedDashboard = () => (
  <Frame title="feedbpf.com.br/dashboard — Fábrica Demo Ltda">
    <div className="flex items-center justify-between mb-4">
      <div>
        <h3 className="text-base font-bold">Dashboard de Conformidade BPF</h3>
        <p className="text-xs text-slate-500"> · Fiscalização MAPA</p>
      </div>
      <Pill tone="emerald">Conformidade 92%</Pill>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Kpi icon={ShieldCheck} label="POPs Ativos" value="10/10" tone="emerald" />
      <Kpi icon={AlertTriangle} label="NCs Abertas" value="3" tone="amber" sub="2 em tratamento" />
      <Kpi icon={Clock} label="Calibrações" value="2" tone="rose" sub="vencidas" />
      <Kpi icon={Users} label="Treinamentos" value="87%" tone="emerald" sub="em dia" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="text-xs font-semibold mb-2">Conformidade por POP</div>
        <div className="space-y-2">
          <Bar label="POP-01 Recebimento" pct={95} />
          <Bar label="POP-02 Higienização" pct={88} />
          <Bar label="POP-04 Água" pct={100} tone="emerald" />
          <Bar label="POP-07 Pragas" pct={75} tone="amber" />
        </div>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="text-xs font-semibold mb-2">Próximas atividades (7 dias)</div>
        <ul className="space-y-1.5 text-xs">
          <li className="flex justify-between"><span>Análise de água — reservatório R1</span><span className="text-amber-600">02/05</span></li>
          <li className="flex justify-between"><span>Calibração balança B-002</span><span className="text-rose-600">Vencida</span></li>
          <li className="flex justify-between"><span>Treinamento BPF — Equipe noite</span><span className="text-slate-500">05/05</span></li>
          <li className="flex justify-between"><span>Auditoria interna trimestral</span><span className="text-slate-500">08/05</span></li>
        </ul>
      </div>
    </div>
  </Frame>
);

export const FeedDocumentos = () => {
  const pops = [
    { n: "POP-01", nome: "Recebimento de Matérias-Primas", status: "Ativo", rev: "Rev 03 · 12/03/2026" },
    { n: "POP-02", nome: "Higienização e Sanitização", status: "Ativo", rev: "Rev 02 · 20/01/2026" },
    { n: "POP-03", nome: "Saúde do Pessoal e Visitantes", status: "Ativo", rev: "Rev 04 · 05/02/2026" },
    { n: "POP-04", nome: "Potabilidade da Água", status: "Ativo", rev: "Rev 02 · 15/03/2026" },
    { n: "POP-05", nome: "Armazenamento e Transporte", status: "Em revisão", rev: "Rev 01 · 28/02/2026" },
    { n: "POP-06", nome: "Manutenção e Calibração", status: "Ativo", rev: "Rev 03 · 10/01/2026" },
    { n: "POP-07", nome: "Controle de Pragas e Expurgo", status: "Ativo", rev: "Rev 02 · 18/03/2026" },
    { n: "POP-08", nome: "Gestão de Resíduos e Efluentes", status: "Ativo", rev: "Rev 01 · 22/02/2026" },
    { n: "POP-09", nome: "Expedição de Produto Acabado", status: "Ativo", rev: "Rev 02 · 14/03/2026" },
    { n: "POP-10", nome: "Recall e Rastreabilidade", status: "Ativo", rev: "Rev 03 · 01/04/2026" },
  ];
  return (
    <Frame title="feedbpf.com.br/documentos — POPs Obrigatórios">
      <h3 className="text-base font-bold mb-3">Documentos & POPs Obrigatórios</h3>
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <table className="w-full text-xs">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="text-left px-3 py-2">POP</th>
              <th className="text-left px-3 py-2">Procedimento</th>
              <th className="text-left px-3 py-2">Revisão</th>
              <th className="text-left px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {pops.map((p) => (
              <tr key={p.n} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono font-semibold text-emerald-700">{p.n}</td>
                <td className="px-3 py-2">{p.nome}</td>
                <td className="px-3 py-2 text-slate-500">{p.rev}</td>
                <td className="px-3 py-2">
                  {p.status === "Ativo"
                    ? <Pill tone="emerald">Ativo</Pill>
                    : <Pill tone="amber">Em revisão</Pill>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
};

export const FeedRastreabilidade = () => (
  <Frame title="feedbpf.com.br/rastreabilidade">
    <h3 className="text-base font-bold mb-1">Rastreabilidade do Lote PA-2026-0428</h3>
    <p className="text-xs text-slate-500 mb-4">Ração Bovino Confinamento · 24.000 kg · Fabricado em 28/04/2026</p>
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold text-slate-700 mb-2 flex items-center gap-1"><Package className="h-3 w-3"/> Matérias-Primas</div>
        <ul className="space-y-1 text-slate-600">
          <li>• Milho moído — Lote MP-1142</li>
          <li>• Farelo de soja — Lote MP-1158</li>
          <li>• Núcleo mineral — Lote MP-1160</li>
          <li>• Ureia pecuária — Lote MP-1163</li>
        </ul>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold text-slate-700 mb-2 flex items-center gap-1"><Factory className="h-3 w-3"/> Produção</div>
        <ul className="space-y-1 text-slate-600">
          <li>Ordem: OP-2026-0832</li>
          <li>Mistura: 4 min 12 s ✓</li>
          <li>Flush anterior: OK</li>
          <li>Operador: Carlos M.</li>
        </ul>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold text-slate-700 mb-2 flex items-center gap-1"><Truck className="h-3 w-3"/> Expedição</div>
        <ul className="space-y-1 text-slate-600">
          <li>NF-e: 0034 521</li>
          <li>Cliente: Faz. Boa Vista</li>
          <li>Transp.: Rodovias União</li>
          <li>Saída: 28/04 16:42</li>
        </ul>
      </div>
    </div>
    <div className="mt-3 p-2 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-800 flex items-center gap-2">
      <CheckCircle2 className="h-4 w-4"/> Cadeia completa rastreável — segregação por espécie OK 
 </div>
  </Frame>
);

export const FeedRecall = () => (
  <Frame title="feedbpf.com.br/recall — Simulação">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Simulação de Recall · <BaseLegalBadge assunto="recolhimento_recall" /></h3>
      <div className="font-mono text-base text-rose-600 font-bold">⏱ 00:42:18</div>
    </div>
    <div className="grid grid-cols-2 gap-3 text-xs">
      {[
        ["1. Identificação do problema", true],
        ["2. Avaliação de risco", true],
        ["3. Definição da equipe de crise", true],
        ["4. Identificação dos lotes afetados", true],
        ["5. Notificação interna", true],
        ["6. Notificação ao MAPA/SDA", false],
        ["7. Comunicação aos clientes", false],
        ["8. Recolhimento físico", false],
        ["9. Destinação final", false],
        ["10. Relatório final + lições", false],
      ].map(([txt, done]) => (
        <div key={txt as string} className="flex items-center gap-2 bg-white p-2 rounded border border-slate-200">
          {done
            ? <CheckCircle2 className="h-4 w-4 text-emerald-600"/>
            : <Clock className="h-4 w-4 text-slate-400"/>}
          <span className={done ? "text-slate-700" : "text-slate-400"}>{txt}</span>
        </div>
      ))}
    </div>
    <div className="mt-3 text-xs text-slate-500">Lote alvo: <b className="font-mono">PA-2026-0399</b> · 12.500 kg · 8 clientes notificados</div>
  </Frame>
);

export const FeedAuditoria = () => (
  <Frame title="feedbpf.com.br/auditoria — Checklist 80 itens">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-base font-bold">Auditoria BPF · <BaseLegalBadge assunto="autocontrole" /></h3>
        <p className="text-xs text-slate-500">Auditoria trimestral · Aud. interno: Eng. Roberto Lima</p>
      </div>
      <div className="text-right">
        <div className="text-2xl font-bold text-emerald-600">87,5%</div>
        <div className="text-[10px] text-slate-500">SCORE GERAL</div>
      </div>
    </div>
    <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
      <div className="bg-emerald-50 p-2 rounded text-center"><div className="font-bold text-emerald-700">62</div><div className="text-[10px]">Conforme</div></div>
      <div className="bg-amber-50 p-2 rounded text-center"><div className="font-bold text-amber-700">9</div><div className="text-[10px]">NC Menor</div></div>
      <div className="bg-rose-50 p-2 rounded text-center"><div className="font-bold text-rose-700">3</div><div className="text-[10px]">NC Maior</div></div>
      <div className="bg-slate-100 p-2 rounded text-center"><div className="font-bold text-slate-700">6</div><div className="text-[10px]">N/A</div></div>
    </div>
    <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100 text-xs">
      {[
        ["Art. 12", "Áreas externas conservadas e limpas", "ok"],
        ["Art. 18", "Pisos íntegros e laváveis nas áreas internas", "ok"],
        ["Art. 23", "Reservatório de água higienizado a cada 6 meses", "nc"],
        ["Art. 31", "Identificação e segregação de matérias-primas", "ok"],
        ["Art. 47", "Tempo mínimo de mistura ≥ 3 min", "ok"],
        ["Art. 58", "Programa documentado de controle de pragas", "warn"],
      ].map(([art, txt, st]) => (
        <div key={art as string} className="flex items-center justify-between px-3 py-2">
          <span><span className="font-mono text-slate-500 mr-2">{textoTela(art)}</span>{txt}</span>
          {st === "ok" && <Pill tone="emerald">Conforme</Pill>}
          {st === "warn" && <Pill tone="amber">NC Menor</Pill>}
          {st === "nc" && <Pill tone="rose">NC Maior</Pill>}
        </div>
      ))}
    </div>
  </Frame>
);

export const FeedRecebimento = () => (
  <Frame title="feedbpf.com.br/recebimento">
    <h3 className="text-base font-bold mb-3">Recebimento de Matérias-Primas (POP-01)</h3>
    <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-slate-100">
          <tr>
            <th className="text-left px-3 py-2">Data</th>
            <th className="text-left px-3 py-2">Insumo</th>
            <th className="text-left px-3 py-2">Fornecedor</th>
            <th className="text-left px-3 py-2">Lote</th>
            <th className="text-left px-3 py-2">Reg. MAPA</th>
            <th className="text-left px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ["28/04", "Milho moído", "Cerealista Demo S.A.", "MP-1142", "SP-001234/2024", "ok"],
            ["27/04", "Farelo de soja", "Soja Brasil Demo", "MP-1158", "PR-005678/2023", "ok"],
            ["27/04", "Núcleo mineral 30%", "Premix Demo Ltda", "MP-1160", "MG-009012/2025", "ok"],
            ["26/04", "Ureia pecuária", "Fertil Demo", "MP-1163", "Isento", "warn"],
            ["26/04", "Calcário calcítico", "Mineradora Demo", "MP-1165", "GO-003344/2024", "ok"],
          ].map((r, i) => (
            <tr key={i}>
              <td className="px-3 py-2">{r[0]}</td>
              <td className="px-3 py-2 font-medium">{r[1]}</td>
              <td className="px-3 py-2 text-slate-600">{r[2]}</td>
              <td className="px-3 py-2 font-mono">{r[3]}</td>
              <td className="px-3 py-2 font-mono text-[10px]">{r[4]}</td>
              <td className="px-3 py-2">
                {r[5] === "ok"
                  ? <Pill tone="emerald">Aprovado</Pill>
                  : <Pill tone="amber">Atenção</Pill>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <div className="mt-3 text-xs text-slate-500">Inspeção sensorial · Certificado de análise</div>
  </Frame>
);

export const FeedProducao = () => (
  <Frame title="feedbpf.com.br/producao — Ordem OP-2026-0832">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Controle de Produção</h3>
      <Pill tone="emerald">Em andamento</Pill>
    </div>
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
        <div className="font-semibold mb-1">Dados da fabricação</div>
        <div className="flex justify-between"><span className="text-slate-500">Produto</span><span>Ração Bovino Confinamento</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Lote PA</span><span className="font-mono">PA-2026-0428</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Quantidade</span><span>24.000 kg</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Operador</span><span>Carlos Mendes</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Início</span><span>28/04 13:20</span></div>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
        <div className="font-semibold mb-1">Validações automáticas</div>
        <div className="flex items-center justify-between"><span>Tempo de mistura ≥ 3 min</span><Pill tone="emerald">4 min 12 s</Pill></div>
        <div className="flex items-center justify-between"><span>Flush de limpeza anterior</span><Pill tone="emerald">OK</Pill></div>
        <div className="flex items-center justify-between"><span>Segregação por espécie</span><Pill tone="emerald">OK</Pill></div>
        <div className="flex items-center justify-between"><span>Sobras / vassouras </span><Pill tone="emerald">Registrado</Pill></div>
        <div className="flex items-center justify-between"><span>Carry-over (ionóforos)</span><Pill tone="amber">Verificar</Pill></div>
      </div>
    </div>
  </Frame>
);

export const FeedMatrizRisco = () => {
  const cells: ("baixo"|"medio"|"alto"|"critico")[][] = [
    ["baixo","baixo","medio","medio","alto"],
    ["baixo","medio","medio","alto","alto"],
    ["medio","medio","alto","alto","critico"],
    ["medio","alto","alto","critico","critico"],
    ["alto","alto","critico","critico","critico"],
  ];
  const color = (v: string) =>
    v === "baixo" ? "bg-emerald-200 text-emerald-900"
    : v === "medio" ? "bg-amber-200 text-amber-900"
    : v === "alto" ? "bg-orange-300 text-orange-900"
    : "bg-rose-400 text-white";
  return (
    <Frame title="feedbpf.com.br/matriz-risco — APPCC/HACCP">
      <h3 className="text-base font-bold mb-3">Matriz de Risco · 27 perguntas · 7 categorias</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500 mb-2">Probabilidade × Severidade</div>
          <div className="grid grid-cols-5 gap-1">
            {cells.map((row, r) =>
              row.map((v, c) => (
                <div key={`${r}-${c}`} className={`aspect-square rounded flex items-center justify-center text-[10px] font-bold ${color(v)}`}>
                  {v[0].toUpperCase()}
                </div>
              ))
            )}
          </div>
        </div>
        <div className="text-xs space-y-2">
          <div className="font-semibold">Perigos identificados (top 5)</div>
          {[
            ["Contaminação cruzada (ionóforos)", "critico"],
            ["Carry-over de medicamentos", "alto"],
            ["Micotoxinas em milho", "alto"],
            ["Salmonella em farelo animal", "alto"],
            ["Resíduo de ureia em ração equino", "critico"],
          ].map(([t, n]) => (
            <div key={t} className="flex items-center justify-between bg-white p-2 rounded border border-slate-200">
              <span>{t}</span>
              <Pill tone={n === "critico" ? "rose" : "amber"}>{n === "critico" ? "Crítico" : "Alto"}</Pill>
            </div>
          ))}
        </div>
      </div>
    </Frame>
  );
};

export const FeedPlanejamento = () => (
  <Frame title="feedbpf.com.br/planejamento-anual">
    <h3 className="text-base font-bold mb-3">Planejamento Anual de Atividades · 2026</h3>
    <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs">
      <div className="grid grid-cols-13 text-[10px] bg-slate-100 text-slate-600 font-medium">
        <div className="col-span-3 px-2 py-1.5">Atividade</div>
        {["J","F","M","A","M","J","J","A","S","O","N","D"].map((m) => (
          <div key={m} className="px-1 py-1.5 text-center border-l border-slate-200">{m}</div>
        ))}
      </div>
      {[
        ["Análise microbiológica água", [1,3,5,7,9,11]],
        ["Calibração de balanças", [2,5,8,11]],
        ["Treinamento BPF", [1,4,7,10]],
        ["Auditoria interna", [3,6,9,12]],
        ["Controle de pragas", [1,2,3,4,5,6,7,8,9,10,11,12]],
        ["Simulação de recall", [5]],
        ["Limpeza de reservatório", [1,7]],
      ].map(([atv, meses], i) => (
        <div key={i} className="grid grid-cols-13 border-t border-slate-100 text-[11px]">
          <div className="col-span-3 px-2 py-1.5">{atv as string}</div>
          {Array.from({length:12}, (_,m) => (
            <div key={m} className="px-1 py-1.5 text-center border-l border-slate-100">
              {(meses as number[]).includes(m+1) && <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500"/>}
            </div>
          ))}
        </div>
      ))}
    </div>
    <div className="mt-3 flex gap-3 text-[11px] text-slate-500">
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500 inline-block"/>Programado</span>
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-500 inline-block"/>Em atraso</span>
      <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-300 inline-block"/>Concluído</span>
    </div>
  </Frame>
);

export const FeedManual = () => (
  <Frame title="feedbpf.com.br/manual">
    <h3 className="text-base font-bold mb-3 flex items-center gap-2"><BookOpen className="h-4 w-4"/> Manual Feed_BPF Interativo</h3>
    <div className="grid grid-cols-2 gap-2 text-xs">
      {[
        ["POP-01","Recebimento de Matérias-Primas","IN 04/2007"],
        ["POP-02","Higienização e Sanitização","IN 04/2007"],
        ["POP-03","Saúde do Pessoal e Visitantes","IN 04/2007"],
        ["POP-04","Potabilidade da Água","Portaria GM/MS 888/21"],
        ["POP-05","Armazenamento e Transporte","Decreto 12.031/2024"],
        ["POP-06","Manutenção e Calibração","IN 04/2007"],
        ["POP-07","Controle de Pragas e Expurgo","IN 04/2007"],
        ["POP-08","Gestão de Resíduos","CONAMA 430/2011"],
        ["POP-09","Expedição de Produto Acabado","IN 04/2007"],
        ["POP-10","Recall e Rastreabilidade","Decreto 12.031/2024"],
      ].map(([n, t, lei]) => (
        <div key={n} className="bg-white p-3 rounded border border-slate-200 hover:border-emerald-400 cursor-pointer">
          <div className="flex items-center justify-between mb-1">
            <span className="font-mono text-[10px] font-bold text-emerald-700">{n}</span>
            <span className="text-[9px] text-slate-400">{textoTela(lei)}</span>
          </div>
          <div className="font-medium">{t}</div>
        </div>
      ))}
    </div>
  </Frame>
);

// =================================================================
// AUDITS_BPF — 6 telas
// =================================================================

export const AuditsDashboard = () => (
  <Frame title="auditsbpf.com.br/dashboard">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Dashboard de Auditorias</h3>
      <Pill tone="emerald">Próx. auditoria: 15/05/2026</Pill>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Kpi icon={ClipboardCheck} label="Auditorias 2026" value="4" sub="2 internas / 2 externas" />
      <Kpi icon={TrendingUp} label="Score médio" value="86%" tone="emerald" />
      <Kpi icon={AlertTriangle} label="NCs abertas" value="11" tone="amber" />
      <Kpi icon={CheckCircle2} label="NCs tratadas" value="42" sub="últimos 12 meses" />
    </div>
    <div className="bg-white p-3 rounded border border-slate-200">
      <div className="text-xs font-semibold mb-2">Conformidade por área </div>
      <div className="grid grid-cols-2 gap-3">
        <Bar label="Estrutura física" pct={92} />
        <Bar label="Pessoal e treinamento" pct={88} />
        <Bar label="Recebimento e estoque" pct={95} />
        <Bar label="Produção e controle" pct={84} tone="amber"/>
        <Bar label="Higienização" pct={78} tone="amber"/>
        <Bar label="Rastreabilidade e recall" pct={90} />
      </div>
    </div>
  </Frame>
);

export const AuditsChecklist = () => (
  <Frame title="auditsbpf.com.br/checklist — 80 itens">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Checklist BPF · Auditoria 2026/T2</h3>
      <div className="text-xs text-slate-500">Item 32 de 80</div>
    </div>
    <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100 text-xs">
      {[
        ["Art. 18", "Pisos íntegros, impermeáveis e laváveis", "Conforme"],
        ["Art. 19", "Paredes laváveis até 2 m de altura", "Conforme"],
        ["Art. 20", "Forro/teto sem desprendimento de partículas", "NC Menor"],
        ["Art. 21", "Iluminação adequada e protegida", "Conforme"],
        ["Art. 22", "Ventilação suficiente nas áreas de produção", "NC Menor"],
        ["Art. 23", "Reservatório de água higienizado semestralmente", "NC Maior"],
      ].map(([art, txt, st]) => (
        <div key={art as string} className="flex items-center justify-between px-3 py-2.5">
          <div>
            <div><span className="font-mono text-slate-500 mr-2">{textoTela(art)}</span>{txt}</div>
            {st === "NC Maior" && <div className="text-[10px] text-rose-600 mt-0.5">Foto anexada · Última higienização: 11/2025</div>}
          </div>
          {st === "Conforme" && <Pill tone="emerald">Conforme</Pill>}
          {st === "NC Menor" && <Pill tone="amber">NC </Pill>}
          {st === "NC Maior" && <Pill tone="rose">NC </Pill>}
        </div>
      ))}
    </div>
    <div className="mt-3 flex justify-between text-xs">
      <span className="text-slate-500">Score parcial: <b className="text-emerald-700">87,5%</b></span>
      <span className="text-slate-500">Auditor: Eng. Roberto Lima · CRMV-SP 12345</span>
    </div>
  </Frame>
);

export const AuditsSala = () => (
  <Frame title="auditsbpf.com.br/sala-auditor — Acesso somente leitura">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-base font-bold">Sala do Auditor · Portal Externo</h3>
        <p className="text-xs text-slate-500">Acesso: auditor.externo@certifica-demo.com.br · Expira em 7 dias</p>
      </div>
      <Pill tone="emerald">Read-only</Pill>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      {[
        [FileText, "POPs vigentes", "10 documentos", "emerald"],
        [BookOpen, "Manual BPF", "Rev 04 · 2026", "emerald"],
        [FlaskConical, "Laudos laboratoriais", "23 análises", "emerald"],
        [Award, "Certificados de calibração", "12 equipamentos", "emerald"],
        [Users, "Treinamentos da equipe", "87% em dia", "emerald"],
        [ShieldCheck, "Plano APPCC/HACCP", "Atualizado 03/2026", "emerald"],
      ].map(([Icon, t, sub, tone], i) => {
        const I = Icon as any;
        return (
          <div key={i} className="bg-white p-3 rounded border border-slate-200">
            <I className="h-5 w-5 text-blue-600 mb-1.5"/>
            <div className="font-medium">{t as string}</div>
            <div className="text-[11px] text-slate-500">{sub as string}</div>
          </div>
        );
      })}
    </div>
  </Frame>
);

export const AuditsPlano = () => (
  <Frame title="auditsbpf.com.br/plano-acao — 5W2H">
    <h3 className="text-base font-bold mb-3">Plano de Ação 5W2H · NCs em tratamento</h3>
    <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-2 py-2">O quê</th>
            <th className="text-left px-2 py-2">Por quê</th>
            <th className="text-left px-2 py-2">Quem</th>
            <th className="text-left px-2 py-2">Quando</th>
            <th className="text-left px-2 py-2">Custo</th>
            <th className="text-left px-2 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr><td className="px-2 py-2">Higienizar reservatório R1</td><td className="px-2 py-2 text-slate-500">NC </td><td className="px-2 py-2">Manutenção</td><td className="px-2 py-2">10/05</td><td className="px-2 py-2">R$ 1.200</td><td className="px-2 py-2"><Pill tone="amber">Em curso</Pill></td></tr>
          <tr><td className="px-2 py-2">Substituir forro área 3</td><td className="px-2 py-2 text-slate-500">NC </td><td className="px-2 py-2">Engenharia</td><td className="px-2 py-2">22/05</td><td className="px-2 py-2">R$ 8.500</td><td className="px-2 py-2"><Pill tone="amber">Planejado</Pill></td></tr>
          <tr><td className="px-2 py-2">Instalar exaustor área mistura</td><td className="px-2 py-2 text-slate-500">NC </td><td className="px-2 py-2">Manutenção</td><td className="px-2 py-2">30/05</td><td className="px-2 py-2">R$ 3.400</td><td className="px-2 py-2"><Pill tone="amber">Cotação</Pill></td></tr>
          <tr><td className="px-2 py-2">Treinar equipe — POP-02</td><td className="px-2 py-2 text-slate-500">NC menor</td><td className="px-2 py-2">Qualidade</td><td className="px-2 py-2">05/05</td><td className="px-2 py-2">R$ 0</td><td className="px-2 py-2"><Pill tone="emerald">Concluído</Pill></td></tr>
        </tbody>
      </table>
    </div>
  </Frame>
);

export const AuditsRelatorio = () => (
  <Frame title="auditsbpf.com.br/relatorio — PDF Profissional">
    <div className="bg-white rounded border border-slate-200 p-5 text-xs">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 mb-3">
        <div>
          <div className="text-base font-bold">Relatório de Auditoria BPF</div>
          <div className="text-slate-500">Fábrica Demo Ltda · CNPJ 00.000.000/0001-00</div>
        </div>
        <div className="text-right text-[10px] text-slate-500">
          Aud. 2026/T2<br/>Emitido em 28/04/2026
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90">
              <circle cx="40" cy="40" r="32" stroke="#e2e8f0" strokeWidth="6" fill="none"/>
              <circle cx="40" cy="40" r="32" stroke="#10b981" strokeWidth="6" fill="none" strokeDasharray={2*Math.PI*32} strokeDashoffset={2*Math.PI*32*(1-0.875)}/>
            </svg>
            <span className="absolute font-bold text-base">87,5%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">SCORE GERAL</div>
        </div>
        <div className="bg-emerald-50 p-3 rounded">
          <div className="text-[10px] text-emerald-700 uppercase font-semibold">Risco</div>
          <div className="font-bold text-emerald-700">Baixo</div>
          <div className="text-[10px] text-slate-600 mt-1"> </div>
        </div>
        <div className="bg-slate-50 p-3 rounded">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">NCs</div>
          <div className="font-bold">12 abertas</div>
          <div className="text-[10px] text-slate-600 mt-1">3 maiores · 9 menores</div>
        </div>
      </div>
      <div className="text-xs">
        <div className="font-semibold mb-1.5">Evolução trimestral do score</div>
        <div className="flex items-end gap-2 h-16">
          {[72,78,82,87.5].map((v,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full bg-emerald-500 rounded-t" style={{height: `${v}%`}} />
              <span className="text-[9px] text-slate-500">T{i+1}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Frame>
);

export const AuditsHistorico = () => (
  <Frame title="auditsbpf.com.br/historico">
    <h3 className="text-base font-bold mb-3">Histórico e Evolução de Auditorias</h3>
    <div className="bg-white rounded border border-slate-200 divide-y divide-slate-100 text-xs">
      {[
        ["28/04/2026", "Interna · T2", "87,5%", "12 NCs · 4 tratadas", "emerald"],
        ["15/01/2026", "Externa · Cert. Demo", "82,0%", "18 NCs · 18 tratadas", "emerald"],
        ["20/10/2025", "Interna · T4/2025", "78,5%", "22 NCs · 22 tratadas", "amber"],
        ["12/07/2025", "Interna · T3/2025", "72,0%", "29 NCs · 29 tratadas", "amber"],
        ["08/04/2025", "Externa · MAPA", "68,5%", "34 NCs · 34 tratadas", "rose"],
      ].map((r, i) => (
        <div key={i} className="grid grid-cols-5 px-3 py-2.5 items-center">
          <span className="font-mono">{r[0]}</span>
          <span>{r[1]}</span>
          <span className="font-bold">{r[2]}</span>
          <span className="text-slate-500">{r[3]}</span>
          <span className="justify-self-end"><Pill tone={r[4] as any}>{r[4] === "emerald" ? "Aprovada" : r[4] === "amber" ? "Atenção" : "Crítica"}</Pill></span>
        </div>
      ))}
    </div>
  </Frame>
);

// =================================================================
// AGRO RC CRM — 6 telas
// =================================================================

export const AgroRcDashboard = () => (
  <Frame title="agrorc.com.br/painel-rc">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-base font-bold">Painel do Representante</h3>
        <p className="text-xs text-slate-500">RC: João Pereira · Região: Centro-Oeste</p>
      </div>
      <Pill tone="emerald">Meta do mês: 78%</Pill>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Kpi icon={Building2} label="Clientes ativos" value="42" />
      <Kpi icon={DollarSign} label="Faturamento" value="R$ 312k" sub="abr/2026" />
      <Kpi icon={MapPin} label="Visitas no mês" value="28" sub="meta 36" />
      <Kpi icon={Award} label="Ranking RC" value="3º" sub="entre 14 RCs" />
    </div>
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold mb-2">Top 5 clientes do mês</div>
        <ul className="space-y-1">
          {[
            ["Faz. Boa Vista","R$ 64.200"],
            ["Agro União Demo","R$ 48.500"],
            ["Pec. Três Marias","R$ 41.300"],
            ["Sítio Esperança","R$ 32.800"],
            ["Faz. Santa Clara","R$ 28.700"],
          ].map(([n,v]) => (
            <li key={n} className="flex justify-between"><span>{n}</span><span className="font-medium">{v}</span></li>
          ))}
        </ul>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold mb-2">Próximas visitas</div>
        <ul className="space-y-1">
          <li className="flex justify-between"><span>Faz. Boa Vista — Goiânia/GO</span><span className="text-slate-500">29/04</span></li>
          <li className="flex justify-between"><span>Pec. Três Marias — Cuiabá/MT</span><span className="text-slate-500">30/04</span></li>
          <li className="flex justify-between"><span>Sítio Esperança — Rio Verde/GO</span><span className="text-slate-500">02/05</span></li>
          <li className="flex justify-between"><span>Faz. Santa Clara — Dourados/MS</span><span className="text-slate-500">03/05</span></li>
        </ul>
      </div>
    </div>
  </Frame>
);

export const AgroRcKanban = () => {
  const cols: [string, [string,string][], string][] = [
    ["Prospecção", [["Faz. Nova Era","R$ 22k"],["Sítio Bom Jardim","R$ 14k"]], "slate"],
    ["Proposta enviada", [["Pec. Cerrado","R$ 38k"],["Faz. Aliança","R$ 27k"],["Agro Vale","R$ 19k"]], "blue"],
    ["Negociação", [["Faz. Boa Vista","R$ 64k"],["Pec. 3 Marias","R$ 41k"]], "amber"],
    ["Fechado ganho", [["Agro União","R$ 48k"],["Faz. Santa Clara","R$ 28k"]], "emerald"],
  ];
  return (
    <Frame title="agrorc.com.br/pipeline">
      <h3 className="text-base font-bold mb-3">Pipeline de Oportunidades</h3>
      <div className="grid grid-cols-4 gap-2">
        {cols.map(([titulo, items, tone]) => (
          <div key={titulo} className="bg-white rounded border border-slate-200">
            <div className={`px-2 py-1.5 text-[10px] font-bold uppercase border-b border-slate-200 bg-${tone}-50 text-${tone}-700`}>{titulo} · {items.length}</div>
            <div className="p-1.5 space-y-1.5">
              {items.map(([n, v]) => (
                <div key={n} className="bg-slate-50 p-2 rounded text-[11px] border border-slate-100">
                  <div className="font-medium">{n}</div>
                  <div className="text-slate-500">{v}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
};

export const AgroRcClientes = () => (
  <Frame title="agrorc.com.br/clientes">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Carteira de Clientes</h3>
      <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-xs">
        <Search className="h-3 w-3 text-slate-400"/><span className="text-slate-400">Buscar cliente…</span>
      </div>
    </div>
    <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-3 py-2">Cliente</th>
            <th className="text-left px-3 py-2">Cidade/UF</th>
            <th className="text-left px-3 py-2">Segmento</th>
            <th className="text-left px-3 py-2">Ticket médio</th>
            <th className="text-left px-3 py-2">Última compra</th>
            <th className="text-left px-3 py-2">Score</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ["Faz. Boa Vista","Goiânia/GO","Bovino corte","R$ 18.400","18/04/2026",5],
            ["Agro União Demo","Rondonópolis/MT","Bovino leite","R$ 12.800","22/04/2026",4],
            ["Pec. Três Marias","Cuiabá/MT","Bovino corte","R$ 15.200","20/04/2026",5],
            ["Sítio Esperança","Rio Verde/GO","Suíno","R$ 8.300","15/04/2026",3],
            ["Faz. Santa Clara","Dourados/MS","Bovino corte","R$ 10.700","12/04/2026",4],
            ["Pec. Cerrado","Brasília/DF","Bovino leite","R$ 6.100","08/04/2026",3],
          ].map((r, i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium">{r[0]}</td>
              <td className="px-3 py-2 text-slate-500">{r[1]}</td>
              <td className="px-3 py-2">{r[2]}</td>
              <td className="px-3 py-2">{r[3]}</td>
              <td className="px-3 py-2 text-slate-500">{r[4]}</td>
              <td className="px-3 py-2">
                {Array.from({length: r[5] as number}, (_,k) => <Star key={k} className="inline h-3 w-3 fill-amber-400 text-amber-400"/>)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Frame>
);

export const AgroRcVisitas = () => (
  <Frame title="agrorc.com.br/visitas — GPS">
    <h3 className="text-base font-bold mb-3">Visitas a Campo · Abril 2026</h3>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white rounded border border-slate-200 p-3 text-xs">
        <div className="font-semibold mb-2">Cumprimento da meta mensal</div>
        <div className="flex items-end gap-3 mb-2">
          <span className="text-3xl font-bold text-emerald-600">28</span>
          <span className="text-sm text-slate-500 mb-1">/ 36 visitas</span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div className="h-full bg-emerald-500" style={{width: "78%"}}/>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between"><span className="text-slate-500">Check-ins por GPS</span><b>26</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Visitas com foto</span><b>24</b></div>
          <div className="flex justify-between"><span className="text-slate-500">Tempo médio</span><b>1 h 42 min</b></div>
        </div>
      </div>
      <div className="bg-white rounded border border-slate-200 p-3 text-xs">
        <div className="font-semibold mb-2">Últimos check-ins</div>
        <ul className="space-y-2">
          {[
            ["Faz. Boa Vista","Goiânia/GO","27/04 14:20"],
            ["Pec. Três Marias","Cuiabá/MT","26/04 10:05"],
            ["Sítio Esperança","Rio Verde/GO","25/04 09:30"],
            ["Faz. Santa Clara","Dourados/MS","24/04 15:45"],
          ].map(([n,c,d]) => (
            <li key={n} className="flex items-start gap-2 border-b border-slate-100 pb-1.5 last:border-0">
              <MapPin className="h-3.5 w-3.5 text-purple-600 mt-0.5"/>
              <div className="flex-1">
                <div className="font-medium">{n}</div>
                <div className="text-[10px] text-slate-500">{c} · {d}</div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  </Frame>
);

export const AgroRcMetas = () => (
  <Frame title="agrorc.com.br/metas">
    <h3 className="text-base font-bold mb-3">Metas Comerciais · 2º Trimestre 2026</h3>
    <div className="space-y-2.5 text-xs">
      {[
        ["João Pereira (você)", 78, "R$ 312.000 / R$ 400.000", "emerald"],
        ["Marina Souza", 92, "R$ 368.000 / R$ 400.000", "emerald"],
        ["Ricardo Alves", 84, "R$ 336.000 / R$ 400.000", "emerald"],
        ["Patrícia Lima", 65, "R$ 260.000 / R$ 400.000", "amber"],
        ["Eduardo Nunes", 51, "R$ 204.000 / R$ 400.000", "amber"],
        ["Helena Castro", 38, "R$ 152.000 / R$ 400.000", "rose"],
      ].map(([n, p, v, t]) => (
        <div key={n as string} className="bg-white p-3 rounded border border-slate-200">
          <div className="flex justify-between mb-1.5">
            <span className="font-medium">{n}</span>
            <span className="text-slate-500">{v}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full bg-${t}-500`} style={{width: `${p}%`}}/>
            </div>
            <span className="font-bold w-10 text-right">{p}%</span>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

export const AgroRcAdmin = () => (
  <Frame title="agrorc.com.br/admin — Visão restrita">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-base font-bold">Painel Regional · Administrador</h3>
        <p className="text-xs text-slate-500">Visão consolidada — não disponível aos RCs</p>
      </div>
      <Pill tone="rose">Acesso restrito</Pill>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Kpi icon={DollarSign} label="Faturamento" value="R$ 1,84 mi" sub="abr/2026" />
      <Kpi icon={TrendingUp} label="Margem bruta" value="32,4%" tone="emerald" />
      <Kpi icon={Activity} label="Margem líquida" value="14,8%" tone="emerald" />
      <Kpi icon={Users} label="RCs ativos" value="14" />
    </div>
    <div className="bg-white p-3 rounded border border-slate-200 text-xs">
      <div className="font-semibold mb-2">Performance por região</div>
      <div className="space-y-2">
        <div className="flex items-center gap-3"><span className="w-24">Centro-Oeste</span><div className="flex-1 h-2 bg-slate-200 rounded"><div className="h-full bg-emerald-500 rounded" style={{width:"88%"}}/></div><span className="w-24 text-right">R$ 624k · 34%</span></div>
        <div className="flex items-center gap-3"><span className="w-24">Sudeste</span><div className="flex-1 h-2 bg-slate-200 rounded"><div className="h-full bg-emerald-500 rounded" style={{width:"72%"}}/></div><span className="w-24 text-right">R$ 510k · 28%</span></div>
        <div className="flex items-center gap-3"><span className="w-24">Sul</span><div className="flex-1 h-2 bg-slate-200 rounded"><div className="h-full bg-emerald-500 rounded" style={{width:"55%"}}/></div><span className="w-24 text-right">R$ 386k · 21%</span></div>
        <div className="flex items-center gap-3"><span className="w-24">Nordeste</span><div className="flex-1 h-2 bg-slate-200 rounded"><div className="h-full bg-amber-500 rounded" style={{width:"32%"}}/></div><span className="w-24 text-right">R$ 224k · 12%</span></div>
        <div className="flex items-center gap-3"><span className="w-24">Norte</span><div className="flex-1 h-2 bg-slate-200 rounded"><div className="h-full bg-rose-500 rounded" style={{width:"14%"}}/></div><span className="w-24 text-right">R$ 96k · 5%</span></div>
      </div>
    </div>
  </Frame>
);

// =================================================================
// AGROGESTÃO CRM — 6 telas
// =================================================================

export const AgroDashboard = () => (
  <Frame title="agrogestao.com.br/dashboard">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Dashboard Regional</h3>
      <Pill tone="emerald">Período: abr/2026</Pill>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Kpi icon={DollarSign} label="Faturamento" value="R$ 2,14 mi" />
      <Kpi icon={Target} label="Meta atingida" value="84%" tone="emerald" />
      <Kpi icon={Building2} label="Clientes ativos" value="287" />
      <Kpi icon={MapPin} label="Visitas no mês" value="156" />
    </div>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded border border-slate-200 text-xs">
        <div className="font-semibold mb-2">Top 5 culturas</div>
        <ul className="space-y-1.5">
          <li className="flex justify-between"><span>Soja</span><b>34%</b></li>
          <li className="flex justify-between"><span>Milho</span><b>28%</b></li>
          <li className="flex justify-between"><span>Bovino corte</span><b>18%</b></li>
          <li className="flex justify-between"><span>Algodão</span><b>12%</b></li>
          <li className="flex justify-between"><span>Outros</span><b>8%</b></li>
        </ul>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200 text-xs">
        <div className="font-semibold mb-2">Evolução mensal</div>
        <div className="flex items-end gap-1.5 h-24">
          {[58,62,71,68,75,82,78,84,88,92,86,84].map((v,i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div className="w-full bg-lime-500 rounded-t" style={{height: `${v}%`}}/>
              <span className="text-[8px] text-slate-500">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </Frame>
);

export const AgroClientes = () => (
  <Frame title="agrogestao.com.br/clientes">
    <h3 className="text-base font-bold mb-3">Carteira de Clientes · Filtro: Centro-Oeste</h3>
    <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-3 py-2">Cliente</th>
            <th className="text-left px-3 py-2">Cidade/UF</th>
            <th className="text-left px-3 py-2">Cultura</th>
            <th className="text-left px-3 py-2">Ticket médio</th>
            <th className="text-left px-3 py-2">RC</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ["Faz. Boa Vista","Goiânia/GO","Soja + Bovino","R$ 18.400","João Pereira"],
            ["Agro União Demo","Rondonópolis/MT","Soja + Milho","R$ 22.100","Marina Souza"],
            ["Pec. Três Marias","Cuiabá/MT","Bovino corte","R$ 15.200","Ricardo Alves"],
            ["Faz. Esperança","Rio Verde/GO","Algodão + Soja","R$ 28.700","João Pereira"],
            ["Faz. Santa Clara","Dourados/MS","Bovino corte","R$ 10.700","Marina Souza"],
            ["Faz. Aliança","Sorriso/MT","Soja + Milho","R$ 31.200","Patrícia Lima"],
          ].map((r,i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium">{r[0]}</td>
              <td className="px-3 py-2 text-slate-500">{r[1]}</td>
              <td className="px-3 py-2">{r[2]}</td>
              <td className="px-3 py-2">{r[3]}</td>
              <td className="px-3 py-2 text-slate-500">{r[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Frame>
);

export const AgroRegioes = () => (
  <Frame title="agrogestao.com.br/regioes">
    <h3 className="text-base font-bold mb-3">Mapa de Regiões e Performance</h3>
    <div className="grid grid-cols-5 gap-2 text-xs">
      {[
        ["Norte","R$ 96k","12 clientes","rose"],
        ["Nordeste","R$ 224k","31 clientes","amber"],
        ["Centro-Oeste","R$ 824k","104 clientes","emerald"],
        ["Sudeste","R$ 612k","82 clientes","emerald"],
        ["Sul","R$ 384k","58 clientes","emerald"],
      ].map(([r,f,c,t]) => (
        <div key={r as string} className={`bg-white p-3 rounded border border-${t}-300`}>
          <div className={`text-[10px] uppercase font-bold text-${t}-700`}>{r}</div>
          <div className="font-bold text-sm mt-1">{f}</div>
          <div className="text-[10px] text-slate-500">{c}</div>
          <div className={`mt-2 h-1.5 bg-${t}-200 rounded`}>
            <div className={`h-full bg-${t}-500 rounded`} style={{width: r === "Norte" ? "14%" : r === "Nordeste" ? "32%" : r === "Centro-Oeste" ? "92%" : r === "Sudeste" ? "78%" : "55%"}}/>
          </div>
        </div>
      ))}
    </div>
    <div className="mt-3 text-xs text-slate-500">Total: <b className="text-slate-700">R$ 2,14 mi</b> · 287 clientes ativos · 14 RCs</div>
  </Frame>
);

export const AgroMetas = () => (
  <Frame title="agrogestao.com.br/metas">
    <h3 className="text-base font-bold mb-3">Metas Comerciais por Representante · 2º Tri 2026</h3>
    <div className="space-y-2 text-xs">
      {[
        ["Marina Souza","CO","R$ 368k","R$ 400k",92,"emerald"],
        ["Ricardo Alves","CO","R$ 336k","R$ 400k",84,"emerald"],
        ["João Pereira","CO","R$ 312k","R$ 400k",78,"emerald"],
        ["Patrícia Lima","SE","R$ 260k","R$ 400k",65,"amber"],
        ["Eduardo Nunes","S","R$ 204k","R$ 400k",51,"amber"],
        ["Helena Castro","NE","R$ 152k","R$ 400k",38,"rose"],
      ].map(([n,reg,real,meta,p,t], i) => (
        <div key={i} className="bg-white p-3 rounded border border-slate-200">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-slate-400">#{i+1}</span>
              <span className="font-medium">{n}</span>
              <span className="text-[10px] text-slate-500">{reg}</span>
              {p as number >= 90 && <Pill tone="emerald">Top</Pill>}
            </div>
            <span className="text-slate-500">{real} / {meta}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div className={`h-full bg-${t}-500`} style={{width: `${p}%`}}/>
            </div>
            <span className="font-bold w-10 text-right">{p}%</span>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

export const AgroVisitas = () => (
  <Frame title="agrogestao.com.br/visitas">
    <h3 className="text-base font-bold mb-3">Calendário de Visitas · Abril 2026</h3>
    <div className="bg-white rounded border border-slate-200 p-3">
      <div className="grid grid-cols-7 gap-1 text-[10px]">
        {["S","T","Q","Q","S","S","D"].map(d => <div key={d} className="text-center font-bold text-slate-400 py-1">{d}</div>)}
        {Array.from({length: 30}, (_, i) => {
          const day = i + 1;
          const visits = [3,7,9,12,14,16,19,21,22,24,26,28,29].includes(day);
          const count = day === 14 ? 4 : day === 22 ? 3 : 2;
          return (
            <div key={day} className={`aspect-square rounded p-1 text-[10px] border ${visits ? "bg-lime-50 border-lime-200" : "border-slate-100"}`}>
              <div className="font-medium">{day}</div>
              {visits && <div className="text-lime-700 font-bold text-[9px]">{count}v</div>}
            </div>
          );
        })}
      </div>
    </div>
    <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
      <div className="bg-white p-2.5 rounded border border-slate-200"><div className="text-slate-500 text-[10px]">VISITAS NO MÊS</div><div className="font-bold text-base">156</div></div>
      <div className="bg-white p-2.5 rounded border border-slate-200"><div className="text-slate-500 text-[10px]">META</div><div className="font-bold text-base">180</div></div>
      <div className="bg-white p-2.5 rounded border border-slate-200"><div className="text-slate-500 text-[10px]">CUMPRIMENTO</div><div className="font-bold text-base text-emerald-600">87%</div></div>
    </div>
  </Frame>
);

export const AgroRelatorios = () => (
  <Frame title="agrogestao.com.br/relatorios">
    <h3 className="text-base font-bold mb-3">Relatórios Gerenciais</h3>
    <div className="grid grid-cols-2 gap-3">
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="text-xs font-semibold mb-2">Evolução de vendas (12 meses)</div>
        <div className="flex items-end gap-1 h-28">
          {[58,62,71,68,75,82,78,84,88,92,86,84].map((v,i) => (
            <div key={i} className="flex-1 bg-gradient-to-t from-green-600 to-lime-400 rounded-t" style={{height: `${v}%`}}/>
          ))}
        </div>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="text-xs font-semibold mb-2">Distribuição por cultura</div>
        <div className="flex items-center justify-center h-28">
          <svg viewBox="0 0 32 32" className="w-24 h-24 -rotate-90">
            <circle r="16" cx="16" cy="16" fill="#84cc16"/>
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#16a34a" strokeWidth="32" strokeDasharray="34 100" />
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#22c55e" strokeWidth="32" strokeDasharray="28 100" strokeDashoffset="-34"/>
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#65a30d" strokeWidth="32" strokeDasharray="18 100" strokeDashoffset="-62"/>
            <circle r="16" cx="16" cy="16" fill="transparent" stroke="#a3e635" strokeWidth="32" strokeDasharray="12 100" strokeDashoffset="-80"/>
            <circle r="10" cx="16" cy="16" fill="white"/>
          </svg>
        </div>
        <div className="grid grid-cols-2 gap-1 text-[10px]">
          <span><span className="inline-block w-2 h-2 bg-green-600 mr-1"/>Soja 34%</span>
          <span><span className="inline-block w-2 h-2 bg-green-500 mr-1"/>Milho 28%</span>
          <span><span className="inline-block w-2 h-2 bg-lime-700 mr-1"/>Bovino 18%</span>
          <span><span className="inline-block w-2 h-2 bg-lime-400 mr-1"/>Outros 20%</span>
        </div>
      </div>
    </div>
    <div className="mt-2 flex justify-end gap-2">
      <button className="px-2.5 py-1 text-[10px] bg-emerald-600 text-white rounded">Exportar PDF</button>
      <button className="px-2.5 py-1 text-[10px] bg-slate-700 text-white rounded">Exportar Excel</button>
    </div>
  </Frame>
);

// =================================================================
// NUTRICRM — 6 telas
// =================================================================

export const NutriDashboard = () => (
  <Frame title="nutricrm.com.br/dashboard">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-base font-bold">Dashboard do Representante</h3>
        <p className="text-xs text-slate-500">Nutricionista: Dra. Camila Ferreira · CRMV-SP 67890</p>
      </div>
      <Pill tone="emerald">Conversão: 38%</Pill>
    </div>
    <div className="grid grid-cols-4 gap-3 mb-4">
      <Kpi icon={Building2} label="Clientes ativos" value="34" tone="orange" />
      <Kpi icon={MapPin} label="Visitas técnicas" value="22" sub="abr/2026" tone="orange" />
      <Kpi icon={GitBranch} label="Propostas abertas" value="9" tone="orange" />
      <Kpi icon={Target} label="Conversão média" value="38%" tone="emerald" />
    </div>
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold mb-2">Conversão por espécie</div>
        <div className="space-y-2">
          <Bar label="Bovino corte" pct={42} tone="orange"/>
          <Bar label="Bovino leite" pct={38} tone="orange"/>
          <Bar label="Suíno" pct={35} tone="orange"/>
          <Bar label="Aves" pct={28} tone="amber"/>
          <Bar label="Equino" pct={51} tone="emerald"/>
        </div>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200">
        <div className="font-semibold mb-2">Próximas visitas técnicas</div>
        <ul className="space-y-1.5">
          <li className="flex justify-between"><span>Faz. Boa Vista — bovino</span><span className="text-slate-500">29/04</span></li>
          <li className="flex justify-between"><span>Pec. Três Marias — leite</span><span className="text-slate-500">30/04</span></li>
          <li className="flex justify-between"><span>Haras São Jorge — equino</span><span className="text-slate-500">02/05</span></li>
          <li className="flex justify-between"><span>Granja Aurora — aves</span><span className="text-slate-500">03/05</span></li>
        </ul>
      </div>
    </div>
  </Frame>
);

export const NutriClientes = () => (
  <Frame title="nutricrm.com.br/clientes — Carteira da Dra. Camila">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-base font-bold">Minha Carteira (multi-tenant)</h3>
      <Pill tone="emerald">Privacidade total entre RCs</Pill>
    </div>
    <div className="bg-white rounded border border-slate-200 overflow-hidden text-xs">
      <table className="w-full">
        <thead className="bg-slate-100 text-slate-600">
          <tr>
            <th className="text-left px-3 py-2">Propriedade</th>
            <th className="text-left px-3 py-2">Espécie</th>
            <th className="text-left px-3 py-2">Rebanho</th>
            <th className="text-left px-3 py-2">Ticket médio</th>
            <th className="text-left px-3 py-2">Última visita</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[
            ["Faz. Boa Vista","Bovino corte","1.240 cab","R$ 22.400","18/04/2026"],
            ["Pec. Três Marias","Bovino leite","380 cab","R$ 14.800","20/04/2026"],
            ["Haras São Jorge","Equino","68 animais","R$ 9.200","15/04/2026"],
            ["Granja Aurora","Aves","42.000 aves","R$ 18.300","12/04/2026"],
            ["Sítio Bom Pastor","Suíno","850 cab","R$ 11.700","08/04/2026"],
          ].map((r,i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-medium">{r[0]}</td>
              <td className="px-3 py-2">{r[1]}</td>
              <td className="px-3 py-2">{r[2]}</td>
              <td className="px-3 py-2">{r[3]}</td>
              <td className="px-3 py-2 text-slate-500">{r[4]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </Frame>
);

export const NutriPipeline = () => {
  const cols: [string, [string,string][], string][] = [
    ["Visita técnica", [["Faz. Boa Vista","Bovino"],["Pec. 3 Marias","Leite"]], "slate"],
    ["Amostragem", [["Haras São Jorge","Equino"],["Granja Aurora","Aves"]], "blue"],
    ["Proposta enviada", [["Sítio Bom Pastor","Suíno"],["Faz. Aliança","Bovino"]], "orange"],
    ["Fechado", [["Faz. Santa Clara","Bovino"]], "emerald"],
  ];
  return (
    <Frame title="nutricrm.com.br/pipeline">
      <h3 className="text-base font-bold mb-3">Pipeline Comercial · Funil Nutricional</h3>
      <div className="grid grid-cols-4 gap-2">
        {cols.map(([titulo, items, tone]) => (
          <div key={titulo} className="bg-white rounded border border-slate-200">
            <div className={`px-2 py-1.5 text-[10px] font-bold uppercase border-b border-slate-200 bg-${tone}-50 text-${tone}-700`}>{titulo}</div>
            <div className="p-1.5 space-y-1.5">
              {items.map(([n, e]) => (
                <div key={n} className="bg-slate-50 p-2 rounded text-[11px] border border-slate-100">
                  <div className="font-medium">{n}</div>
                  <div className="text-slate-500">{e}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
};

export const NutriVisita = () => (
  <Frame title="nutricrm.com.br/visita-tecnica">
    <h3 className="text-base font-bold mb-3">Visita Técnica · Faz. Boa Vista</h3>
    <div className="grid grid-cols-2 gap-3 text-xs">
      <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
        <div className="font-semibold mb-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-orange-600"/> Geolocalização</div>
        <div className="flex justify-between"><span className="text-slate-500">Coordenadas</span><span className="font-mono text-[10px]">-16.6869, -49.2648</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Cidade</span><span>Goiânia/GO</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Check-in</span><span>27/04 14:20</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Check-out</span><span>27/04 16:05</span></div>
      </div>
      <div className="bg-white p-3 rounded border border-slate-200 space-y-1.5">
        <div className="font-semibold mb-1">Avaliação do rebanho</div>
        <div className="flex justify-between"><span className="text-slate-500">Espécie</span><span>Bovino corte</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Cabeças</span><span>1.240</span></div>
        <div className="flex justify-between"><span className="text-slate-500">ECC médio</span><span>3,2 / 5</span></div>
        <div className="flex justify-between"><span className="text-slate-500">GMD</span><span>1,15 kg/dia</span></div>
        <div className="flex justify-between"><span className="text-slate-500">Conversão alimentar</span><span>6,8 : 1</span></div>
      </div>
    </div>
    <div className="mt-3 bg-orange-50 border border-orange-200 rounded p-3 text-xs">
      <div className="font-semibold text-orange-800 mb-1">Recomendação técnica</div>
      <p className="text-orange-900">Aumentar densidade energética em 4% via inclusão de gordura protegida (1,5%). Suplementação mineral com Zn orgânico para melhorar conversão. Reavaliar em 30 dias.</p>
    </div>
  </Frame>
);

export const NutriRelatorios = () => (
  <Frame title="nutricrm.com.br/relatorios">
    <h3 className="text-base font-bold mb-3">Relatórios e Indicadores</h3>
    <div className="grid grid-cols-3 gap-3 mb-3">
      <Kpi icon={DollarSign} label="Faturamento" value="R$ 286k" sub="abr/2026" tone="orange"/>
      <Kpi icon={BarChart3} label="Ticket médio" value="R$ 13.000" tone="orange"/>
      <Kpi icon={Activity} label="Conversão" value="38%" tone="emerald"/>
    </div>
    <div className="bg-white p-3 rounded border border-slate-200">
      <div className="text-xs font-semibold mb-2">Faturamento por espécie (12 meses)</div>
      <div className="flex items-end gap-1.5 h-24">
        {[42,48,52,58,55,62,68,72,68,76,82,78].map((v,i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
            <div className="w-full bg-gradient-to-t from-rose-500 to-orange-400 rounded-t" style={{height: `${v}%`}}/>
            <span className="text-[8px] text-slate-500">{["J","F","M","A","M","J","J","A","S","O","N","D"][i]}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="mt-2 flex justify-end gap-2">
      <button className="px-2.5 py-1 text-[10px] bg-orange-600 text-white rounded">Exportar PDF</button>
      <button className="px-2.5 py-1 text-[10px] bg-slate-700 text-white rounded">Exportar Excel</button>
    </div>
  </Frame>
);

export const NutriClienteDetail = () => (
  <Frame title="nutricrm.com.br/cliente/faz-boa-vista">
    <div className="flex items-center justify-between mb-3">
      <div>
        <h3 className="text-base font-bold">Faz. Boa Vista</h3>
        <p className="text-xs text-slate-500 flex items-center gap-3">
          <span><Phone className="inline h-3 w-3 mr-1"/>(62) 99999-0001</span>
          <span><Mail className="inline h-3 w-3 mr-1"/>contato@bv-demo.com.br</span>
        </p>
      </div>
      <Pill tone="emerald">Cliente fiel · 4 anos</Pill>
    </div>
    <div className="text-xs font-semibold mb-2">Linha do tempo</div>
    <div className="space-y-2 text-xs">
      {[
        ["27/04/2026","Visita técnica","Avaliação ECC + GMD · Recomendação suplementação Zn",  "orange"],
        ["18/04/2026","Venda fechada","Lote 12 t Ração Bovino Confinamento — R$ 22.400", "emerald"],
        ["02/04/2026","Visita técnica","Coleta de amostras forrageiras", "orange"],
        ["20/03/2026","Proposta enviada","Programa nutricional 2026/T2", "blue"],
        ["10/03/2026","Visita técnica","Diagnóstico inicial · 1.240 cabeças", "orange"],
      ].map(([d,t,desc,tone]) => (
        <div key={d} className="bg-white p-2.5 rounded border border-slate-200 flex gap-3">
          <div className={`w-1 rounded bg-${tone}-500 self-stretch`}/>
          <div className="flex-1">
            <div className="flex justify-between">
              <span className="font-medium">{t}</span>
              <span className="text-slate-500">{d}</span>
            </div>
            <div className="text-slate-600">{desc}</div>
          </div>
        </div>
      ))}
    </div>
  </Frame>
);

// =================================================================
// NUTRI_AGRO LABELS — 6 telas (replica o programa real, tema escuro)
// =================================================================

const NALShell = ({ active, title, children, preview }: { active: string; title: string; children: React.ReactNode; preview?: React.ReactNode }) => {
  const groups: { label: string; items: { id: string; name: string; off?: boolean }[] }[] = [
    { label: "CADASTRO", items: [{ id: "empresa", name: "Empresa" }, { id: "produto", name: "Produto" }] },
    { label: "COMPOSIÇÃO", items: [{ id: "ingredientes", name: "Ingredientes" }, { id: "niveis", name: "Níveis de Garantia" }] },
    { label: "ADITIVOS", items: [{ id: "minerais", name: "Minerais" }, { id: "vitaminas", name: "Vitaminas" }, { id: "outros", name: "Outros Aditivos" }] },
    { label: "INFORMAÇÕES", items: [{ id: "consumo", name: "Tabela de Consumo" }, { id: "legislacao", name: "Legislação" }] },
    { label: "GESTÃO", items: [{ id: "banco", name: "Banco de Dados", off: true }, { id: "salvos", name: "Rótulos Salvos" }] },
  ];
  return (
    <Frame title="bpf-solutions-suite.lovable.app — Nutri_Agro Labels">
      <div className="bg-slate-950 text-slate-100 rounded-lg overflow-hidden border border-slate-800">
        {/* Top bar */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 text-[10px] font-bold">GR</div>
            <span className="font-bold">Gerador de Rótulo</span>
            <span className="px-2 py-0.5 rounded border border-emerald-500/40 text-emerald-400 text-[10px]">Alimentos para Animais</span>
            <span className="px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 text-[10px]"> </span>
            <span className="px-2 py-0.5 rounded border border-cyan-500/40 text-cyan-400 text-[10px]"> </span>
          </div>
          <span className="text-[10px] text-slate-500">Desenvolvido por <span className="text-emerald-400">BPF_Consult</span></span>
        </div>
        <div className="grid grid-cols-12 min-h-[280px]">
          {/* Sidebar */}
          <aside className="col-span-3 bg-slate-900/60 border-r border-slate-800 p-2 text-[11px]">
            {groups.map((g) => (
              <div key={g.label} className="mb-2">
                <div className="text-[9px] tracking-widest text-slate-500 px-2 py-1">{g.label}</div>
                {g.items.map((it) => (
                  <div key={it.id} className={`flex items-center justify-between px-2 py-1.5 rounded ${active === it.id ? "bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400" : "text-slate-300"}`}>
                    <span>{it.name}</span>
                    {it.off && <span className="text-[9px] text-slate-500 border border-slate-700 px-1 rounded">off</span>}
                  </div>
                ))}
              </div>
            ))}
          </aside>
          {/* Main */}
          <main className={`${preview ? "col-span-6" : "col-span-9"} p-3`}>
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-mono font-bold">{title}</div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded">● Obrigatório</span>
                <button className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded">💾 Salvar</button>
              </div>
            </div>
            {children}
          </main>
          {/* Preview painel */}
          {preview && (
            <aside className="col-span-3 bg-slate-900/40 border-l border-slate-800 p-2 flex flex-col">
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span className="text-slate-300">👁 Preview do Rótulo</span>
                <span className="text-emerald-400">● ao vivo</span>
              </div>
              <div className="flex-1">{preview}</div>
              <div className="grid grid-cols-2 gap-1 mt-2">
                <button className="bg-emerald-600 text-white text-[10px] py-1 rounded">💾 Salvar</button>
                <button className="bg-cyan-600 text-white text-[10px] py-1 rounded">🖨 Imprimir</button>
                <button className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] py-1 rounded">📊 CSV</button>
                <button className="bg-slate-800 border border-slate-700 text-slate-200 text-[10px] py-1 rounded">📄 Word</button>
                <button className="col-span-2 bg-slate-800 border border-slate-700 text-emerald-400 text-[10px] py-1 rounded">⚡ ZPL Zebra</button>
              </div>
            </aside>
          )}
        </div>
      </div>
    </Frame>
  );
};

const PreviewRotulo = ({ produto = "Produto não informado", forma = "Farelado", empresa = "Empresa", uf = "SP" }: { produto?: string; forma?: string; empresa?: string; uf?: string }) => (
  <div className="bg-white text-slate-900 rounded p-2 text-[10px] h-full">
    <div className="text-[9px] text-slate-500">Empresa</div>
    <div className="font-bold text-sm leading-tight mb-1">{produto}</div>
    <div className="border-t border-slate-300 my-1" />
    <div><span className="font-semibold">Forma:</span> {forma}</div>
    <div className="border-t border-slate-300 my-1" />
    <div className="text-slate-500">{empresa}</div>
    <div>{uf}</div>
    <div className="text-[8px] text-slate-400 mt-2">Desenvolvido por BPF_Consult</div>
  </div>
);

export const RotulosDashboard = () => (
  <NALShell active="empresa" title="🏢 Cadastro da Empresa" preview={<PreviewRotulo />}>
    <div className="bg-cyan-500/5 border border-cyan-500/30 rounded p-2 text-[10px] text-cyan-200 mb-3">
      <strong> de fiscalização:</strong> Nome e endereço do fabricante/importador devem constar obrigatoriamente no rótulo. CNPJ e Inscrição Estadual exigidos para registro junto ao MAPA.
    </div>
    <div className="border border-slate-800 rounded p-2 mb-2">
      <div className="text-[10px] font-mono text-emerald-400 mb-2">| DADOS DA EMPRESA FABRICANTE</div>
      <div className="space-y-1.5">
        <div>
          <div className="text-[10px] text-slate-400 mb-0.5">Razão Social *</div>
          <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-500">Nome completo da empresa</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">CNPJ *</div>
            <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-500">00.000.000/0000-00</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-400 mb-0.5">Inscrição Estadual</div>
            <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-500">Número</div>
          </div>
        </div>
        <div>
          <div className="text-[10px] text-slate-400 mb-0.5">Registro MAPA / SIPEAGRO *</div>
          <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[10px] text-slate-500">Ex: BR 00/0000/DEF-RS</div>
        </div>
      </div>
    </div>
    <div className="border border-slate-800 rounded p-2">
      <div className="text-[10px] font-mono text-emerald-400 mb-2">| ENDEREÇO</div>
      <div className="grid grid-cols-3 gap-2 text-[10px]">
        <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-500">Rua, Av…</div>
        <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-500">Cidade</div>
        <div className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-slate-500">SP ▾</div>
      </div>
    </div>
  </NALShell>
);

export const RotulosEditor = () => (
  <NALShell active="produto" title="📦 Cadastro do Produto" preview={<PreviewRotulo produto="RAÇÃO BOVINOS CONF. 22% PB" forma="Farelado" empresa="Fábrica Demo Ltda" uf="SP" />}>
    <div className="border border-slate-800 rounded p-2 mb-2">
      <div className="text-[10px] font-mono text-emerald-400 mb-2">| IDENTIFICAÇÃO DO PRODUTO</div>
      <div className="space-y-1.5 text-[10px]">
        <div>
          <div className="text-slate-400 mb-0.5">Nome comercial *</div>
          <div className="bg-slate-900 border border-emerald-600/40 rounded px-2 py-1">Ração Bovinos Confinamento 22% PB</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div><div className="text-slate-400 mb-0.5">Categoria</div><div className="bg-slate-900 border border-slate-700 rounded px-2 py-1">Ração completa ▾</div></div>
          <div><div className="text-slate-400 mb-0.5">Espécie</div><div className="bg-slate-900 border border-slate-700 rounded px-2 py-1">Bovinos corte ▾</div></div>
          <div><div className="text-slate-400 mb-0.5">Forma física</div><div className="bg-slate-900 border border-slate-700 rounded px-2 py-1">Farelado ▾</div></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><div className="text-slate-400 mb-0.5">Lote</div><div className="bg-slate-900 border border-slate-700 rounded px-2 py-1">L240501</div></div>
          <div><div className="text-slate-400 mb-0.5">Validade</div><div className="bg-slate-900 border border-slate-700 rounded px-2 py-1">01/08/2026</div></div>
        </div>
      </div>
    </div>
    <div className="bg-emerald-500/10 border border-emerald-500/40 rounded p-2 text-[10px] text-emerald-300">
      ✓ 18/18 campos obrigatórios da RTPI preenchidos — pronto para impressão
    </div>
  </NALShell>
);

export const RotulosFichaTecnica = () => (
  <NALShell active="ingredientes" title="🌾 Composição — Ingredientes" preview={<PreviewRotulo produto="PREMIX MINERAL VACAS LEITE" forma="Pó" empresa="Fábrica Demo Ltda" uf="SP" />}>
    <div className="border border-slate-800 rounded overflow-hidden">
      <table className="w-full text-[10px]">
        <thead className="bg-slate-900 text-slate-400">
          <tr><th className="text-left px-2 py-1.5">Ingrediente</th><th className="text-right px-2 py-1.5">% inclusão</th><th className="text-left px-2 py-1.5">Origem</th><th className="text-right px-2 py-1.5">Ação</th></tr>
        </thead>
        <tbody>
          {[
            { i: "Calcário calcítico", p: "42,0", o: "Mineral" },
            { i: "Fosfato bicálcico", p: "28,0", o: "Mineral" },
            { i: "Cloreto de sódio", p: "15,0", o: "Mineral" },
            { i: "Sulfato de zinco", p: "0,8", o: "Mineral" },
            { i: "Selenito de sódio", p: "0,02", o: "Mineral" },
          ].map((r) => (
            <tr key={r.i} className="border-t border-slate-800">
              <td className="px-2 py-1">{r.i}</td>
              <td className="px-2 py-1 text-right text-emerald-400">{r.p}</td>
              <td className="px-2 py-1 text-slate-400">{r.o}</td>
              <td className="px-2 py-1 text-right text-slate-500">✎ 🗑</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <button className="mt-2 w-full border border-dashed border-emerald-500/40 text-emerald-400 text-[10px] py-1.5 rounded">+ Adicionar ingrediente</button>
  </NALShell>
);

export const RotulosNiveisGarantia = () => (
  <NALShell active="niveis" title="📊 Níveis de Garantia (conversão automática g↔mg)" preview={<PreviewRotulo produto="RAÇÃO BOVINOS CONF. 22% PB" forma="Farelado" empresa="Fábrica Demo Ltda" uf="SP" />}>
    <div className="border border-slate-800 rounded overflow-hidden">
      <table className="w-full text-[10px]">
        <thead className="bg-slate-900 text-slate-400">
          <tr><th className="text-left px-2 py-1.5">Nutriente</th><th className="text-right px-2 py-1.5">Valor</th><th className="text-left px-2 py-1.5">Unidade</th><th className="text-left px-2 py-1.5">Tipo</th></tr>
        </thead>
        <tbody>
          <tr className="border-t border-slate-800"><td className="px-2 py-1">Proteína Bruta</td><td className="text-right text-emerald-400">22,0</td><td>%</td><td className="text-slate-400">Mín.</td></tr>
          <tr className="border-t border-slate-800"><td className="px-2 py-1">Cálcio</td><td className="text-right text-emerald-400">8.000</td><td className="text-cyan-400">mg/kg → 8 g/kg</td><td className="text-slate-400">Mín-Máx</td></tr>
          <tr className="border-t border-slate-800"><td className="px-2 py-1">Fitase</td><td className="text-right text-emerald-400">500</td><td className="text-amber-400">FTU/kg</td><td className="text-slate-400">Mín.</td></tr>
          <tr className="border-t border-slate-800"><td className="px-2 py-1">Lactobacillus</td><td className="text-right text-emerald-400">1,0×10⁹</td><td className="text-amber-400">UFC/g</td><td className="text-slate-400">Mín.</td></tr>
          <tr className="border-t border-slate-800"><td className="px-2 py-1">Vitamina A</td><td className="text-right text-emerald-400">10.000</td><td className="text-amber-400">UI/kg</td><td className="text-slate-400">Mín.</td></tr>
        </tbody>
      </table>
    </div>
    <div className="mt-2 text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/30 p-2 rounded">
      ⚠ Unidades destacadas (UFC, FTU, UI, KUI) não sofrem conversão g↔mg — apresentadas conforme cadastro.
    </div>
  </NALShell>
);

export const RotulosExportacao = () => (
  <NALShell active="salvos" title="💾 Rótulos Salvos — Exportação" preview={<PreviewRotulo produto="RAÇÃO BOVINOS CONF. 22% PB" forma="Farelado" empresa="Fábrica Demo Ltda" uf="SP" />}>
    <div className="grid grid-cols-3 gap-2 mb-2">
      <div className="bg-slate-900 border border-slate-700 rounded p-2 text-center">
        <div className="h-12 flex items-center justify-center bg-slate-950 rounded mb-1 text-[9px] text-slate-500">[ Preview PDF ]</div>
        <div className="text-[10px] font-semibold">PDF 300dpi</div>
        <button className="w-full bg-emerald-600 text-white text-[9px] py-1 rounded mt-1">Baixar</button>
      </div>
      <div className="bg-slate-900 border border-slate-700 rounded p-2 text-center">
        <div className="h-12 flex items-center justify-center bg-black text-emerald-400 rounded mb-1 text-[8px] font-mono">^XA^FO50,50^XZ</div>
        <div className="text-[10px] font-semibold">ZPL Zebra</div>
        <button className="w-full bg-slate-700 text-white text-[9px] py-1 rounded mt-1">Baixar .zpl</button>
      </div>
      <div className="bg-slate-900 border border-slate-700 rounded p-2 text-center">
        <div className="h-12 flex items-center justify-center bg-slate-950 rounded mb-1">
          <div className="grid grid-cols-5 gap-px">{Array.from({length:25}).map((_,i)=><span key={i} className={`w-1 h-1 ${i%3===0?'bg-white':'bg-slate-700'}`}/>)}</div>
        </div>
        <div className="text-[10px] font-semibold">QR Code</div>
        <button className="w-full bg-emerald-600 text-white text-[9px] py-1 rounded mt-1">Baixar PNG</button>
      </div>
    </div>
    <div className="bg-emerald-500/10 border border-emerald-500/40 rounded p-2 text-[10px] text-emerald-300">
      ✓ Lote L240501 — Pronto para impressão · 5.000 unidades programadas
    </div>
  </NALShell>
);

export const RotulosVersionamento = () => (
  <NALShell active="salvos" title="🗂 Rótulos Salvos — Histórico de Versões" preview={<PreviewRotulo produto="RAÇÃO BOVINOS CONF. 22% PB" forma="Farelado" empresa="Fábrica Demo Ltda" uf="SP" />}>
    <div className="space-y-1.5">
      {[
        { v: "v3", data: "02/05/2026", autor: "Carlos Mendes", obs: "Atualização de Reg. MAPA e níveis Ca/P", status: "Ativa" },
        { v: "v2", data: "15/02/2026", autor: "Ana Paula", obs: "Correção FB máx. (80g)", status: "Obsoleta" },
        { v: "v1", data: "10/01/2026", autor: "Carlos Mendes", obs: "Versão inicial", status: "Obsoleta" },
      ].map((r) => (
        <div key={r.v} className="bg-slate-900 border border-slate-800 rounded p-2 flex items-center gap-2 text-[10px]">
          <div className={`px-2 py-0.5 rounded font-bold ${r.status === "Ativa" ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40" : "bg-slate-800 text-slate-500 border border-slate-700"}`}>{r.v}</div>
          <div className="flex-1">
            <div className="font-semibold text-slate-200">{r.obs}</div>
            <div className="text-slate-500 text-[9px]">{r.autor} · {r.data}</div>
          </div>
          <span className={`text-[9px] px-1.5 py-0.5 rounded ${r.status === "Ativa" ? "text-emerald-300 border border-emerald-500/40" : "text-slate-500 border border-slate-700"}`}>{r.status}</span>
        </div>
      ))}
    </div>
    <div className="mt-2 text-[10px] text-cyan-300 bg-cyan-500/10 border border-cyan-500/30 p-2 rounded">
 🔒 Cada versão selada com hash SHA-256 — histórico imutável para auditoria.
 </div>
  </NALShell>
);
