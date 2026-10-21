import { useState, useRef } from "react";
import { Upload, X, FileText, Image, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePapelEmpresa } from "@/hooks/usePapelEmpresa";
import { useLocation } from "react-router-dom";
import { rotaOperacional } from "@/lib/empresa-permissions";

interface FileUploadProps {
  bucket?: string;
  folder?: string;
  accept?: string;
  maxSizeMB?: number;
  onUploadComplete?: (url: string, fileName: string) => void;
  label?: string;
  currentUrl?: string | null;
  empresaId?: string | null;
}

export default function FileUpload({
  bucket = "documentos-bpf",
  folder = "geral",
  accept = "image/*,application/pdf",
  maxSizeMB = 10,
  onUploadComplete,
  label = "Anexar arquivo",
  currentUrl,
  empresaId,
}: FileUploadProps) {
  const { user } = useAuth();
  const { isVisualizador, loading } = usePapelEmpresa();
  const { pathname } = useLocation();
  const readOnly = rotaOperacional(pathname) && (isVisualizador || loading);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || readOnly) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo excede ${maxSizeMB}MB`);
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const empresaSegment = empresaId ? `${empresaId}/` : "";
    const path = `${user.id}/${empresaSegment}${folder}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      toast.error("Erro no upload: " + error.message);
      setUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    // For private buckets, use signed URL
    const { data: signedData } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    const finalUrl = signedData?.signedUrl || urlData.publicUrl;
    setPreview(finalUrl);
    setFileName(file.name);
    onUploadComplete?.(finalUrl, file.name);
    toast.success("Arquivo enviado com sucesso");
    setUploading(false);
  };

  const clear = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const isImage = preview?.match(/\.(jpg|jpeg|png|webp)/i) || preview?.includes("image");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading || readOnly}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {uploading ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Upload aria-hidden="true" className="w-4 h-4" />}
          {label}
        </Button>
        {preview && (
          <Button type="button" variant="ghost" size="sm" disabled={readOnly} onClick={clear} aria-label="Remover arquivo selecionado">
            <X aria-hidden="true" className="w-4 h-4" />
          </Button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        disabled={readOnly}
        accept={accept}
        onChange={handleUpload}
        className="hidden"
      />
      {preview && (
        <div className="border rounded-lg p-2 bg-muted/30">
          {isImage ? (
            <img src={preview} alt={fileName || "Prévia do arquivo"} className="max-h-32 rounded object-contain" />
          ) : (
            <a href={preview} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline">
              <FileText aria-hidden="true" className="w-4 h-4" />
              {fileName || "Ver arquivo"}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
