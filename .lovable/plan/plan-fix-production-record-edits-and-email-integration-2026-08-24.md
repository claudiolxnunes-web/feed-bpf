# Plan: Fix Production Record Edits and Email Integration

## Problem 1: Production Record Data Loss on Edit
When editing a production record in `src/pages/Producao.tsx`, several audit-critical fields (Flush, Sobras, Contraprova) are not restored in the form, leading to their silent erasure when saved.

### Proposed Fix
1.  **Update `abrirEdicao` in `Producao.tsx`**: Add restoration logic for all missing fields (`realizouFlush`, `tipoLimpeza`, `volumeFlush`, `produtoAnterior`, `prodAnteriorMedicado`, `obsFlush`, `houveSobra`, `qtdSobra`, `destinoSobra`, `obsSobra`).
2.  **Refactor Contraprova State**: Replace the direct DOM refs (`document.getElementById`) for `contraprova_retida`, `contraprova_local`, `contraprova_validade`, and `contraprova_quantidade` with proper React state variables to ensure they are correctly restored during editing.
3.  **Update `handleAdd`**: Update the payload to use the new state variables for Contraprova instead of reading from the DOM.
4.  **Enhance `limparFormulario`**: Ensure new state variables are cleared.
5.  **Refine immutability logic**: Ensure consistent enforcement of MAPA immutability rules (already present, but needs verification with new fields).

## Problem 2: Transactional Emails Rejected (403 recipient_mismatch)
Emails are failing with `403 recipient_mismatch` because the project is in Lovable "test mode," restricting recipients to the project owner.

### Proposed Resolution
*   **Information for the User**: This is a configuration issue on the Lovable platform. The project owner needs to:
    1.  Verify the sending domain (`notify.www.bpfconsult.com.br`) in the Lovable Email settings.
    2.  Switch the integration from "Test" to "Live" mode.
*   **Code Hardening (Safety Measure)**: In `supabase/functions/process-email-queue/index.ts`, when a 403 error occurs, we currently move the message to the Dead Letter Queue (DLQ). I will add a descriptive log message to help the owner identify the specific configuration issue when checking logs.

## Technical Details
- **File**: `src/pages/Producao.tsx`
    - Add states: `cpQtd`, `cpLocal`, `cpVal`.
    - Update `abrirEdicao` to map database columns to states.
    - Update `handleAdd` to use these states.
- **Database**: No schema changes required (columns already exist).
- **Compliance**: Ensures compliance with IN 15/2009 (Flush/Carryover) and IN 17/2017 (Contraprova) during data lifecycle.
