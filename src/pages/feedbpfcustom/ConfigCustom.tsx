import { Settings, Info, ShieldCheck, Database, Loader2, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { useEmpresa } from "@/hooks/useEmpresa";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function ConfigCustom() {
  const { empresaAtiva } = useEmpresa();
  const [loadingBackup, setLoadingBackup] = useState(false);
  const [loadingRestore, setLoadingRestore] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportData = async () => {
    if (!empresaAtiva?.id) {
      toast.error("Selecione uma empresa primeiro");
      return;
    }

    setLoadingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke("backup-manager", {
        body: { action: "export", empresa_id: empresaAtiva.id },
      });

      if (error) throw error;

      const blob = new Blob([JSON.stringify(data.backup, null, 2)], { type: "application/json" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup_dados_${empresaAtiva.nome.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Backup de dados gerado com sucesso!");
    } catch (err: any) {
      console.error("Erro ao gerar backup:", err);
      toast.error("Falha ao gerar backup: " + (err.message || "Erro desconhecido"));
    } finally {
      setLoadingBackup(false);
    }
  };

  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !empresaAtiva?.id) return;

    // A restauracao sobrescreve registros existentes (upsert por id).
    if (!window.confirm(`Restaurar o backup em "${empresaAtiva.nome}"? Registros com o mesmo id serão sobrescritos.`)) {
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
      setLoadingRestore(true);
      try {
        const content = e.target?.result as string;
        const backupData = JSON.parse(content);

        const { data, error } = await supabase.functions.invoke("backup-manager", {
          body: { action: "restore", empresa_id: empresaAtiva.id, backup: backupData },
        });

        if (error) throw error;

        toast.success("Dados restaurados com sucesso!");
        console.log("Resultados da restauração:", data.results);
      } catch (err: any) {
        console.error("Erro ao restaurar dados:", err);
        toast.error("Falha ao restaurar dados: " + (err.message || "Formato de arquivo inválido"));
      } finally {
        setLoadingRestore(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <PageHeader icon={Settings} title="Configurações" description="Ajustes da conta e da empresa" />
      <EmpresaSelector />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
            <div className="space-y-2 text-sm">
              <p><strong>Empresa ativa:</strong> {empresaAtiva?.nome || "nenhuma"}</p>
              <p className="text-muted-foreground">Feed_BPF Custom usa o mesmo cadastro de empresas do restante da plataforma. Convide membros, configure PIN de aprovação e gerencie licenças no painel principal.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            <Button asChild variant="outline" size="sm"><Link to="/cadastro">Gerenciar empresa</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/configurar-pin">Configurar PIN</Link></Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-emerald-500/20 bg-emerald-50/30">
        <CardHeader>
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Backup e Proteção de Dados
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Garanta a segurança da sua documentação realizando backups periódicos. Conforme o Decreto 12.031/2024, os registros devem ser mantidos por 2 anos.
          </p>
          <div className="grid grid-cols-1 gap-2">
            <Button
              onClick={handleExportData}
              disabled={loadingBackup}
              variant="default"
              className="bg-emerald-600 hover:bg-emerald-700 w-full justify-start gap-2"
            >
              {loadingBackup ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              Exportar Dados (JSON)
            </Button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportData}
              accept=".json"
              className="hidden"
            />

            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={loadingRestore}
              variant="outline"
              className="w-full justify-start gap-2 border-amber-200 text-amber-700 hover:bg-amber-50"
            >
              {loadingRestore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              Importar Dados (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
