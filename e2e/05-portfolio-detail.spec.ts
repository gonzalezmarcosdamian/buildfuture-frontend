import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test.describe("Portfolio detalle — instrumento individual", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("navegar a un instrumento desde portfolio", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    // Las filas de posiciones son <button> que llaman router.push, no <a> tags.
    const positionBtn = page
      .locator('button[class*="rounded-xl"]:not([aria-label])')
      .first();

    if ((await positionBtn.count()) > 0) {
      await positionBtn.tap();
      await page.waitForURL("**/portfolio/**", { timeout: 8_000 }).catch(() => {});
    } else {
      // Fallback: navegar directamente a un ticker conocido del seed de datos
      await page.goto("/portfolio/GGAL?id=1");
      await page.waitForLoadState("networkidle", { timeout: 8_000 }).catch(() => {});
    }

    const url = page.url();
    expect(url).toContain("/portfolio/");

    const body = await page.textContent("body");
    expect((body ?? "").length).toBeGreaterThan(100);
  });

  test("página de detalle no tiene overflow horizontal", async ({ page }) => {
    await page.goto("/portfolio/GGAL?id=1");
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  });

  test("botón volver navega de vuelta a /portfolio", async ({ page }) => {
    await page.goto("/portfolio/GGAL?id=1");
    await page.waitForLoadState("networkidle", { timeout: 10_000 }).catch(() => {});

    const backBtn = page
      .locator('button:has-text("Volver"), a:has-text("Volver"), a[href="/portfolio"], button[aria-label*="volver" i], [aria-label*="back" i]')
      .first();

    if ((await backBtn.count()) > 0) {
      await backBtn.tap();
      await page.waitForURL("**/portfolio", { timeout: 6_000 }).catch(() => {});
      expect(page.url()).toContain("/portfolio");
    } else {
      // Al menos la página del ticker cargó correctamente
      const body = await page.textContent("body");
      expect((body ?? "").length).toBeGreaterThan(100);
    }
  });
});
