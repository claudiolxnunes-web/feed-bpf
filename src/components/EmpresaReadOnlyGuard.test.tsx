import { cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { createPortal } from "react-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ isVisualizador: true, loading: false, error: null }));
vi.mock("@/hooks/usePapelEmpresa", () => ({ usePapelEmpresa: () => state }));
import EmpresaReadOnlyGuard from "./EmpresaReadOnlyGuard";

describe("Proteção de ações do visualizador", () => {
  beforeEach(() => { state.isVisualizador = true; });
  afterEach(cleanup);
  function open(path: string, save = vi.fn()) {
    return render(<MemoryRouter initialEntries={[path]}><main id="main-content"><EmpresaReadOnlyGuard><form onSubmit={save} aria-label="Registro"><button type="submit">Salvar</button><button type="button">Exportar PDF</button></form>{createPortal(<div role="dialog"><button onClick={save}>Excluir</button></div>, document.body)}</EmpresaReadOnlyGuard></main></MemoryRouter>);
  }
  it("bloqueia gravação por envio de formulário e em diálogo", async () => {
    const save = vi.fn(); const view = open("/recebimento", save);
    await waitFor(() => expect(view.getByRole("button", { name: "Salvar" })).toBeDisabled());
    expect(view.getByRole("button", { name: "Excluir" })).toBeDisabled();
    fireEvent.submit(view.getByRole("form", { name: "Registro" }));
    expect(save).not.toHaveBeenCalled();
    expect(view.getByRole("button", { name: "Exportar PDF" })).toBeEnabled();
  });
  it("não altera ações dos papéis atuais", () => {
    state.isVisualizador = false; const save = vi.fn(); const view = open("/pcp", save);
    expect(view.getByRole("button", { name: "Salvar" })).toBeEnabled();
    fireEvent.submit(view.getByRole("form", { name: "Registro" }));
    expect(save).toHaveBeenCalledOnce();
  });
  it("não bloqueia relatórios", () => { const view = open("/relatorios"); expect(view.getByRole("button", { name: "Salvar" })).toBeEnabled(); });
});