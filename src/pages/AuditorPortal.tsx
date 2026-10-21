import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ShieldCheck, Loader2, AlertTriangle, Clock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

interface Empresa {
  nome?: string; cnpj?: string; endereco?: string;
  responsavel_tecnico?: string; crmv?: string; capacidade?: string;
  tipo_producao?: string[];
}

const MODULES = [
  { key: "documentos", label: "📄 Documentos" },
  { key: "execucao_pops", label: "✅ Execução POPs" },
  { key: "analises", label: "🧪 Análises" },
  { key: "calibracoes", label: "⚙️ Calibrações" },
  { key: "manutencoes", label: "🔧 Manutenções" },
  { key: "fornecedores", label: "🏭 Fornecedores" },
  { key: "higiene", label: "🧼 Higiene" },
  { key: "pragas", label: "🐀 Pragas" },
  { key: "residuos", label: "♻️ Resíduos" },
  { key: "substancias", label: "⚠️ Substâncias" },
  { key: "visitantes", label: "👤 Visitantes" },
  { key: "formulas", label: "📐 Fórmulas" },
  { key: "expedicoes", label: "🚚 Expedições" },
];

export default function AuditorPortal() {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empresaNome, setEmpresaNome] = useState("");
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [expiraEm, setExpiraEm] = useState<string>("");

  const callApi = async ({ token: auditorToken, ...params }: Record<string, string>) => {
    const url = new URL(`${SUPABASE_URL}/functions/v1/auditor-portal`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    // Token vai no header: na query string ele vaza em logs de borda e no Referer.
    const res = await fetch(url, {
      headers: { apikey: ANON, Authorization: `Bearer ${ANON}`, "x-auditor-token": auditorToken ?? "" },
    });
    return res.json();
  };

  useEffect(() => {
    if (!token) return;
    (async () => {
      const r = await callApi({ action: "validate", token });
      if (!r.ok) { setError(r.error ?? "Acesso negado"); setLoading(false); return; }
      setEmpresaNome(r.empresa_nome ?? "");
      setEmpresa(r.empresa ?? null);
      setExpiraEm(r.expira_em ?? "");
      setLoading(false);
    })();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-3">
            <AlertTriangle className="w-12 h-12 mx-auto text-destructive" />
            <h1 className="font-display text-xl font-bold">Acesso indisponível</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground">Solicite um novo link ao responsável da empresa.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="max-w-6xl mx-auto p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <div>
              <h1 className="font-display font-bold text-lg">Painel do Auditor</h1>
              <p className="text-xs text-sidebar-foreground/70">Modo somente leitura — registros de auditoria</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Clock className="w-3 h-3" />
            Expira em {new Date(expiraEm).toLocaleString("pt-BR")}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 md:p-6 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 font-display text-base">
              <Building2 className="w-4 h-4" /> {empresaNome}
            </CardTitle>
          </CardHeader>
          {empresa && (
            <CardContent className="grid md:grid-cols-3 gap-3 text-sm pt-0">
              {empresa.cnpj && <div><span className="text-muted-foreground">CNPJ:</span> {empresa.cnpj}</div>}
              {empresa.endereco && <div><span className="text-muted-foreground">Endereço:</span> {empresa.endereco}</div>}
              {empresa.responsavel_tecnico && <div><span className="text-muted-foreground">RT:</span> {empresa.responsavel_tecnico}</div>}
              {empresa.crmv && <div><span className="text-muted-foreground">CRMV:</span> {empresa.crmv}</div>}
              {empresa.capacidade && <div><span className="text-muted-foreground">Capacidade:</span> {empresa.capacidade}</div>}
              {empresa.tipo_producao?.length && (
                <div className="md:col-span-3 flex flex-wrap gap-1">
                  {empresa.tipo_producao.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Tabs defaultValue="documentos">
          <TabsList className="flex flex-wrap h-auto">
            {MODULES.map((m) => (
              <TabsTrigger key={m.key} value={m.key} className="text-xs">{m.label}</TabsTrigger>
            ))}
          </TabsList>
          {MODULES.map((m) => (
            <TabsContent key={m.key} value={m.key}>
              <ModuloTable token={token!} modulo={m.key} callApi={callApi} />
            </TabsContent>
          ))}
        </Tabs>

        <p className="text-xs text-center text-muted-foreground py-4">
          🔒 Todos os acessos a este painel são registrados em trilha de auditoria.
        </p>
      </main>
    </div>
  );
}

function ModuloTable({
  token, modulo, callApi,
}: {
  token: string;
  modulo: string;
  callApi: (params: Record<string, string>) => Promise<{ ok: boolean; items?: Record<string, unknown>[]; error?: string }>;
}) {
  const [items, setItems] = useState<Record<string, unknown>[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setErr(null);
    callApi({ action: "list", token, modulo }).then((r) => {
      if (r.ok) setItems(r.items ?? []);
      else setErr(r.error ?? "Erro");
      setLoading(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modulo]);

  if (loading) return <div className="py-8 text-center text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin inline mr-2" />Carregando...</div>;
  if (err) return <div className="py-8 text-center text-sm text-destructive">{err}</div>;
  if (!items || items.length === 0) return <div className="py-8 text-center text-sm text-muted-foreground">Sem registros</div>;

  const cols = Object.keys(items[0]).filter((c) => c !== "id");

  return (
    <div className="border rounded-lg overflow-x-auto mt-3">
      <Table>
        <TableHeader>
          <TableRow>
            {cols.map((c) => <TableHead key={c} className="text-xs whitespace-nowrap">{c.replace(/_/g, " ")}</TableHead>)}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((row, i) => (
            <TableRow key={i}>
              {cols.map((c) => {
                const v = row[c];
                let display: string = "";
                if (v === null || v === undefined) display = "—";
                else if (typeof v === "boolean") display = v ? "✅" : "❌";
                else display = String(v);
                return <TableCell key={c} className="text-xs whitespace-nowrap">{display}</TableCell>;
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
