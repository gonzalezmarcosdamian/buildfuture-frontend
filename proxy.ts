import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas públicas: landing (/), legal (/legal), auth (/login, /auth/)
const PUBLIC_PATHS = ["/login", "/auth/", "/legal"];
const PUBLIC_EXACT = ["/"];

// Marketing puro: ni gating ni redirect → no hace falta consultar a Supabase.
// Saltear getUser() acá evita un round-trip en las páginas más visitadas.
const NO_AUTH_PATHS = ["/legal"];
const NO_AUTH_EXACT = ["/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

function needsAuthCheck(pathname: string): boolean {
  if (NO_AUTH_EXACT.includes(pathname)) return false;
  return !NO_AUTH_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  const t0 = performance.now();
  const { pathname } = request.nextUrl;
  let response = NextResponse.next({ request });

  // Visibilidad: Server-Timing (DevTools → Network) + log (Vercel runtime logs).
  const observe = (res: NextResponse, action: string, authMs: number) => {
    const totalMs = Math.round(performance.now() - t0);
    res.headers.set("Server-Timing", `auth;dur=${authMs}, proxy;dur=${totalMs}`);
    console.warn(`[proxy] ${pathname} ${action} auth=${authMs}ms total=${totalMs}ms`);
    return res;
  };

  // En mock mode (desarrollo/testing) saltear la verificación de Supabase.
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
    return observe(response, "mock", 0);
  }

  // Marketing público (landing, legal): servir directo, sin tocar Supabase.
  if (!needsAuthCheck(pathname)) {
    return observe(response, "public-skip", 0);
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const tAuth = performance.now();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authMs = Math.round(performance.now() - tAuth);

  // Redirige preservando los cookies que getUser() pudo haber refrescado.
  // Si no se copian a la respuesta de redirect, un token recién rotado se
  // pierde y la sesión muere en el próximo request → el usuario aparece
  // deslogueado (ej: al pasar de /login a /dashboard tras loguearse).
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return observe(redirect, `→${path}`, authMs);
  };

  // No logueado en ruta protegida → login
  if (!user && !isPublic(pathname)) {
    return redirectTo("/login");
  }

  // Logueado en /login → dashboard
  if (user && pathname.startsWith("/login")) {
    return redirectTo("/dashboard");
  }

  return observe(response, user ? "pass-auth" : "pass-anon", authMs);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
