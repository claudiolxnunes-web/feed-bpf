import { test, expect, type Page } from "../playwright-fixture";

const PROJECT_REF = "ufqqskukhzgakmwrsumq";
const STORAGE_KEY = `sb-${PROJECT_REF}-auth-token`;

const products = [
  { path: "/feedbpf", product: "feedbpf", destino: "/feedbpf" },
  { path: "/audits-bpf", product: "audits-bpf", destino: "/audits-bpf" },
  { path: "/agrogestao", product: "agrogestao", destino: "/agrogestao" },
  { path: "/agro-rc", product: "agro-rc", destino: "/agro-rc" },
  { path: "/rotulos", product: "rotulos", destino: "/rotulos" },
  { path: "/nutricrm", product: "nutricrm", destino: "/nutricrm" },
];

function fakeJwt(expSecondsFromNow = 3600) {
  const header = { alg: "HS256", typ: "JWT" };
  const payload = {
    sub: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "e2e@test.local",
    exp: Math.floor(Date.now() / 1000) + expSecondsFromNow,
    iat: Math.floor(Date.now() / 1000),
  };
  const b64 = (o: object) =>
    Buffer.from(JSON.stringify(o))
      .toString("base64")
      .replace(/=+$/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  return `${b64(header)}.${b64(payload)}.signature`;
}

async function seedFakeSession(page: Page) {
  const accessToken = fakeJwt();
  const session = {
    access_token: accessToken,
    refresh_token: "fake-refresh",
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    expires_in: 3600,
    token_type: "bearer",
    user: {
      id: "00000000-0000-0000-0000-000000000001",
      aud: "authenticated",
      role: "authenticated",
      email: "e2e@test.local",
      app_metadata: {},
      user_metadata: {},
      created_at: new Date().toISOString(),
    },
  };
  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: STORAGE_KEY, value: JSON.stringify(session) },
  );
}

test.describe("Páginas de produto - usuário deslogado", () => {
  for (const { path, product, destino } of products) {
    test(`${path} envia para /auth com product=${product} e redirect=${destino}`, async ({ page }) => {
      await page.goto(path);
      const encoded = encodeURIComponent(destino);

      const signupHref = await page
        .getByRole("link", { name: /testar.*7 dias|trial|grátis/i })
        .first()
        .getAttribute("href");
      const loginHref = await page
        .getByRole("link", { name: /já.*cadastrad|acesse.*sistema|entrar|login/i })
        .first()
        .getAttribute("href");

      expect(signupHref).toContain("/auth");
      expect(signupHref).toContain(`product=${product}`);
      expect(signupHref).toContain("mode=signup");
      expect(signupHref).toContain(`redirect=${encoded}`);

      expect(loginHref).toContain("/auth");
      expect(loginHref).toContain(`product=${product}`);
      expect(loginHref).toContain("mode=login");
      expect(loginHref).toContain(`redirect=${encoded}`);
    });
  }
});

test.describe("Páginas de produto - usuário logado", () => {
  test.beforeEach(async ({ page }) => {
    await seedFakeSession(page);
  });

  for (const { path, destino } of products) {
    test(`${path} aponta CTAs direto para ${destino}`, async ({ page }) => {
      await page.goto(path);

      await expect
        .poll(
          async () =>
            await page
              .getByRole("link", { name: /testar.*7 dias|trial|grátis/i })
              .first()
              .getAttribute("href"),
          { timeout: 5000 },
        )
        .toBe(destino);

      const loginHref = await page
        .getByRole("link", { name: /já.*cadastrad|acesse.*sistema|entrar|login/i })
        .first()
        .getAttribute("href");
      expect(loginHref).toBe(destino);
    });
  }
});
