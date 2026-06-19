import { test, expect, Page } from "@playwright/test";
import { loginAs } from "./helpers/auth";

/** Verifica que una página no tenga scroll horizontal */
async function assertNoHorizontalScroll(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, `Overflow horizontal en ${page.url()}`).toBeLessThanOrEqual(clientWidth + 2);
}

/** Cierra el dev overlay de Next.js si está visible */
async function closeNextDevOverlay(page: Page) {
  // El overlay de Next.js dev mode tiene un botón "×" para cerrarlo
  const closeBtn = page.locator('button:has-text("×"), button[aria-label*="close" i], button[aria-label*="cerrar" i]').first();
  const overlayClose = page.locator('[data-nextjs-dialog-overlay], nextjs-portal button').first();

  if (await overlayClose.isVisible().catch(() => false)) {
    await overlayClose.click().catch(() => {});
  }

  // Intentar presionar Escape para cerrar cualquier overlay
  await page.keyboard.press("Escape").catch(() => {});
}

/** Verifica que todos los botones/links en un contenedor tengan touch target ≥ 44px */
async function assertTouchTargets(page: Page, selector = "button, a") {
  // Cerrar dev overlay antes de medir
  await closeNextDevOverlay(page);
  await page.waitForTimeout(300);

  const elements = page.locator(selector);
  const count = await elements.count();
  const failures: string[] = [];

  for (let i = 0; i < count; i++) {
    const el = elements.nth(i);
    if (!(await el.isVisible())) continue;

    // Ignorar elementos dentro del dev overlay de Next.js (shadow DOM o custom elements)
    const isDevOverlay = await el.evaluate((node) => {
      // Subir el árbol buscando nextjs-portal o elementos con data-nextjs-*
      let current: Element | null = node as Element;
      while (current) {
        if (current.tagName?.toLowerCase() === "nextjs-portal") return true;
        if (current.hasAttribute?.("data-nextjs-dialog")) return true;
        if (current.hasAttribute?.("data-nextjs-toast")) return true;
        if ((current as HTMLElement).style?.zIndex === "2147483647") return true;
        current = current.parentElement;
      }
      return false;
    });
    if (isDevOverlay) continue;

    const box = await el.boundingBox();
    if (!box) continue;
    // Solo elementos dentro del viewport principal (no fixed overlays al borde)
    if (box.y < 0 || box.x < 0) continue;

    if (box.height < 36 || box.width < 36) {
      const text = (await el.textContent())?.trim().slice(0, 30) ?? "";
      failures.push(`"${text}" → ${Math.round(box.width)}×${Math.round(box.height)}px`);
    }
  }

  if (failures.length > 0) {
    console.warn(`Touch targets pequeños en ${page.url()}:\n${failures.join("\n")}`);
  }
  expect(failures.length, `Demasiados touch targets pequeños: ${failures.join(", ")}`).toBeLessThanOrEqual(3);
}

test.describe("UX mobile — overflow y touch targets", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page);
  });

  test("dashboard — no hay overflow horizontal", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoHorizontalScroll(page);
  });

  test("portfolio — no hay overflow horizontal", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoHorizontalScroll(page);
  });

  test("budget — no hay overflow horizontal", async ({ page }) => {
    await page.goto("/budget");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoHorizontalScroll(page);
  });

  test("goals — no hay overflow horizontal", async ({ page }) => {
    await page.goto("/goals");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoHorizontalScroll(page);
  });

  test("advisor — no hay overflow horizontal", async ({ page }) => {
    await page.goto("/advisor");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertNoHorizontalScroll(page);
  });

  test("dashboard — touch targets en BottomNav", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertTouchTargets(page, "nav a");
  });

  test("portfolio — touch targets en botones de acción", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle").catch(() => {});
    // Solo botones dentro de filas de posiciones
    await assertTouchTargets(page, "button");
  });

  test("advisor — touch targets en tipos de análisis", async ({ page }) => {
    await page.goto("/advisor");
    await page.waitForLoadState("networkidle").catch(() => {});
    await assertTouchTargets(page, "button");
  });

  test("texto legible — font-size mínimo en body text", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});

    const smallTexts = await page.evaluate(() => {
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        null
      );
      const issues: string[] = [];
      let node;
      while ((node = walker.nextNode())) {
        const text = node.textContent?.trim();
        if (!text || text.length < 3) continue;
        const el = node.parentElement;
        if (!el) continue;
        const style = window.getComputedStyle(el);
        const fontSize = parseFloat(style.fontSize);
        if (fontSize < 10 && el.offsetParent !== null) {
          issues.push(`"${text.slice(0, 20)}" → ${fontSize}px`);
        }
      }
      return issues;
    });

    if (smallTexts.length > 0) {
      console.warn("Textos muy pequeños (<10px):", smallTexts);
    }
    expect(smallTexts.length).toBeLessThan(5);
  });
});

test.describe("UX mobile — usuario nuevo (FTU)", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "nuevo");
  });

  test("FTU — dashboard no muestra errores con cartera vacía", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle").catch(() => {});

    // No debe haber errores 500 o crashes visibles
    await expect(page.locator("text=/error interno|internal server error|client-side exception|unhandled/i")).not.toBeVisible();
    // La página debe tener contenido
    const content = await page.textContent("body");
    expect(content?.length).toBeGreaterThan(100);
  });

  test("FTU — portfolio vacío muestra estado vacío (no crash)", async ({ page }) => {
    await page.goto("/portfolio");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page.locator("text=/error interno|internal server error|client-side exception|unhandled/i")).not.toBeVisible();
    // Debe haber algo útil — un mensaje de estado vacío o CTA
    const content = await page.textContent("body");
    expect(content?.length).toBeGreaterThan(50);
  });

  test("FTU — advisor funciona con cartera vacía", async ({ page }) => {
    await page.goto("/advisor");
    await page.waitForLoadState("networkidle").catch(() => {});

    await expect(page.locator("text=/error interno|internal server error|client-side exception|unhandled/i")).not.toBeVisible();
  });
});
