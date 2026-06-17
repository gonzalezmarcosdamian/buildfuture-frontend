import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Rutas públicas: landing (/), legal (/legal), auth (/login, /auth/)
const PUBLIC_PATHS = ["/login", "/auth/", "/legal"];
const PUBLIC_EXACT = ["/"];

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.includes(pathname)) return true;
  return PUBLIC_PATHS.some((p) => pathname.startsWith(p));
}

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // En mock mode (desarrollo/testing) saltear la verificación de Supabase.
  // La autenticación la maneja el frontend via X-Mock-User header.
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === "true") {
    return response;
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

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirige preservando los cookies que getUser() pudo haber refrescado.
  // Si no se copian a la respuesta de redirect, un token recién rotado se
  // pierde y la sesión muere en el próximo request → el usuario aparece
  // deslogueado (ej: al pasar de /login a /dashboard tras loguearse).
  const redirectTo = (path: string) => {
    const redirect = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  // No logueado en ruta protegida → login
  if (!user && !isPublic(pathname)) {
    return redirectTo("/login");
  }

  // Logueado en /login → dashboard
  if (user && pathname.startsWith("/login")) {
    return redirectTo("/dashboard");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
