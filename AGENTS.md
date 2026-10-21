# Project Rules

- Team management uses authenticated company RPCs; role presentation comes from usePapelEmpresa, scoped by active company and user, never global admin emails. This preserves company boundaries.
- Operational viewer actions are guarded centrally including portal dialogs and uploads; tablet persistence must also gate automatic offline synchronization. Database RLS remains authoritative, while reports, manuals, legislation and exports stay available.

- Remote MCP tools are read-only, verify delegated OAuth tokens and use a caller-scoped client; company record queries require explicit company authorization and an active product license to preserve app boundaries.
- OAuth consent uses the existing auth screen with canonical local return paths across all offered login and signup methods; browser tools stay in the screens owning their visible controls, separate from the remote MCP catalog.

- Fixed POP module checklists, catalogs and lookup lists live in `src/components/<module>/constants.ts`, and screens import them instead of keeping local copies — one source prevents drift; preserve separate module-specific variants when content differs.
- Every new legal citation must come from `src/config/baseLegal.ts` through its typed registry and citation helpers; preserve synchronous subject resolution for exports and the existing hook's company/global document lookup so citations remain centralized and network-independent.
- Screens show supported legal citations through BaseLegalBadge; explicitly requested PAC explanatory text shares centralized guidance with the generated manual. Display-only changes must never change stored values or operational logic.
- Medicated production orders are gated both in the PCP screen and by a database trigger on ordens_producao; keep both in sync so the rule holds even outside the UI.
