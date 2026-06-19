import { describe, it, expect } from "vitest";
import { formatPct, freedomColor, formatMonthsToDate } from "./formatters";

// Nota: formatUSD/formatARS usan Intl.NumberFormat (locale-dependiente del runtime),
// así que testeamos las funciones puras de lógica propia.

describe("formatPct", () => {
  it("convierte fracción a porcentaje con 2 decimales", () => {
    expect(formatPct(0.1234)).toBe("12.34%");
    expect(formatPct(1)).toBe("100.00%");
    expect(formatPct(0)).toBe("0.00%");
  });

  it("respeta decimales custom", () => {
    expect(formatPct(0.5, 0)).toBe("50%");
    expect(formatPct(0.12345, 3)).toBe("12.345%");
  });

  it("agrega + cuando signed y valor >= 0", () => {
    expect(formatPct(0.05, 2, true)).toBe("+5.00%");
    expect(formatPct(-0.05, 2, true)).toBe("-5.00%");
    expect(formatPct(0, 2, true)).toBe("+0.00%");
  });
});

describe("freedomColor", () => {
  it("mapea cada tramo de libertad a su color", () => {
    expect(freedomColor(0.1)).toBe("#EF4444"); // <25% rojo
    expect(freedomColor(0.3)).toBe("#F97316"); // <50% naranja
    expect(freedomColor(0.6)).toBe("#EAB308"); // <75% amarillo
    expect(freedomColor(0.9)).toBe("#22C55E"); // <100% verde
    expect(freedomColor(1.0)).toBe("#10B981"); // >=100% esmeralda
    expect(freedomColor(1.5)).toBe("#10B981");
  });

  it("bordes exactos caen en el tramo superior", () => {
    expect(freedomColor(0.25)).toBe("#F97316");
    expect(freedomColor(0.5)).toBe("#EAB308");
    expect(freedomColor(0.75)).toBe("#22C55E");
  });
});

describe("formatMonthsToDate", () => {
  it("0 meses → ya alcanzado", () => {
    expect(formatMonthsToDate(0)).toBe("Ya alcanzado");
  });

  it("menos de un año → meses", () => {
    expect(formatMonthsToDate(5)).toBe("5 meses");
    expect(formatMonthsToDate(11)).toBe("11 meses");
  });

  it("años exactos", () => {
    expect(formatMonthsToDate(24)).toBe("2 años");
  });

  it("años + meses", () => {
    expect(formatMonthsToDate(14)).toBe("1a 2m");
    expect(formatMonthsToDate(30)).toBe("2a 6m");
  });
});
