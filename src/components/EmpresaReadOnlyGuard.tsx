import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LockKeyhole } from "lucide-react";
import { usePapelEmpresa } from "@/hooks/usePapelEmpresa";
import { acaoConsulta, rotaOperacional } from "@/lib/empresa-permissions";
import PageLoader from "@/components/PageLoader";

/** Presentation protection includes Radix portals; RLS remains the authorization boundary. */
export default function EmpresaReadOnlyGuard({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { isVisualizador, loading, error } = usePapelEmpresa();
  const operacional = rotaOperacional(pathname);
  useEffect(() => {
    if (!isVisualizador || !operacional) return;
    const originals = new Map<HTMLElement, { disabled: boolean; aria: string | null }>();
    const inScope = (el: Element) => Boolean(el.closest('#main-content, [role="dialog"], [role="alertdialog"], [data-radix-popper-content-wrapper]'));
    const isWrite = (el: HTMLElement) => {
      if (!inScope(el) || el.closest('[data-readonly-allow], [role="tablist"]')) return false;
      if (el.matches('input[type="file"], input[type="submit"], input[type="image"]')) return true;
      if (el.matches('[role="switch"], [role="checkbox"], input[type="checkbox"]')) return true;
      if (el.getAttribute("role") === "combobox" || el.getAttribute("aria-haspopup") === "listbox") return false;
      if (el.getAttribute("aria-haspopup") === "menu") return false;
      if (!el.matches('button, [role="menuitem"], a[data-write-action]')) return false;
      if (el.getAttribute("role") === "tab" || el.getAttribute("data-state") === "closed" && el.getAttribute("aria-label") === "Close") return false;
      return !acaoConsulta(`${el.textContent ?? ""} ${el.getAttribute("aria-label") ?? ""} ${el.title}`, Array.from(el.querySelectorAll("svg")).map((svg) => svg.getAttribute("class") ?? "").join(" "));
    };
    const scan = () => {
      document.querySelectorAll<HTMLElement>('button, [role="menuitem"], [role="switch"], [role="checkbox"], input[type="checkbox"], input[type="file"], input[type="submit"], a[data-write-action]').forEach((el) => {
        if (!isWrite(el)) return;
        if (!originals.has(el)) originals.set(el, { disabled: "disabled" in el && Boolean(el.disabled), aria: el.getAttribute("aria-disabled") });
        if ((el instanceof HTMLButtonElement || el instanceof HTMLInputElement) && !el.disabled) el.disabled = true;
        if (el.getAttribute("aria-disabled") !== "true") el.setAttribute("aria-disabled", "true");
      });
    };
    const block = (event: Event) => {
      const target = event.target;
      const control = target instanceof Element ? target.closest<HTMLElement>('button, [role="menuitem"], [role="switch"], [role="checkbox"], input[type="checkbox"], input[type="file"], input[type="submit"], a[data-write-action]') : null;
      if (event.type === "submit" && target instanceof Element && inScope(target) || control && isWrite(control)) {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
      }
    };
    scan();
    const observer = new MutationObserver(scan);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["disabled"] });
    ["click", "submit", "change"].forEach((event) => document.addEventListener(event, block, true));
    return () => {
      observer.disconnect();
      ["click", "submit", "change"].forEach((event) => document.removeEventListener(event, block, true));
      originals.forEach((original, el) => {
        if (el instanceof HTMLButtonElement || el instanceof HTMLInputElement) el.disabled = original.disabled;
        if (original.aria === null) el.removeAttribute("aria-disabled"); else el.setAttribute("aria-disabled", original.aria);
      });
    };
  }, [isVisualizador, operacional, pathname]);
  if (operacional && loading) return <PageLoader />;
  if (operacional && error) return <p role="alert" className="text-destructive">Não foi possível verificar seu acesso. Recarregue a página.</p>;
  return <>
    {isVisualizador && <div role="status" className="mb-4 flex items-center gap-2 border-b border-border pb-3 text-sm text-muted-foreground"><LockKeyhole className="h-4 w-4" aria-hidden="true" />Acesso somente leitura</div>}
    {children}
  </>;
}