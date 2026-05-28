import { test, expect } from "@playwright/test";

test.describe("Auth — login y protección de rutas", () => {
  test("login page se renderiza en mobile", async ({ page }) => {
    await page.goto("/login");
    // Título de la app visible
    await expect(page.locator("h1, h2").first()).toBeVisible();
    // Campo email
    await expect(page.locator('input[type="email"]')).toBeVisible();
    // Campo password
    await expect(page.locator('input[type="password"]')).toBeVisible();
    // Botón submit tapeable
    const submit = page.locator('button[type="submit"]');
    await expect(submit).toBeVisible();
    const box = await submit.boundingBox();
    // Altura mínima de touch target (44px recomendado por Apple/Google)
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test("mock-login?user=marcos redirige a dashboard", async ({ page }) => {
    await page.goto("/mock-login?user=marcos");
    await page.waitForURL("**/dashboard", { timeout: 10_000 });
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test("mock mode permite acceder a rutas protegidas sin JWT", async ({ page }) => {
    // En NEXT_PUBLIC_MOCK_AUTH=true, las rutas protegidas NO redirigen.
    // Esto es comportamiento correcto para testing — el middleware lo permite.
    await page.goto("/dashboard");
    // La página debe cargar (no 307 redirect)
    await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    // La URL debe ser dashboard (no login)
    expect(page.url()).toContain("/dashboard");
  });
});
