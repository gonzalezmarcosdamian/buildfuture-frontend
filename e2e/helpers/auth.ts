import { Page } from "@playwright/test";

/**
 * Login como usuario mock.
 * Limpia el localStorage primero para evitar que un test previo
 * deje al usuario incorrecto en estado.
 */
export async function loginAs(page: Page, alias = "marcos") {
  // Limpiar estado previo si la página ya cargó
  await page.goto("/mock-login");
  // Esperar que el JS cargue
  await page.waitForLoadState("domcontentloaded");
  // Limpiar localStorage y forzar el usuario correcto
  await page.evaluate((userAlias) => {
    localStorage.setItem("bf_mock_user", userAlias);
  }, alias);

  // Navegar al usuario usando el query param (dispara el useEffect correctamente)
  await page.goto(`/mock-login?user=${alias}`);
  await page.waitForURL("**/dashboard", { timeout: 10_000 });
}

export const MARCOS = "marcos";
export const NUEVO = "nuevo";
