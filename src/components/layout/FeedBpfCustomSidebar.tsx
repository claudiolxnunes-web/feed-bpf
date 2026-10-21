import { Link, useLocation } from "react-router-dom";
import {
  FolderOpen,
  Upload,
  Layers,
  FileSignature,
  ChevronLeft,
  LogOut,
  Settings,
  Home,
  GraduationCap,
  Sparkles,
  FileSpreadsheet,
  BookOpenCheck,
  FileText,
  Rocket,
  ToggleRight,
  Package,
  FlaskConical,
  Tag,
  Truck,
  Droplets,
  SprayCan,
  HeartPulse,
  Archive,
  Warehouse,
  Wrench,
  Bug,
  Recycle,
  ShieldAlert,
  Grid3x3,
  ClipboardCheck,
  ListChecks,
  GraduationCap as GradCap,
  Factory,
  MapPin,
  Users,
  Tablet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useModulosCustom } from "@/hooks/useModulosCustom";

const baseItems = [
  { title: "Como Usar", icon: GraduationCap, url: "/feedbpf-custom/tutorial" },
  { title: "Guia Detalhado", icon: BookOpenCheck, url: "/feedbpf-custom/guia" },
  { title: "Arquivo Digital", icon: Archive, url: "/documentos-bpf" },
  { title: "Meu Acervo", icon: FolderOpen, url: "/feedbpf-custom/acervo" },
  { title: "Importação em Massa", icon: Upload, url: "/feedbpf-custom/importacao" },
  { title: "Importar Planilhas", icon: FileSpreadsheet, url: "/feedbpf-custom/planilhas" },
  { title: "Meus Modelos", icon: Layers, url: "/feedbpf-custom/modelos" },
  { title: "Google Forms", icon: FileText, url: "/feedbpf-custom/google-forms" },
  { title: "Tutorial Forms/Sheets", icon: Rocket, url: "/feedbpf-custom/tutorial-google" },
  { title: "Registros Digitais", icon: FileSignature, url: "/feedbpf-custom/registros" },
  { title: "Análise por IA", icon: Sparkles, url: "/feedbpf-custom/analise-ia" },
  { title: "Módulos Ativos", icon: ToggleRight, url: "/feedbpf-custom/modulos" },
  { title: "Backup e Dados", icon: ShieldAlert, url: "/feedbpf-custom/config" },
  { title: "Configurações", icon: Settings, url: "/feedbpf-custom/config" },
];

// Mapa: código do módulo → link + ícone da sidebar
const MODULO_LINKS: Record<string, { title: string; icon: any; url: string }> = {
  "produtos":         { title: "Produtos",         icon: Package,       url: "/produtos" },
  "formulas":         { title: "Fórmulas",         icon: FlaskConical,  url: "/formulas" },
  "rotulos":          { title: "Rótulos e RTPI",   icon: Tag,           url: "/rotulos" },
  "fornecedores":     { title: "Fornecedores",     icon: Truck,         url: "/fornecedores" },
  "pop-01-recebimento": { title: "POP 01 — Recebimento",  icon: Archive,       url: "/recebimento" },
  "pop-01-armazenamento": { title: "POP 01 — Armazenamento", icon: Warehouse,  url: "/armazenamento-transporte" },
  "pop-02-higiene":   { title: "POP 02 — Higiene",        icon: SprayCan,      url: "/higiene" },
  "pop-02-transporte":{ title: "POP 02 — Higiene do Transporte", icon: Truck, url: "/armazenamento-transporte" },
  "pop-03-saude":     { title: "POP 03 — Saúde e Treinamentos", icon: HeartPulse, url: "/treinamentos" },
  "pop-04-agua":      { title: "POP 04 — Água",           icon: Droplets,      url: "/potabilidade-agua" },
  "pop-05-producao":  { title: "POP 05 — Produção",       icon: Factory,       url: "/producao" },
  "pop-06-manutencao":{ title: "POP 06 — Manutenção",     icon: Wrench,        url: "/manutencao" },
  "pop-07-pragas":    { title: "POP 07 — Pragas",         icon: Bug,           url: "/pragas" },
  "pop-08-residuos":  { title: "POP 08 — Resíduos",       icon: Recycle,       url: "/residuos" },
  "pop-09-rastreabilidade": { title: "POP 09 — Rastreabilidade", icon: MapPin, url: "/rastreabilidade" },
  "pop-10-pac":       { title: "POP 10 — PAC",            icon: ShieldAlert,   url: "/matriz-risco" },
  "pcp":              { title: "PCP e Produção",  icon: Factory,       url: "/pcp" },
  "expedicao":        { title: "Expedição",       icon: MapPin,        url: "/expedicao" },
  "rastreabilidade":  { title: "POP 09 — Rastreabilidade", icon: MapPin,        url: "/rastreabilidade" },
  "tablet":           { title: "Modo Tablet",     icon: Tablet,        url: "/modo-tablet" },
  "nao-conformidades":{ title: "Não Conformidades", icon: ClipboardCheck, url: "/nao-conformidades" },
  "matriz-risco":     { title: "Matriz de Risco", icon: Grid3x3,       url: "/matriz-risco" },
  "auditoria":        { title: "Auditoria",       icon: ListChecks,    url: "/auditoria" },
  "tf-autocontroles": { title: "TF Autocontroles",icon: ListChecks,    url: "/simulador-tf-autocontroles" },
  "treinamentos":     { title: "POP 03 — Treinamentos",    icon: GradCap,       url: "/treinamentos" },
};

