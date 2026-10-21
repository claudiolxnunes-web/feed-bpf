import { useEffect, useState, memo, Suspense, useCallback, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  LogOut,
  Menu,
  Target,
  X,
  Search,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import EmpresaSelector from "@/components/EmpresaSelector";
import LicenseGate from "@/components/LicenseGate";
import TierGate from "@/components/TierGate";
import OnboardingAutomatico from "@/components/OnboardingAutomatico";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutricrm from "@/assets/logo-nutricrm.png";
import logoAgrogestao from "@/assets/logo-agrogestao.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { NAV_ENTRIES } from "@/components/layout/nav-config";
import OfflineBanner from "@/components/OfflineBanner";
import PageLoader from "@/components/PageLoader";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import ClearCacheButton from "@/components/ClearCacheButton";
import Breadcrumbs from "@/components/Breadcrumbs";
import { canAccessLicenseAdmin } from "@/config/adminAccess";
import { usePapelEmpresa } from "@/hooks/usePapelEmpresa";
import EmpresaReadOnlyGuard from "@/components/EmpresaReadOnlyGuard";


const PRODUCT_CONFIGS: Record<string, { logo: string; title: string; subtitle: string }> = {
  feedbpf: {
    logo: logoFeedBpf,
    title: "Feed_BPF",
    subtitle: "BPF Consult",
  },
  nutricrm: {
    logo: logoNutricrm,
    title: "NutriCRM",
    subtitle: "CRM Especializado",
  },
  agrogestao: {
    logo: logoAgrogestao,
    title: "AgroGestão CRM",
    subtitle: "Gestão Regional",
  },
  agrorc: {
    logo: logoAgrorc,
    title: "Agro RC CRM",
    subtitle: "Representantes",
  },
  auditsbpf: {
    logo: logoAuditsBpf,
    title: "Audits_BPF",
    subtitle: "Auditoria Interna",
  },
  rotulos: {
    logo: logoRotulos,
    title: "Nutri_Agro Labels",
    subtitle: "Gerador de Rótulos",
  },
  admin: {
    logo: logoBpfConsult,
    title: "Portal de Gestão",
    subtitle: "CRM & Licenças",
  },
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const { product: urlProduct } = useParams();
  const product = urlProduct || "feedbpf";
  const config = PRODUCT_CONFIGS[product] || PRODUCT_CONFIGS.feedbpf;
  
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, roles, signOut } = useAuth();
  const { podeGerenciarEquipe } = usePapelEmpresa();
  const navEntries = useMemo(() => NAV_ENTRIES.filter((entry) => "items" in entry || entry.path !== "/equipe" || podeGerenciarEquipe), [podeGerenciarEquipe]);

  const activePageLabel = useMemo(() => {
    const findLabel = (entries: typeof NAV_ENTRIES): string | null => {
      for (const entry of entries) {
        if ("items" in entry) {
          const item = entry.items.find(i => i.path === location.pathname);
          if (item) return item.label;
        } else if (entry.path === location.pathname) {
          return entry.label;
        }
      }
      return null;
    };
    return findLabel(NAV_ENTRIES);
  }, [location.pathname]);
  
  

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = !!target && (["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) || target.isContentEditable);

      if (!isTyping && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (location.pathname !== "/busca-global") {
          navigate("/busca-global");
        }
      }
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [location.pathname, navigate]);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      // Limpeza profunda de estados locais
      sessionStorage.clear();
      // Removemos apenas chaves específicas para não deslogar de outros apps no mesmo domínio se houver
      localStorage.removeItem("feedbpf_empresa_ativa_id");
      localStorage.removeItem("post_login_redirect");
      navigate("/auth", { replace: true });
    } catch (err) {
      console.error("Erro ao sair:", err);
      navigate("/auth", { replace: true });
    }
  }, [signOut, navigate]);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background/50 selection:bg-primary/10 selection:text-primary">
      {/* Skip to Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg focus:shadow-lg transition-all"
      >
        Pular para o conteúdo principal
      </a>

      {/* Desktop sidebar */}
      <aside aria-label="Navegação Lateral" className="hidden lg:flex w-72 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border shadow-xl sticky top-0 h-screen overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border/50 bg-sidebar/50 backdrop-blur-sm shrink-0">
          <button 
            type="button"
            className="flex items-center gap-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg transition-transform active:scale-95"
            onClick={() => navigate("/")}
            aria-label={`Ir para o início de ${config.title}`}
          >
            <div className="relative group shrink-0">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary to-emerald-400 rounded-lg blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <img src={config.logo} alt="" className="relative w-10 h-10 rounded-lg object-contain bg-white p-1 shadow-sm" />
            </div>
            <div className="min-w-0">
              <h1 className="font-display text-lg font-bold text-sidebar-foreground tracking-tight truncate">{config.title}</h1>
              <p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/40 font-semibold truncate">{config.subtitle}</p>
            </div>
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-4 shrink-0">
            <button 
              onClick={() => navigate("/busca-global")}
              aria-label="Abrir busca global"
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent/50 border border-sidebar-border/50 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent transition-all text-xs"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="flex-1 text-left">Buscar ferramentas...</span>
              <kbd className="hidden xl:inline-flex h-5 select-none items-center gap-1 rounded border border-sidebar-border bg-sidebar px-1.5 font-mono text-[10px] font-medium text-sidebar-foreground/40">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>
          </div>

          <SidebarNav 
            currentPath={location.pathname} 
            entries={navEntries}
            userRoles={roles || []} 
            userEmail={user?.email || ""}
          />
        </div>

        <div className="mt-auto px-4 py-4 border-t border-sidebar-border/50 space-y-3 bg-sidebar/30 shrink-0">
          <EmpresaSelector />
          <div className="flex items-center justify-between px-2 gap-2">
            <p className="text-[11px] font-medium text-sidebar-foreground/50 truncate flex-1">{user?.email}</p>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/portal")}
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-primary hover:bg-primary/10 rounded-full shrink-0"
              title="Meu Portal"
            >
              <UserIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-destructive/10 rounded-full shrink-0"
              title="Sair da conta"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
          <ClearCacheButton />
        </div>
      </aside>

      {/* Mobile header */}
      <header aria-label="Cabeçalho Móvel" className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 py-2 bg-sidebar text-sidebar-foreground border-b border-sidebar-border/50 shadow-sm backdrop-blur-md h-[56px]">
        <button 
          type="button"
          onClick={() => navigate("/")}
          className="flex items-center gap-2 min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 rounded-md px-1"
          aria-label={`Ir para o início de ${config.title}`}
        >
          <img src={config.logo} alt="" className="w-8 h-8 rounded bg-white p-1 object-contain" />
          <div className="min-w-0">
            <span className="font-display font-bold block truncate tracking-tight text-sm">
              {activePageLabel || config.title}
            </span>
          </div>
        </button>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" onClick={() => navigate("/busca-global")} className="h-8 w-8 text-sidebar-foreground/70" aria-label="Abrir busca global">
            <Search className="w-4 h-4" aria-hidden="true" />
          </Button>
          
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-sidebar-foreground" aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}>
                <Menu className="w-5 h-5" aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] sm:w-80 p-0 bg-sidebar text-sidebar-foreground border-sidebar-border shadow-2xl">
              <SheetHeader className="sr-only">
                <SheetTitle>Menu de Navegação</SheetTitle>
              </SheetHeader>
              
              <div className="flex flex-col h-full pt-4">
                <div className="px-4 py-4 border-b border-sidebar-border/50">
                  <EmpresaSelector />
                </div>
                
                <div className="flex-1 overflow-hidden flex flex-col">
                  <SidebarNav 
                    currentPath={location.pathname} 
                    entries={navEntries}
                    onNavigate={closeMobile} 
                    userRoles={roles || []}
                    userEmail={user?.email || ""}
                  />
                </div>
                
                <div className="p-4 border-t border-sidebar-border/50 bg-sidebar-accent/20">
                  <div className="flex items-center justify-between mb-2 px-2">
                    <span className="text-xs text-sidebar-foreground/50 truncate">{user?.email}</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider">Premium</span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { closeMobile(); navigate("/portal"); }}
                    className="w-full justify-start text-sidebar-foreground/70 hover:text-primary hover:bg-primary/10 h-10 px-4 rounded-xl transition-all"
                  >
                    <UserIcon className="w-4 h-4 mr-3" />
                    Meu Portal
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="w-full justify-start text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 h-10 px-4 rounded-xl transition-all"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sair da conta
                  </Button>
                  <ClearCacheButton />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Main content */}
      <main id="main-content" className="flex-1 lg:ml-0 mt-[56px] lg:mt-0 overflow-x-hidden relative focus:outline-none min-h-screen flex flex-col" tabIndex={-1}>
        <OfflineBanner />
        <div className="flex-1 w-full max-w-[1920px] mx-auto p-3 sm:p-4 md:p-6 lg:p-8 xl:p-10 animate-fade-in relative z-10">
          <LicenseGate product={product as any}>
            <TierGate>
              <Breadcrumbs />
              <Suspense fallback={<PageLoader />}>
                <EmpresaReadOnlyGuard>{children}</EmpresaReadOnlyGuard>
              </Suspense>
            </TierGate>
          </LicenseGate>
        </div>

        <OnboardingAutomatico produto={product === "feedbpf" ? "feed_bpf" : product === "auditsbpf" ? "audits_bpf" : product} />

        
        {/* Floating elements backdrop decoration - Refined for better performance and responsiveness */}
        <div className="fixed top-0 right-0 -z-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-primary/5 rounded-full blur-[80px] md:blur-[120px] opacity-30 pointer-events-none translate-x-1/4 -translate-y-1/4 select-none" />
        <div className="fixed bottom-0 left-0 -z-0 w-[300px] h-[300px] md:w-[600px] md:h-[600px] bg-emerald-500/5 rounded-full blur-[80px] md:blur-[120px] opacity-30 pointer-events-none -translate-x-1/4 translate-y-1/4 select-none" />
      </main>

    </div>
  );
};

export default memo(AppLayout);