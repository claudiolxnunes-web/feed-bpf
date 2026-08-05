import { test, expect, type Page } from "../playwright-fixture";

const PROJECT_REF = "ufqqskukhzgakmwrsumq";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

function base64Url(obj: object) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fakeJwt(expSecondsFromNow = 3600) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@test.local",
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    iat: Math.floor(Date.now() / 1000) - 60,
  };
  return `${base64Url(header)}.${base64Url(payload)}.signature`;
}

async function seedSession(page: Page) {
  const session = {
    access_token: fakeJwt(3600),
    refresh_token: "fake-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: "e2e@test.local",
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
  await page.addInitScript(
    ({ key, value }) => window.localStorage.setItem(key, value),
    { key: STORAGE_KEY, value: JSON.stringify(session) },
  );
}

interface ProgramaSidebar {
  nome: string;
  dashboard: string;
  // labels que devem aparecer no menu
  itensMenu: string[];
  // rotas que devem carregar sem cair em /auth ou /404
  rotas: string[];
}

const programas: ProgramaSidebar[] = [
  {
    nome: "Audits_BPF",
    dashboard: "/auditsbpf/dashboard",
    itensMenu: [
      "Painel Auditor",
      "Checklists Ativos",
      "Sala do Auditor",
      "Planos de Ação",
      "Histórico Audits",
      "Relatórios IA",
    ],
    rotas: [
      "/auditsbpf/dashboard",
      "/auditsbpf/checklist",
      "/auditsbpf/sala",
      "/auditsbpf/plano",
      "/auditsbpf/historico",
      "/auditsbpf/relatorio",
    ],
  },
  {
    nome: "Agro RC CRM",
    dashboard: "/agrorc/dashboard",
    itensMenu: [
      "Painel do RC",
      "Pipeline Kanban",
      "Clientes",
      "Visitas",
      "Metas",
      "Painel Regional",
    ],
    rotas: [
      "/agrorc/dashboard",
      "/agrorc/pipeline",
      "/agrorc/clientes",
      "/agrorc/visitas",
      "/agrorc/metas",
      "/agrorc/admin",
    ],
  },
  {
    nome: "NutriCRM",
    dashboard: "/nutricrm/dashboard",
    itensMenu: [
      "Painel de Vendas",
      "Clientes (Agro)",
      "Agenda de Visitas",
      "Projetos Técnicos",
      "Metas & Ranking",
      "Relatórios IA",
    ],
    rotas: [
      "/nutricrm/dashboard",
      "/nutricrm/clientes",
      "/nutricrm/visitas",
      "/nutricrm/projetos",
      "/nutricrm/metas",
      "/nutricrm/relatorios",
    ],
  },
  {
    nome: "AgroGestão CRM",
    dashboard: "/agrogestao/dashboard",
    itensMenu: [
      "Dashboard Regional",
      "Clientes da Região",
      "Gestão de Regiões",
      "Visitas da Equipe",
      "Metas Regionais",
      "Análise de Dados",
    ],
    rotas: [
      "/agrogestao/dashboard",
      "/agrogestao/clientes",
      "/agrogestao/regioes",
      "/agrogestao/visitas",
      "/agrogestao/metas",
      "/agrogestao/relatorios",
    ],
  },
  {
    nome: "Nutri_Agro Labels",
    dashboard: "/rotulos/dashboard",
    itensMenu: [
      "Dashboard Rótulos",
      "Editor de Rótulos",
      "Ficha Técnica (RTPI)",
      "Níveis de Garantia",
      "Templates",
      "Configurações Zebra",
    ],
    rotas: [
      "/rotulos/dashboard",
      "/rotulos/editor",
      "/rotulos/rtpi",
      "/rotulos/niveis",
      "/rotulos/templates",
      "/rotulos/zebra",
    ],
  },
  {
    nome: "Feed_BPF",
    dashboard: "/dashboard",
    // amostra representativa do nav-config (grupos diferentes, todos os 10 POPs cobertos por rotas)
    itensMenu: [
      "Dashboard",
      "Cadastro",
      "Documentos / POPs",
      "Recebimento MP",
      "Higiene / Sanitização",
      "Saúde / ASO",
      "Produção",
      "Manutenção Preventiva",
      "Sala do Auditor",
      "Indicadores",
    ],
    rotas: [
      "/dashboard",
      "/cadastro",
      "/documentos",
      "/manual",
      "/recebimento",
      "/fornecedores",
      "/analises",
      "/higiene",
      "/saude-pessoal",
      "/visitantes",
      "/potabilidade-agua",
      "/producao",
      "/pcp",
      "/produtos",
      "/formulas",
      "/armazenamento-transporte",
      "/manutencao",
      "/pragas",
      "/residuos",
      "/rastreabilidade",
      "/expedicao",
      "/auditoria",
      "/nao-conformidades",
      "/matriz-risco",
      "/qualidade-total",
      "/sala-auditor",
      "/indicadores",
      "/relatorios",
      "/planejamento-anual",
      "/legislacao",
      "/modelos",
      "/modo-tablet",
      "/treinamentos",
    ],
  },
];

test.describe("Menu / Sidebar pós-login", () => {
  test.beforeEach(async ({ page }) => {
    await seedSession(page);
  });

  for (const programa of programas) {
    test(`${programa.nome}: sidebar exibe todos os itens do menu`, async ({ page }) => {
      await page.goto(programa.dashboard);
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});

      // Não deve ter sido redirecionado para /auth
      expect(new URL(page.url()).pathname).not.toBe("/auth");

      // Cada item do menu deve estar visível em algum lugar (sidebar é o primeiro)
      for (const item of programa.itensMenu) {
        const locator = page.getByText(item, { exact: false }).first();
        await expect(locator, `Item de menu "${item}" não encontrado em ${programa.nome}`).toBeVisible({ timeout: 8000 });
      }
    });

    test(`${programa.nome}: todas as rotas internas carregam sem 404 ou /auth`, async ({ page }) => {
      const falhas: string[] = [];

      for (const rota of programa.rotas) {
        await page.goto(rota);
        await page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
        // pequeno settle para redirects do router
        await page.waitForTimeout(400);

        const pathname = new URL(page.url()).pathname;
        if (pathname === "/auth") {
          falhas.push(`${rota} → redirecionou para /auth`);
          continue;
        }
        if (pathname === "/404") {
          falhas.push(`${rota} → redirecionou para /404`);
          continue;
        }

        // Heurística adicional: detectar página NotFound renderizada
        const notFoundVisible = await page
          .getByText(/404|página não encontrada|page not found/i)
          .first()
          .isVisible()
          .catch(() => false);
        if (notFoundVisible) {
          falhas.push(`${rota} → renderizou tela de NotFound`);
        }
      }

      expect(falhas, `Falhas em ${programa.nome}:\n${falhas.join("\n")}`).toHaveLength(0);
    });
  }
});
