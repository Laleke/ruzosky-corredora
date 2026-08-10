import { describe, expect, it } from "vitest";
import { numeroContratoMostrar, terminoMostrar } from "./vigencia";

const HOY = "2026-08-07";

describe("terminoMostrar", () => {
  it("sin fecha de término es indefinido", () => {
    expect(terminoMostrar(null, "vigente", HOY)).toBe("Indefinido");
  });

  it("con fecha futura muestra la fecha", () => {
    expect(terminoMostrar("2027-01-31", "vigente", HOY)).toBe("31/01/2027");
  });

  it("fecha pasada pero contrato vigente se muestra como renovado", () => {
    expect(terminoMostrar("2026-06-30", "vigente", HOY)).toBe(
      "Indefinido (renovado desde 30/06/2026)"
    );
    expect(terminoMostrar("2026-06-30", "renovado", HOY)).toBe(
      "Indefinido (renovado desde 30/06/2026)"
    );
  });

  it("fecha pasada y contrato terminado muestra la fecha real", () => {
    expect(terminoMostrar("2026-06-30", "terminado", HOY)).toBe("30/06/2026");
  });

  it("el mismo día del término todavía no cuenta como vencido", () => {
    expect(terminoMostrar(HOY, "vigente", HOY)).toBe("07/08/2026");
  });
});

describe("numeroContratoMostrar", () => {
  it("usa el número cuando existe", () => {
    expect(numeroContratoMostrar("C-2026-001", "b69e1db1-cd86")).toBe("C-2026-001");
  });

  it("cae a un identificador corto derivado del id", () => {
    expect(numeroContratoMostrar(null, "b69e1db1-cd86-477a-a977-c095089aa6b0")).toBe("N° B69E1DB1");
  });

  it("trata un número en blanco como ausente", () => {
    expect(numeroContratoMostrar("   ", "b69e1db1-cd86-477a")).toBe("N° B69E1DB1");
  });
});
