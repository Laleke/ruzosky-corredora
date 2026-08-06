import { describe, expect, it } from "vitest";
import { diasMora } from "./mora";

describe("diasMora", () => {
  it("cuenta los días transcurridos desde el vencimiento", () => {
    expect(diasMora("2026-07-05", "2026-08-03")).toBe(29);
    expect(diasMora("2026-08-02", "2026-08-03")).toBe(1);
  });

  it("devuelve 0 el mismo día del vencimiento (aún no está atrasado)", () => {
    expect(diasMora("2026-08-03", "2026-08-03")).toBe(0);
  });

  it("devuelve 0 para cargos que todavía no vencen", () => {
    expect(diasMora("2026-09-05", "2026-08-03")).toBe(0);
  });

  it("devuelve 0 si el cargo no tiene fecha de vencimiento", () => {
    expect(diasMora(null, "2026-08-03")).toBe(0);
  });

  it("cruza cambios de mes y de año sin desfase", () => {
    expect(diasMora("2025-12-31", "2026-01-01")).toBe(1);
    expect(diasMora("2026-02-28", "2026-03-01")).toBe(1); // 2026 no es bisiesto
  });

  it("no se desfasa con timestamps completos en la fecha de vencimiento", () => {
    expect(diasMora("2026-07-05T00:00:00+00:00", "2026-08-03")).toBe(29);
  });

  it("nunca devuelve negativos", () => {
    expect(diasMora("2030-01-01", "2026-08-03")).toBeGreaterThanOrEqual(0);
  });
});
