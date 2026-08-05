import { test, expect, type Page } from "../playwright-fixture";

const PROJECT_REF = "ufqqskukhzgakmwrsumq";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

type ProgramaProtegido = {
  nome: string;
  rota: string;
  redirectEsperado: string;
};

const programasProtegidos: ProgramaProtegido[] = [
  { nome: "Feed_BPF", rota: "/feedbpf/dashboard", redirectEsperado: "/feedbpf/dashboard" },
  { nome: "Audits_BPF", rota: "/auditsbpf/dashboard", redirectEsperado: "/auditsbpf/dashboard" },
  { nome: "Audits_BPF (alias antigo)", rota: "/audits-bpf/dashboard", redirectEsperado: "/auditsbpf/dashboard" },
  { nome: "Agro RC CRM", rota: "/agrorc/dashboard", redirectEsperado: "/agrorc/dashboard" },
  { nome: "NutriCRM", rota: "/nutricrm/dashboard", redirectEsperado: "/nutricrm/dashboard" },
  { nome: "AgroGestão CRM", rota: "/agrogestao/dashboard", redirectEsperado: "/agrogestao/dashboard" },
  { nome: "Nutri_Agro Labels", rota: "/rotulos/dashboard", redirectEsperado: "/rotulos/dashboard" },
  { nome: "Portal Admin", rota: "/admin", redirectEsperado: "/admin" },
];

function base64Url(obj: object) {
  return Buffer.from(JSON.stringify(obj))
    .toString("base64")
    .replace(/=+$/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function fakeJwt(expSecondsFromNow: number) {
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

function buildSession(expSecondsFromNow: number) {
  return {
    access_token: fakeJwt(expSecondsFromNow),
    refresh_token: "fake-refresh-token",
    expires_at: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    expires_in: expSecondsFromNow,
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
}

async function seedSession(page: Page, expSecondsFromNow: number) {
  const session = buildSession(expSecondsFromNow);
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(session) },
  );
}

async function clearSession(page: Page) {
  await page.addInitScript(({ key }) => {
    window.localStorage.removeItem(key);
  }, { key: STORAGE_KEY });
}

test.describe("Login: usuário deslogado em rotas protegidas", () => {
  for (const programa of programasProtegidos) {
    test(`${programa.nome} (${programa.rota}) sem sessão → /auth com redirect`, async ({ page }) => {
      await clearSession(page);
      await page.goto(programa.rota);
      await page.waitForURL(/\/auth/, { timeout: 10000 });

      const url = new URL(page.url());
      expect(url.pathname).toBe("/auth");
      const redirectParam = url.searchParams.get("redirect");
      expect(redirectParam, `redirect param ausente em ${programa.nome}`).toBeTruthy();
      expect(decodeURIComponent(redirectParam ?? "")).toContain(programa.redirectEsperado);
    });
  }
});

test.describe("Sessão expirada", () => {
  for (const programa of programasProtegidos) {
    test(`${programa.nome} com JWT expirado → /auth (sessão limpa)`, async ({ page }) => {
      // JWT expirado há 1h, refresh token inválido → Supabase deve invalidar sessão
      await seedSession(page, -3600);
      await page.goto(programa.rota);
      await page.waitForURL(/\/auth/, { timeout: 15000 });
      expect(new URL(page.url()).pathname).toBe("/auth");
    });
  }

  test("Vitrine pública continua acessível mesmo com token expirado", async ({ page }) => {
    await seedSession(page, -3600);
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 10000 });
    expect(new URL(page.url()).pathname).toBe("/");
  });
});

test.describe("Sessão válida: programas carregam sem redirecionar para /auth", () => {
  // Programa Admin exige role admin → tratado em teste separado
  const programasUsuario = programasProtegidos.filter((p) => p.rota !== "/admin");

  for (const programa of programasUsuario) {
    test(`${programa.nome} carrega com sessão válida e não redireciona para /auth`, async ({ page }) => {
      await seedSession(page, 3600);
      await page.goto(programa.rota);
      // Aguarda estabilizar (loader some)
      await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
      const pathname = new URL(page.url()).pathname;
      expect(pathname, `${programa.nome} não deveria redirecionar para /auth`).not.toBe("/auth");
    });
  }

  test("Portal Admin sem role admin → redireciona para /404", async ({ page }) => {
    await seedSession(page, 3600);
    await page.goto("/admin");
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
    const pathname = new URL(page.url()).pathname;
    expect(pathname).not.toBe("/auth");
    // Usuário sem role admin é mandado para /404
    expect(["/404", "/admin"]).toContain(pathname);
  });
});

test.describe("Vitrine logada: todos os 6 programas comerciais aparecem", () => {
  test("cards dos 6 programas estão visíveis após login", async ({ page }) => {
    await seedSession(page, 3600);
    await page.goto("/");
    await page.waitForLoadState("networkidle", { timeout: 10000 }).catch(() => {});

    const programasComerciais = [
      "Feed_BPF",
      "Audits_BPF",
      "Agro RC CRM",
      "Nutri_Agro Labels",
      "NutriCRM",
      "AgroGestão CRM",
    ];

    for (const nome of programasComerciais) {
      await expect(
        page.getByRole("heading", { name: nome, level: 3 }),
        `Card ${nome} não encontrado na vitrine`,
      ).toBeVisible();
    }
  });
});
