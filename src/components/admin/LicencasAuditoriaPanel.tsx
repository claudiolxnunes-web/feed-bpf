import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  Link2,
  Loader2,
  RefreshCw,
  Search,
  Wrench,
} from "lucide-react";
import { getProductLabel } from "@/utils/productUtils";

interface LicencaItem {
  id: string;
  empresa_id: string | null;
  empresa_nome: string | null;
  nivel: string | null;
  plano: string | null;
  data_expiracao: string | null;
  liberado_admin: boolean;
  manter: boolean;
}

interface Problema {
  tipo: "duplicada" | "solta";
  user_id: string;
  email: string;
  produto: string;
  manter_id: string;
  manter_empresa: string | null;
  empresa_sugerida_id?: string | null;
  empresa_sugerida_nome?: string | null;
  licencas: LicencaItem[];
  acao: string;
}

interface AuditResult {
  total: number;
  duplicadas: number;
  soltas: number;
  problemas: Problema[];
}

export default function LicencasAuditoriaPanel() {
  const [result, setResult] = useState<AuditResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [fixing, setFixing] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "audit_duplicates" },
      });
      if (error) throw error;
      setResult(data as AuditResult);
    } catch (e) {
      console.error(e);
      toast.error("Não foi possível carregar a auditoria de licenças");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const corrigir = async (p?: Problema) => {
    const key = p ? `${p.user_id}::${p.produto}` : "all";
    setFixing(key);
    try {
      const { data, error } = await supabase.functions.invoke("admin-licencas", {
        body: {
          action: "fix_duplicates",
          ...(p ? { user_id: p.user_id, produto: p.produto } : {}),
        },
      });
      if (error) throw error;
      const r = data as { revogadas: number; vinculadas: number; erros: string[] };
      toast.success(
        `Correção concluída — ${r.revogadas} revogada(s), ${r.vinculadas} vinculada(s)` +
          (r.erros?.length ? ` · ${r.erros.length} erro(s)` : "")
      );
      if (r.erros?.length) r.erros.forEach((msg) => toast.error(msg));
      await carregar();
    } catch (e) {
      console.error(e);
      toast.error("Falha ao aplicar a correção automática");
    } finally {
      setFixing(null);
    }
  };

  const problemas = (result?.problemas || []).filter((p) => {
    const t = busca.trim().toLowerCase();
    if (!t) return true;
    return (
      p.email.toLowerCase().includes(t) ||
      p.produto.toLowerCase().includes(t) ||
      p.licencas.some((l) => (l.empresa_nome || "").toLowerCase().includes(t))
    );
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-amber-500" />
            <div>
              <p className="text-2xl font-bold">{result?.total ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Inconsistências</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Copy className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{result?.duplicadas ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Licenças duplicadas</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-3">
            <Link2 className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{result?.soltas ?? "—"}</p>
              <p className="text-xs text-muted-foreground">Licenças sem empresa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5 text-primary" />
            Auditoria de Licenças
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar e-mail, produto ou empresa"
                className="pl-8 w-64"
              />
            </div>
            <Button variant="outline" onClick={() => void carregar()} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Reanalisar
            </Button>
            <Button
              onClick={() => void corrigir()}
              disabled={loading || fixing !== null || !result?.total}
              className="gap-2"
            >
              {fixing === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
              Corrigir tudo
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && !result ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : problemas.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
              <p className="text-muted-foreground">
                Nenhuma licença duplicada ou solta encontrada.
              </p>
            </div>
          ) : (
            problemas.map((p) => (
              <Card key={`${p.user_id}-${p.produto}`} className="border-l-4 border-l-amber-500">
                <CardContent className="pt-4 space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant={p.tipo === "duplicada" ? "destructive" : "secondary"}>
                          {p.tipo === "duplicada" ? "Duplicada" : "Sem empresa"}
                        </Badge>
                        <span className="font-semibold">{p.email}</span>
                        <Badge variant="outline">{getProductLabel(p.produto)}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{p.acao}</p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2"
                      disabled={
                        fixing !== null ||
                        (p.tipo === "solta" && !p.empresa_sugerida_id)
                      }
                      onClick={() => void corrigir(p)}
                    >
                      {fixing === `${p.user_id}::${p.produto}` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                      Corrigir
                    </Button>
                  </div>

                  <div className="rounded-md border divide-y">
                    {p.licencas.map((l) => (
                      <div
                        key={l.id}
                        className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm"
                      >
                        <div className="flex items-center gap-2 flex-wrap">
                          {l.manter ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20">
                              Manter
                            </Badge>
                          ) : (
                            <Badge variant="destructive">Revogar</Badge>
                          )}
                          <span className="text-muted-foreground">
                            {l.empresa_nome || "Sem empresa vinculada"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span>Nível: {l.nivel || "—"}</span>
                          <span>Plano: {l.plano || "—"}</span>
                          <span>Expira: {l.data_expiracao || "—"}</span>
                          {l.liberado_admin && <Badge variant="outline">Admin</Badge>}
                        </div>
                      </div>
                    ))}
                  </div>

                  {p.tipo === "solta" && (
                    <p className="text-xs text-muted-foreground">
                      {p.empresa_sugerida_id
                        ? `Será vinculada à empresa: ${p.empresa_sugerida_nome}`
                        : "Usuário possui mais de uma empresa — vincule manualmente na aba Licenças."}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
