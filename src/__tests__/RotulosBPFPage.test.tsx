
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import RotulosBPFPage from "../pages/RotulosBPFPage";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import { PADDLE_CHECKOUT_DISABLED_LABEL, PADDLE_CHECKOUT_WHATSAPP_URL } from "../config/paddleCheckout";

// Estado mutável do flag de checkout: cada teste escolhe ligado/desligado
// sem alterar src/config/paddleCheckout.ts.
const paddle = vi.hoisted(() => ({ enabled: false }));

vi.mock("../config/paddleCheckout", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../config/paddleCheckout")>();
  return {
    ...actual,
    get PADDLE_CHECKOUT_ENABLED() {
      return paddle.enabled;
    },
  };
});

// Mock das dependências
vi.mock("../hooks/useAuth", () => ({
  useAuth: vi.fn(),
}));

vi.mock("../integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock do window.scrollTo
window.scrollTo = vi.fn();

const renderWithRouter = (ui: React.ReactElement, { route = "/rotulos" } = {}) => {
  window.history.pushState({}, "Test page", route);
  return render(ui, { wrapper: BrowserRouter });
};

describe("RotulosBPFPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    paddle.enabled = false;
    (useAuth as any).mockReturnValue({ session: null });
  });

  it("deve renderizar a página inicial corretamente", () => {
    renderWithRouter(<RotulosBPFPage />);
    
    // Verificamos a existência de elementos chave na landing page
    expect(screen.getAllByText(/Nutri_Agro/i).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { level: 1, name: /Nutri_Agro Labels/i })).toBeInTheDocument();
    expect(screen.getByText(/Acessar Gerador Nutri_Agro Labels/i)).toBeInTheDocument();
  });

  it("deve exibir toast de sucesso quando o checkout for bem-sucedido", () => {
    renderWithRouter(<RotulosBPFPage />, { route: "/rotulos?checkout=success&tipo=grupo10&plano=mensal" });
    
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("Pagamento confirmado"), expect.any(Object));
    // Procurar especificamente no card de boas-vindas
    expect(screen.getByRole("heading", { name: /Bem-vindo ao Nutri_Agro Labels/i })).toBeInTheDocument();
    // No card de sucesso, o título do plano aparece em um <p> específico dentro do grid de informações
    const successContainer = screen.getByRole("heading", { name: /Bem-vindo ao Nutri_Agro Labels/i }).parentElement?.parentElement;
    expect(successContainer).toHaveTextContent(/Grupo 10 empresas/i);
    expect(successContainer).toHaveTextContent(/R\$ 297,00/i);
  });

  it("deve exibir card de erro quando o checkout for cancelado", () => {
    renderWithRouter(<RotulosBPFPage />, { route: "/rotulos?checkout=canceled" });
    
    expect(toast.error).toHaveBeenCalledWith("Checkout cancelado", expect.any(Object));
    expect(screen.getByRole("heading", { name: /Você cancelou o pagamento/i })).toBeInTheDocument();
  });

  it("com checkout desligado, mostra o rótulo de indisponível e abre o WhatsApp", () => {
    const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);

    renderWithRouter(<RotulosBPFPage />);

    expect(screen.queryAllByRole("button", { name: /Assinar/i })).toHaveLength(0);
    const buttons = screen.getAllByRole("button", { name: PADDLE_CHECKOUT_DISABLED_LABEL });
    fireEvent.click(buttons[0]);

    expect(openSpy).toHaveBeenCalledWith(PADDLE_CHECKOUT_WHATSAPP_URL, "_blank", "noopener,noreferrer");
    expect(supabase.functions.invoke).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });

  describe("com checkout ligado", () => {
    beforeEach(() => {
      paddle.enabled = true;
    });

    it("deve chamar a função de checkout ao clicar em um plano", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: { url: "https://checkout.example.test/session" },
        error: null,
      });

      // Como window.location.href não pode ser espiado diretamente no JSDOM de forma fácil,
      // apenas verificamos se a função foi chamada com os parâmetros corretos.

      renderWithRouter(<RotulosBPFPage />);

      // O primeiro botão de "Assinar" é do plano Individual Mensal
      const buttons = screen.getAllByRole("button", { name: /Assinar/i });
      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(supabase.functions.invoke).toHaveBeenCalledWith("create-checkout-nutriagrolabels", {
          body: { tipo: "individual", plano: "mensal" },
        });
      });
    });

    it("deve exibir erro se a função de checkout falhar", async () => {
      (supabase.functions.invoke as any).mockResolvedValue({
        data: null,
        error: { message: "Erro na API" },
      });

      renderWithRouter(<RotulosBPFPage />);

      const buttons = screen.getAllByRole("button", { name: /Assinar/i });
      fireEvent.click(buttons[0]);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith("Erro ao iniciar checkout", expect.objectContaining({
          description: "Erro na API"
        }));
      });
    });
  });

  it("deve limpar o status da URL ao clicar em 'Fechar'", async () => {
    renderWithRouter(<RotulosBPFPage />, { route: "/rotulos?checkout=success" });
    
    const closeButton = screen.getByText("Fechar");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(window.location.search).not.toContain("checkout=success");
    });
  });
});
