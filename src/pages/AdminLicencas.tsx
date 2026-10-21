import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Shield, UserCheck, UserX, Loader2, RefreshCw, Building2, Search, Plus } from "lucide-react";
import { canAccessLicenseAdmin } from "@/config/adminAccess";
import { getProductLabel, PRODUCT_LABELS } from "@/utils/productUtils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface LicenseEntry {
  id: string;
  user_id: string;
  empresa_id: string | null;
  email: string;
  empresa_nome: string;
  produto?: string;
  plano: string;
  status: string;
  data_inicio: string;
  data_expiracao: string;
  liberado_admin: boolean;
  nivel?: string | null;
  origem?: "direta" | "consultor";
  licenca_id?: string;
  ativo?: boolean;
  excedente?: boolean;
}

const PLAN_LABELS: Record<string, string> = {
  trial: "Trial (7 dias)",
  "3_meses": "Trimestral",
  "6_meses": "Semestral",
  "1_ano": "Anual",
};

// PRODUCT_LABELS removed in favor of central productUtils

const ACCESS_LEVEL_LABELS: Record<string, string> = {
  entrada: "Entrada",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

export default function AdminLicencas({
  isTab = false,
  product: forcedProduct,
}: {
  isTab?: boolean;
  product?: string;
}) {
  const { user, roles, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<LicenseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<Record<string, string>>({});
  const [selectedLevels, setSelectedLevels] = useState<Record<string, string>>({});
  const { product: urlProduct } = useParams();
  const product = forcedProduct || urlProduct;
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    email: "",
    produto: product || "auditsbpf",
    dias: "365",
    nivel: "entrada",
  });
  const [creating, setCreating] = useState(false);

  const PRODUTOS_OPCOES = useMemo(
    () => [
      { value: "feedbpf", label: "Feed_BPF" },
      { value: "auditsbpf", label: "Audits_BPF" },
      { value: "agrorc", label: "Agro RC CRM" },
      { value: "rotulos", label: "Nutri_Agro Labels" },
      { value: "nutricrm", label: "NutriCRM" },
      { value: "agrogestao", label: "AgroGestão CRM" },
    ],
    [],
  );

  const handleCreate = async () => {
    if (!createForm.email || !createForm.produto || !createForm.dias) {
      toast.error("Preencha e-mail, produto e período");
      return;
    }
    setCreating(true);
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: {
          action: "create",
          email: createForm.email.trim(),
          produto: createForm.produto,
          dias: Number(createForm.dias),
          nivel: createForm.nivel,
        },
      });
      if (error) throw error;
      toast.success("Licença criada!");
      setCreateOpen(false);
      setCreateForm({ email: "", produto: "auditsbpf", dias: "365", nivel: "entrada" });
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message || "Erro ao criar licença");
    } finally {
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (!canAccessLicenseAdmin(roles, user?.email)) {
      setIsAdmin(false);
      return;
    }

    setIsAdmin(true);
  }, [roles, user]);

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-licencas", {
        body: {
          action: "list",
          produto: product,
        },
      });
      if (error) throw error;
      setEntries(data || []);
    } catch (err: any) {
      toast.error("Erro ao carregar licenças: " + err.message);
    } finally {
      setLoading(false);
    }
  }, [product]);

  useEffect(() => {
    if (isAdmin) fetchEntries();
  }, [isAdmin, fetchEntries]);

  const filtered = useMemo(
    () =>
      entries.filter(
        (e) =>
          e.empresa_nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.produto || "").toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [entries, searchTerm],
  );

  const grouped = useMemo(() => {
    const result: Record<string, LicenseEntry[]> = {};
    filtered.forEach((e) => {
      const p = e.produto || "sem_produto";
      if (!result[p]) result[p] = [];
      result[p].push(e);
    });
    return result;
  }, [filtered]);

  if (authLoading || isAdmin === null) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !canAccessLicenseAdmin(roles, user.email) || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleGrant = async (entry: LicenseEntry) => {
    const key = entry.licenca_id || entry.id;
    const dias = selectedDays[key];
    if (!dias) {
      toast.error("Selecione o período");
      return;
    }
    setActionLoading(key + "-grant");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: {
          action: "grant",
          licenca_id: entry.licenca_id || entry.id,
          empresa_id: entry.empresa_id,
          user_id: entry.user_id,
          dias: Number(dias),
          nivel: selectedLevels[entry.id] || entry.nivel || "entrada",
        },
      });
      if (error) throw error;
      toast.success("Licença concedida com sucesso!");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateLevel = async (entry: LicenseEntry) => {
    const targetId = entry.licenca_id || entry.id;
    const nivel = selectedLevels[targetId] || entry.nivel || "entrada";
    setActionLoading(targetId + "-level");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: {
          action: "update_level",
          licenca_id: targetId,
          empresa_id: entry.empresa_id,
          nivel,
        },
      });
      if (error) throw error;
      toast.success("Nível de acesso atualizado!");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevoke = async (entry: LicenseEntry) => {
    const targetId = entry.licenca_id || entry.id;
    setActionLoading(targetId + "-revoke");
    try {
      const { error } = await supabase.functions.invoke("admin-licencas", {
        body: { action: "revoke", licenca_id: targetId, empresa_id: entry.empresa_id },
      });
      if (error) throw error;
      toast.success("Acesso revogado!");
      fetchEntries();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const isActive = (e: LicenseEntry) =>
    (e.status === "ativa" && new Date(e.data_expiracao) > new Date()) || e.liberado_admin;

  const daysRemaining = (e: LicenseEntry) => {
    if (e.liberado_admin) return "∞";
    const diff = Math.ceil((new Date(e.data_expiracao).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? `${diff}d` : "0d";
  };
  const getEntryTitle = (entry: LicenseEntry) => {
    const empresaNome = entry.empresa_nome?.trim();
    if (empresaNome && empresaNome !== "—") return empresaNome;

    const produto = entry.produto ? getProductLabel(entry.produto) : "Licença sem empresa";
    return `${produto} · ${entry.email}`;
  };

  const canManage = true;

  return (
    <div className={isTab ? "space-y-6" : "min-h-screen bg-background p-4 md:p-8"}>
      <div className={isTab ? "space-y-6" : "max-w-5xl mx-auto space-y-6"}>
        {!isTab && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">
                  {product ? `Licenças: ${getProductLabel(product)}` : "Licenças por Empresa"}
                </h1>
                {product && (
                  <p className="text-sm text-muted-foreground">Gerenciando acesso específico para este programa</p>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </div>
        )}

        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por empresa ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Nova Licença
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Licença Manual</DialogTitle>
                <DialogDescription>
                  Conceda acesso a um programa para um usuário existente. O e-mail deve já estar cadastrado.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 py-2">
                <div className="space-y-1">
                  <Label htmlFor="email">E-mail do usuário</Label>
                  <Input
                    id="email"
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="usuario@empresa.com"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Programa</Label>
                  <Select
                    value={createForm.produto}
                    onValueChange={(v) => setCreateForm((p) => ({ ...p, produto: v }))}
                    disabled={!!product}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUTOS_OPCOES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Período</Label>
                    <Select value={createForm.dias} onValueChange={(v) => setCreateForm((p) => ({ ...p, dias: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30">30 dias</SelectItem>
                        <SelectItem value="90">90 dias</SelectItem>
                        <SelectItem value="180">180 dias</SelectItem>
                        <SelectItem value="365">1 ano</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Nível</Label>
                    <Select value={createForm.nivel} onValueChange={(v) => setCreateForm((p) => ({ ...p, nivel: v }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="entrada">Entrada</SelectItem>
                        <SelectItem value="intermediario">Intermediário</SelectItem>
                        <SelectItem value="avancado">Avançado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={creating}>
                  Cancelar
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button variant="outline" size="sm" onClick={fetchEntries} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">Nenhuma licença encontrada.</CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([prodKey, prodEntries]) => (
              <div key={prodKey} className="space-y-4">
                <div className="flex items-center gap-2 border-b pb-2">
                  <Badge variant="outline" className="text-sm px-3 py-1 bg-primary/5">
                    {getProductLabel(prodKey) || (prodKey === "sem_produto" ? "Sem Programa Definido" : prodKey)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{prodEntries.length} licença(s)</span>
                </div>

                <div className="grid gap-3">
                  {prodEntries.map((e) => (
                    <Card key={e.id} className="overflow-hidden">
                      <CardContent className="p-4 flex flex-col xl:flex-row xl:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                            <p className="font-medium truncate">{getEntryTitle(e)}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <span className="truncate font-mono text-xs">{e.email}</span>
                            <span>·</span>
                            <Badge variant="outline" className="text-[10px]">
                              {PLAN_LABELS[e.plano] || e.plano}
                            </Badge>
                            <span>·</span>
                            <span className="text-xs">
                              Nível: {ACCESS_LEVEL_LABELS[e.nivel || ""] || "Não definido"}
                            </span>
                            <span>·</span>
                            <span className="text-xs">
                              Exp: {new Date(e.data_expiracao).toLocaleDateString("pt-BR")}
                            </span>
                            <span>·</span>
                            <span className="text-xs font-bold">{daysRemaining(e)}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={isActive(e) ? "default" : "destructive"}>
                            {e.liberado_admin
                              ? "Admin"
                              : isActive(e)
                                ? "Ativa"
                                : e.status === "revogada"
                                  ? "Revogada"
                                  : "Expirada"}
                          </Badge>
                          {e.origem === "consultor" && <Badge variant="outline">Consultor</Badge>}
                          {e.excedente && <Badge variant="secondary">Excedente</Badge>}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          {(() => {
                            const targetId = e.licenca_id || e.id;
                            return (
                              <>
                                <Select
                                  value={selectedLevels[targetId] || e.nivel || "entrada"}
                                  onValueChange={(v) => setSelectedLevels((prev) => ({ ...prev, [targetId]: v }))}
                                >
                                  <SelectTrigger className="w-[140px] h-8 text-xs">
                                    <SelectValue placeholder="Nível" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="entrada">Entrada</SelectItem>
                                    <SelectItem value="intermediario">Intermediário</SelectItem>
                                    <SelectItem value="avancado">Avançado</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 text-xs"
                                  onClick={() => handleUpdateLevel(e)}
                                  disabled={!canManage || actionLoading === targetId + "-level"}
                                >
                                  {actionLoading === targetId + "-level" ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : null}
                                  Nível
                                </Button>

                                <Select
                                  value={selectedDays[targetId] || ""}
                                  onValueChange={(v) => setSelectedDays((prev) => ({ ...prev, [targetId]: v }))}
                                >
                                  <SelectTrigger className="w-[110px] h-8 text-xs">
                                    <SelectValue placeholder="Período" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="30">30 dias</SelectItem>
                                    <SelectItem value="90">90 dias</SelectItem>
                                    <SelectItem value="180">180 dias</SelectItem>
                                    <SelectItem value="365">1 ano</SelectItem>
                                  </SelectContent>
                                </Select>

                                <Button
                                  size="sm"
                                  className="h-8 text-xs"
                                  onClick={() => handleGrant(e)}
                                  disabled={!canManage || actionLoading === targetId + "-grant"}
                                >
                                  {actionLoading === targetId + "-grant" ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <UserCheck className="w-3 h-3 mr-1" />
                                  )}
                                  Liberar
                                </Button>

                                <Button
                                  size="sm"
                                  variant="destructive"
                                  className="h-8 text-xs"
                                  onClick={() => handleRevoke(e)}
                                  disabled={!canManage || actionLoading === targetId + "-revoke"}
                                >
                                  {actionLoading === targetId + "-revoke" ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-1" />
                                  ) : (
                                    <UserX className="w-3 h-3 mr-1" />
                                  )}
                                  Revogar
                                </Button>
                              </>
                            );
                          })()}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
