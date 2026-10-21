import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Send, Loader2, HeadphonesIcon, Sparkles, ThumbsUp, ThumbsDown, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Msg = { 
  id?: string;
  role: "user" | "assistant"; 
  content: string;
  userQuery?: string;
};

const WELCOME: Msg = {
  id: "welcome",
  role: "assistant",
  content:
    "Olá! 👋 Sou o **Assistente BPF_Consult**. Posso ajudar com dúvidas sobre **BPF**, **legislação MAPA** e **uso da plataforma**.\n\nComo posso ajudar hoje?",
};

// Rotas onde o widget NÃO deve aparecer (telas técnicas/embedadas)
const HIDDEN_ROUTES = ["/auditor/", "/instalar", "/admin-access"];

export default function SupportChatWidget() {
  const location = useLocation();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [ratedMessages, setRatedMessages] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (HIDDEN_ROUTES.some((r) => location.pathname.startsWith(r))) return null;

  const send = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { 
      id: Math.random().toString(36).substring(2, 15),
      role: "user", 
      content: text 
    };
    const history = [...messages.filter((m) => m !== WELCOME || messages.length > 1), userMsg];
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    const assistantId = Math.random().toString(36).substring(2, 15);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant" && last.id === assistantId) {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { 
          id: assistantId, 
          role: "assistant", 
          content: assistantSoFar,
          userQuery: text
        }];
      });
    };

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/support-chat`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (resp.status === 429) {
        toast.error("Muitas mensagens em sequência. Aguarde um instante.");
        setIsLoading(false);
        return;
      }
      if (resp.status === 402) {
        toast.error("Limite de uso atingido. Tente novamente mais tarde.");
        setIsLoading(false);
        return;
      }
      if (!resp.ok || !resp.body) {
        toast.error("Erro ao conectar com o assistente.");
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nl);
          buffer = buffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <>
      {/* Botão flutuante */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Abrir chat de atendimento"
          className="fixed bottom-5 right-5 z-[60] flex items-center gap-2 rounded-full bg-primary px-4 py-3 text-primary-foreground shadow-2xl shadow-primary/30 transition-all hover:scale-105 hover:shadow-primary/50 sm:bottom-6 sm:right-6"
        >
          <div className="relative">
            <MessageCircle className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <span className="text-sm font-semibold hidden sm:inline">Atendimento IA</span>
        </button>
      )}

      {/* Janela do chat */}
      {open && (
        <div
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl",
            "bottom-0 right-0 left-0 h-[85vh] sm:bottom-6 sm:right-6 sm:left-auto sm:h-[600px] sm:w-[400px] sm:rounded-2xl"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-primary to-primary/80 px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2 min-w-0">
              <div className="rounded-full bg-white/20 p-1.5">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold leading-tight">Assistente BPF_Consult</p>
                <p className="text-[11px] opacity-90 flex items-center gap-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Online · Respostas com IA
                </p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar chat"
              className="rounded-full p-1 hover:bg-white/20 transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mensagens */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 bg-muted/30">
            {messages.map((m, i) => (
              <div
                key={i}
                className={cn(
                  "flex",
                  m.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-3 py-2 text-sm",
                    m.role === "user"
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-card border border-border rounded-bl-sm"
                  )}
                >
                  {m.role === "assistant" ? (
                    <div className="space-y-2">
                      <div className="prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-ol:my-1">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                      
                      {m.id !== "welcome" && !isLoading && i === messages.length - 1 && (
                        <FeedbackArea 
                          messageId={m.id!} 
                          assistantResponse={m.content}
                          userQuery={m.userQuery}
                          onRated={() => setRatedMessages(prev => ({ ...prev, [m.id!]: true }))}
                          isRated={ratedMessages[m.id!]}
                          user={user}
                        />
                      )}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  )}
                </div>
              </div>
            ))}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <div className="flex justify-start">
                <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span className="text-muted-foreground">Pensando...</span>
                </div>
              </div>
            )}
          </div>

          {/* Escalonamento */}
          <div className="border-t border-border bg-card px-3 py-2">
            <button
              onClick={() => setContactOpen(true)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-muted py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition"
            >
              <HeadphonesIcon className="h-3.5 w-3.5" />
              Falar com um atendente humano
            </button>
          </div>

          {/* Input */}
          <div className="border-t border-border bg-card p-3">
            <div className="flex items-end gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Digite sua dúvida..."
                rows={1}
                className="resize-none min-h-[40px] max-h-[120px] text-sm"
                disabled={isLoading}
              />
              <Button
                size="icon"
                onClick={send}
                disabled={!input.trim() || isLoading}
                className="shrink-0"
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-center text-muted-foreground">
              Powered by IA · Respostas podem conter imprecisões
            </p>
          </div>
        </div>
      )}

      <ContactDialog
        open={contactOpen}
        onOpenChange={setContactOpen}
        chatContext={messages.length > 1 ? messages : undefined}
        user={user}
      />
    </>
  );
}

function FeedbackArea({
  messageId,
  assistantResponse,
  userQuery,
  onRated,
  isRated,
  user,
}: {
  messageId: string;
  assistantResponse: string;
  userQuery?: string;
  onRated: () => void;
  isRated: boolean;
  user: any;
}) {
  const [rating, setRating] = useState<number | null>(null);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleRate = async (val: number) => {
    setRating(val);
    // Auto-submit if it's a positive rating and no feedback is needed immediately
    if (val === 1) {
      await submitFeedback(val, "");
    }
  };

  const submitFeedback = async (val: number, text: string) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("ai_chat_feedback").insert({
        user_id: user?.id || null,
        user_query: userQuery || null,
        assistant_response: assistantResponse,
        rating: val,
        feedback_text: text || null,
      });

      if (error) throw error;
      setSubmitted(true);
      onRated();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      toast.error("Erro ao enviar avaliação.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted || isRated) {
    return (
      <div className="mt-2 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium animate-in fade-in slide-in-from-bottom-1">
        <Check className="h-3 w-3" />
        Obrigado pelo feedback!
      </div>
    );
  }

  return (
    <div className="mt-2 border-t border-border/50 pt-2 space-y-2 animate-in fade-in duration-500">
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avalie a resposta:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleRate(1)}
            disabled={isSubmitting}
            className={cn(
              "p-1 rounded-md transition-colors",
              rating === 1 ? "bg-emerald-100 text-emerald-600" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => handleRate(-1)}
            disabled={isSubmitting}
            className={cn(
              "p-1 rounded-md transition-colors",
              rating === -1 ? "bg-red-100 text-red-600" : "hover:bg-muted text-muted-foreground"
            )}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {rating === -1 && (
        <div className="space-y-2 animate-in zoom-in-95 duration-200">
          <Textarea
            placeholder="Como podemos melhorar esta resposta?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="text-[11px] min-h-[50px] bg-muted/50 border-none focus-visible:ring-1"
            rows={2}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => submitFeedback(-1, feedback)}
            disabled={isSubmitting}
            className="h-7 text-[10px] w-full bg-primary/5 hover:bg-primary/10"
          >
            {isSubmitting ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Enviar Feedback
          </Button>
        </div>
      )}
    </div>
  );
}

function ContactDialog({
  open,
  onOpenChange,
  chatContext,
  user,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  chatContext?: Msg[];
  user: any;
}) {
  const [form, setForm] = useState({
    nome: "",
    email: user?.email || "",
    telefone: "",
    mensagem: "",
  });
  const [sending, setSending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome || !form.email) {
      toast.error("Preencha nome e e-mail.");
      return;
    }
    setSending(true);
    try {
      const contextoChat = chatContext
        ?.slice(-6)
        .map((m) => `${m.role === "user" ? "Cliente" : "IA"}: ${m.content}`)
        .join("\n\n");
      const mensagemFinal = [
        form.mensagem.trim(),
        contextoChat ? `\n\n---\n📋 Contexto do chat com IA:\n${contextoChat}` : "",
      ]
        .filter(Boolean)
        .join("");

      const { error } = await supabase.from("leads_contato").insert({
        nome: form.nome.trim(),
        email: form.email.trim(),
        telefone: form.telefone.trim() || null,
        mensagem: mensagemFinal || null,
        programa: "Chat IA - Suporte",
        user_id: user?.id || null,
      });
      if (error) throw error;
      toast.success("Mensagem enviada! Nosso time entrará em contato em breve.");
      onOpenChange(false);
      setForm({ nome: "", email: user?.email || "", telefone: "", mensagem: "" });
    } catch (err: any) {
      toast.error("Erro: " + (err.message || "Tente novamente."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[70]">
        <DialogHeader>
          <DialogTitle>Falar com um atendente</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3 pt-2">
          <div>
            <Label htmlFor="sc-nome">Nome *</Label>
            <Input
              id="sc-nome"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
              required
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sc-email">E-mail *</Label>
              <Input
                id="sc-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="sc-tel">Telefone</Label>
              <Input
                id="sc-tel"
                value={form.telefone}
                onChange={(e) => setForm({ ...form, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="sc-msg">Como podemos ajudar?</Label>
            <Textarea
              id="sc-msg"
              value={form.mensagem}
              onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
              rows={4}
              placeholder="Descreva sua dúvida ou problema..."
              maxLength={2000}
            />
            {chatContext && chatContext.length > 1 && (
              <p className="text-[11px] text-muted-foreground mt-1">
                ℹ️ O histórico recente do chat com a IA será enviado junto.
              </p>
            )}
          </div>
          <Button type="submit" disabled={sending} className="w-full">
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
