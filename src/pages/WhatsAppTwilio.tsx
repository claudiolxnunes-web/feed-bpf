import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { MessageSquare, Send, RefreshCw, Inbox } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Mensagem {
  id: string;
  message_sid: string | null;
  from_number: string | null;
  to_number: string | null;
  body: string | null;
  direction: string;
  status: string | null;
  created_at: string;
}

const WhatsAppTwilio = () => {
  const { empresaAtiva } = useEmpresa();
  const { toast } = useToast();
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMensagens = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("whatsapp_mensagens")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      setMensagens(data || []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMensagens();
  }, []);

  const handleSend = async () => {
    if (!to.trim() || !message.trim()) {
      toast({ variant: "destructive", title: "Preencha o número e a mensagem" });
      return;
    }
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: { to: to.trim(), message: message.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Registra envio na tabela
      await supabase.from("whatsapp_mensagens").insert({
        empresa_id: empresaAtiva?.id ?? null,
        message_sid: data?.sid ?? null,
        from_number: null,
        to_number: to.trim(),
        body: message.trim(),
        direction: "outbound",
        status: data?.status ?? "sent",
      });

      toast({ title: "Mensagem enviada", description: `SID: ${data?.sid ?? "—"}` });
      setMessage("");
      fetchMensagens();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao enviar", description: err.message });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="w-8 h-8 text-green-600" />
        <div>
          <h1 className="text-3xl font-bold">WhatsApp Cloud API (Meta)</h1>
          <p className="text-sm text-muted-foreground">
            Envie mensagens e veja o histórico de conversas usando a API oficial da Meta.
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" /> Enviar mensagem
            </CardTitle>
            <CardDescription>
              Use o formato internacional (ex: <code>5561996757585</code>). A Meta permite enviar mensagens livremente se o cliente tiver respondido nas últimas 24h.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="to">Número de destino</Label>
              <Input
                id="to"
                placeholder="+5511999999999"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea
                id="message"
                rows={5}
                placeholder="Digite sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <Button onClick={handleSend} disabled={sending} className="w-full">
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Enviando..." : "Enviar via WhatsApp API"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Inbox className="w-5 h-5" /> Configuração do Webhook (Meta)
            </CardTitle>
            <CardDescription>
              No painel da Meta, em <em>WhatsApp → Configuration</em>, use esta URL e o seu <code>Verify Token</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="p-3 bg-muted rounded text-xs break-all font-mono">
              {`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-webhook`}
            </div>
            <p className="text-xs text-muted-foreground">
              Método: <strong>POST</strong>. As mensagens recebidas aparecerão abaixo automaticamente.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Histórico de mensagens</CardTitle>
            <CardDescription>Últimas 50 mensagens recebidas e enviadas.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchMensagens} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {mensagens.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-lg text-sm text-muted-foreground">
              Nenhuma mensagem ainda.
            </div>
          ) : (
            <div className="space-y-2">
              {mensagens.map((m) => (
                <div
                  key={m.id}
                  className={`p-3 rounded-lg border ${
                    m.direction === "outbound" ? "bg-green-50 border-green-200" : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={m.direction === "outbound" ? "default" : "secondary"}>
                        {m.direction === "outbound" ? "Enviada" : "Recebida"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {m.direction === "outbound" ? `Para: ${m.to_number}` : `De: ${m.from_number}`}
                      </span>
                      {m.status && (
                        <span className="text-xs text-muted-foreground">• {m.status}</span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {format(new Date(m.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{m.body || "(sem conteúdo)"}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppTwilio;
