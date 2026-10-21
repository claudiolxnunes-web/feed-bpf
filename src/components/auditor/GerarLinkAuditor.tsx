import { useEffect, useState } from "react";
import { AlertTriangle, Copy, Link2, ShieldCheck, Trash2 } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface TokenRow {
  id: string;
  nome_auditor: string | null;
  orgao_fiscalizador: string | null;
  expira_em: string;
  ativo: boolean;
  total_acessos: number;
  ultimo_acesso_em: string | null;
  created_at: string;
}

export default function GerarLinkAuditor() {
  const { empresaAtiva } = useEmpresa();
  const [tokens, setTokens] = useState<TokenRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [form, setForm] = useState({ nome_auditor: "", orgao_fiscalizador: "MAPA", duracao_horas: "168" });

  const fetchTokens = async () => {
    if (!empresaAtiva) return;
    const { data, error } = await supabase
      .from("auditor_tokens")
      .select("id, nome_auditor, orgao_fiscalizador, expira_em, ativo, total_acessos, ultimo_acesso_em, created_at")
      .eq("empresa_id", empresaAtiva.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) toast.error("Erro ao carregar tokens");
    else setTokens((data ?? []) as TokenRow[]);
  };

  useEffect(() => {
    fetchTokens();
  }, [empresaAtiva?.id]);

  const portalUrl = (token: string) => `${window.location.origin}/auditor/${token}`;

  const handleGerar = async () => {
    if (!empresaAtiva) {
      toast.error("Selecione uma empresa antes");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.rpc("criar_auditor_token", {
      _empresa_id: empresaAtiva.id,
      _nome_auditor: form.nome_auditor || null,
      _orgao_fiscalizador: form.orgao_fiscalizador || null,
      _duracao_horas: Number(form.duracao_horas),
      _observacoes: "",
    });
    setLoading(false);

    const res = data as { ok?: boolean; token?: string; error?: string } | null;
    if (error || !res?.ok || !res.token) {
      toast.error("Falha ao gerar token: " + (res?.error ?? error?.message ?? ""));
      return;
    }
    setGeneratedToken(res.token);
    setDialogOpen(true);
    fetchTokens();
  };

  const revogar = async (id: string) => {
    if (!confirm("Revogar este link? O auditor perderá o acesso imediatamente.")) return;
    const { error } = await supabase
      .from("auditor_tokens")
      .update({ ativo: false, revogado_em: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error("Erro ao revogar");
    else {
      toast.success("Link revogado");
      fetchTokens();
    }
  };

  const copiar = async (token: string) => {
    await navigator.clipboard.writeText(portalUrl(token));
    toast.success("Link copiado!");
  };

  const isExpired = (expira_em: string) => new Date(expira_em).getTime() < Date.now();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-base">
          <ShieldCheck className="w-4 h-4 text-primary" /> Acesso Temporário do Auditor
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          Gere um link/QR para o fiscal acessar registros sem login. Tudo que ele abrir fica registrado em trilha de
          auditoria.
        </div>

        <div className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-xs">Nome do auditor</Label>
            <Input
              value={form.nome_auditor}
              onChange={(e) => setForm({ ...form, nome_auditor: e.target.value })}
              placeholder="Ex: João Silva"
            />
          </div>
          <div>
            <Label className="text-xs">Órgão</Label>
            <Input
              value={form.orgao_fiscalizador}
              onChange={(e) => setForm({ ...form, orgao_fiscalizador: e.target.value })}
              placeholder="MAPA / SFA"
            />
          </div>
          <div>
            <Label className="text-xs">Duração</Label>
            <Select value={form.duracao_horas} onValueChange={(v) => setForm({ ...form, duracao_horas: v })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 horas</SelectItem>
                <SelectItem value="4">4 horas</SelectItem>
                <SelectItem value="8">8 horas</SelectItem>
                <SelectItem value="24">24 horas</SelectItem>
                <SelectItem value="72">3 dias</SelectItem>
                <SelectItem value="168">7 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGerar} disabled={loading || !empresaAtiva} className="gap-2">
            <Link2 className="w-4 h-4" /> Gerar link/QR
          </Button>
        </div>

        {tokens.length > 0 && (
          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Órgão</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Acessos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => {
                  const expired = isExpired(t.expira_em);
                  const statusLabel = !t.ativo ? "Revogado" : expired ? "Expirado" : "Ativo";
                  const statusVariant: "secondary" | "destructive" | "default" = !t.ativo
                    ? "secondary"
                    : expired
                      ? "destructive"
                      : "default";
                  return (
                    <TableRow key={t.id}>
                      <TableCell className="text-sm">{t.nome_auditor ?? "—"}</TableCell>
                      <TableCell className="text-sm">{t.orgao_fiscalizador ?? "—"}</TableCell>
                      <TableCell className="text-xs">{new Date(t.expira_em).toLocaleString("pt-BR")}</TableCell>
                      <TableCell className="text-xs">
                        {t.total_acessos}
                        {t.ultimo_acesso_em && (
                          <span className="block text-muted-foreground">
                            último: {new Date(t.ultimo_acesso_em).toLocaleString("pt-BR")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {t.ativo && !expired && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revogar(t.id)}
                            title="Revogar"
                            className="text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setGeneratedToken(null);
          }}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Link de acesso do auditor</DialogTitle>
            </DialogHeader>
            {generatedToken && (
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Este token será exibido apenas uma vez.</strong> Por segurança, ele é armazenado em hash no
                    banco e não poderá ser visualizado novamente. Copie ou compartilhe o QR agora.
                  </span>
                </div>
                <div className="flex justify-center bg-white p-4 rounded-lg">
                  <QRCodeSVG value={portalUrl(generatedToken)} size={220} />
                </div>
                <div>
                  <Label className="text-xs">Link</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={portalUrl(generatedToken)} className="text-xs font-mono" />
                    <Button size="sm" onClick={() => copiar(generatedToken)}>
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Mostre o QR code ao auditor ou envie o link. Ele acessa sem login em modo somente-leitura.
                </p>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