export function FeedBpfCustomSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { toggleSidebar, state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const { ativos } = useModulosCustom();
  const modulosAtivos = ativos
    .map((m) => MODULO_LINKS[m.codigo])
    .filter(Boolean) as Array<{ title: string; icon: any; url: string }>;

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50 bg-card/50 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center shrink-0">
              <FolderOpen className="w-5 h-5 text-white" />
            </div>
            {!isCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-sm tracking-tight truncate bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                  Feed_BPF Custom
                </span>
                <span className="text-[10px] text-muted-foreground truncate">Gestor de Documentos</span>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="hidden md:flex shrink-0 hover:bg-emerald-500/10 hover:text-emerald-600"
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarMenu>
          {baseItems.map((item) => {
            const active = location.pathname === item.url || location.pathname.startsWith(item.url + "/");
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  asChild
                  isActive={active}
                  tooltip={item.title}
                  className={cn(
                    "transition-all",
                    active ? "bg-emerald-500/10 text-emerald-600 font-medium" : "hover:bg-emerald-500/5 hover:text-emerald-600/80"
                  )}
                >
                  <Link to={item.url} className="flex items-center gap-3">
                    <item.icon className={cn("h-5 w-5 shrink-0", active ? "text-emerald-600" : "text-muted-foreground")} />
                    {!isCollapsed && <span>{item.title}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>

        {modulosAtivos.length > 0 && (
          <SidebarGroup className="mt-4">
            {!isCollapsed && (
              <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-emerald-700/70">
                Módulos ativados
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {modulosAtivos.map((item) => {
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.url + item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={active}
                        tooltip={item.title}
                        className={cn(
                          "transition-all",
                          active
                            ? "bg-emerald-500/10 text-emerald-600 font-medium"
                            : "hover:bg-emerald-500/5 hover:text-emerald-600/80"
                        )}
                      >
                        <Link to={item.url} className="flex items-center gap-3">
                          <item.icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              active ? "text-emerald-600" : "text-muted-foreground"
                            )}
                          />
                          {!isCollapsed && <span className="truncate">{item.title}</span>}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-4 space-y-2">
        <Button variant="ghost" asChild className={cn("w-full justify-start gap-3 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10", isCollapsed && "justify-center px-0")}>
          <Link to="/">
            <Home className="h-5 w-5 shrink-0" />
            {!isCollapsed && <span>Vitrine</span>}
          </Link>
        </Button>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-muted-foreground hover:text-destructive hover:bg-destructive/10",
            isCollapsed && "justify-center px-0"
          )}
          onClick={() => signOut()}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!isCollapsed && <span>Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
