# Landing Page — Plan de Implementación
## BuildFuture — Documento de aprobación v3

---

## Visión del producto

BuildFuture es una **plataforma de open finance personal**. No un tracker, no una app de rendimientos.
Conecta todos los activos del usuario (broker, cripto, cash), unifica el panorama, lo educa en el camino
y lo guía hacia la libertad financiera con números reales.

**Diferenciador central:** ninguna app argentina hoy conecta IOL + Cocos + PPI + Binance
y muestra cuándo el usuario deja de necesitar su sueldo.

---

## Comité de revisión — veredictos

| Agente | Veredicto | Item crítico |
|--------|-----------|-------------|
| Brand Strategist | ✅ Aprobado | Logo "Build**Future**" con Future en emerald |
| Legal Argentina | ⚠️ Condicional | 4 items bloqueantes para go-live |
| UX Architect | ✅ Aprobado | Nav sticky con login + CTA siempre visible |
| Product Copywriter | ✅ Aprobado | +FAQ y +Social proof |
| Dev | ✅ Aprobado | Route group refactor sin breaking changes |

### Items bloqueantes Legal (requeridos antes de producción)
1. Disclaimer financiero en footer de TODAS las páginas (CNV)
2. "Sugerencias" en lugar de "recomendaciones" (Ley 26.831)
3. Checkbox explícito de aceptación de términos en waitlist
4. Política de cookies + banner de consentimiento (Vercel Analytics)

---

## Arquitectura técnica

### Route groups (Next.js App Router)

```
app/
  layout.tsx              ← ROOT: minimal RSC — html/body/font/globals solamente
  globals.css

  (landing)/              ← grupo sin BottomNav, sin AuthProvider, dark forzado
    layout.tsx            ← LandingNav + LandingFooter + dark wrapper
    page.tsx              ← "/" — landing principal (SSG)
    legal/
      page.tsx            ← "/legal" — términos + privacidad + disclaimers

  (app)/                  ← grupo con ThemeProvider + AuthProvider + BottomNav
    layout.tsx            ← layout actual completo
    dashboard/
    portfolio/
    goals/
    budget/
    settings/

  auth/                   ← fuera de ambos grupos (callback Supabase)
  login/                  ← fuera de ambos grupos
  mock-login/             ← fuera de ambos grupos
```

### Flujo de navegación

```
Nuevo visitante:
  "/" landing → "Crear cuenta" → "/login" (toggle a registro) → auth confirm → "/dashboard"

Usuario existente:
  "/" landing → "Iniciar sesión" → "/login" → "/dashboard"

Usuario autenticado llega a "/":
  (app)/layout detecta sesión → redirect "/dashboard"
  La landing nunca renderiza para usuarios autenticados.
```

### Datos
- Landing 100% estática (SSG) — sin fetch de API, sin cookies, sin auth
- Formulario waitlist: `POST /waitlist` al backend (único lado dinámico)
- Vercel Analytics para conversión

---

## Secciones de la landing

| # | Sección | Objetivo | Fase |
|---|---------|----------|------|
| Nav | LandingNav sticky | Login + CTA siempre visible | 1 |
| 1 | Hero | Gancho 3 segundos, CTA principal | 1 |
| 2 | Integraciones | "¿funciona con mi broker?" | 1 |
| 3 | El problema | El usuario se ve reflejado | 1 |
| 4 | La solución (3 pilares) | Valor concreto con mockups | 2 |
| 5 | Cómo funciona (3 pasos) | Bajar fricción del onboarding | 2 |
| 6 | Visión open finance | Roadmap hacia Latam | 2 |
| 7 | Social proof + Founder | Humanizar, generar confianza | 2 |
| 8 | FAQ | Responder objeciones antes de que surjan | 3 |
| 9 | Waitlist | Capturar intención sin registro | 3 |
| 10 | CTA final | Segunda oportunidad de conversión | 3 |
| Footer | LandingFooter | Legal, disclaimer CNV, links | 1 |
| /legal | Página legal completa | CNV, Ley 25.326, Ley 26.831 | 3 |

---

## Brand — decisiones de tono

| Variable | Decisión |
|----------|----------|
| Nombre | BuildFuture — "Build" slate-100, "Future" emerald-400 |
| Tagline | *"Tu libertad financiera, en números."* |
| Voz | Segunda persona singular "vos" — consistente, sin mezcla con "usted" |
| Tono | Producto serio + fundador humano. Ni banco ni crypto influencer |
| Palabras clave | libertad financiera, en números, cuándo sos libre, open finance |
| Evitar | "revolucionamos", "maximizá", "potenciá", "disruptivo" |
| "recomendaciones" → | "sugerencias de inversión" (validado Legal) |
| Paleta | slate-950 fondo / emerald-400 renta / violet-400 capital |

---

## Fases de implementación

### Fase 1 — Estructura y hero (esta sesión) ✅
- [x] LANDING_PLAN.md documentado
- [ ] Route group refactor: (landing) + (app)
- [ ] LandingNav sticky con logo + login + CTA
- [ ] LandingFooter con disclaimer mínimo
- [ ] Sección 1: Hero completo
- [ ] Sección 2: Integraciones
- [ ] Sección 3: El problema

### Fase 2 — Features y producto
- [ ] Sección 4: Solución (3 pilares con mockups)
- [ ] Sección 5: Cómo funciona
- [ ] Sección 6: Visión open finance
- [ ] Sección 7: Social proof + Founder

### Fase 3 — Conversión y legal
- [ ] Sección 8: FAQ accordion
- [ ] Sección 9: Waitlist + endpoint backend POST /waitlist
- [ ] Sección 10: CTA final
- [ ] /legal completa (CNV + Ley 25.326 + cookies)

### Fase 4 — Polish y SEO
- [ ] OG image 1200×630
- [ ] Metadata: title, description, canonical, structured data
- [ ] Animaciones scroll (Intersection Observer)
- [ ] Cookie consent banner
- [ ] Performance audit

---

## Métricas de éxito (30 días post-lanzamiento)

| Métrica | Objetivo |
|---------|----------|
| Conversión visitante → registro | ≥ 8% |
| Conversión visitante → waitlist | ≥ 15% |
| Bounce rate sección hero | ≤ 60% |
| Tiempo en página | ≥ 90 segundos |
