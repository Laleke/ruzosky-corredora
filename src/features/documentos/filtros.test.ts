import { describe, it, expect } from "vitest";
import { fechaEfectivaDocumento, dentroDeRango } from "./filtros";

describe("fechaEfectivaDocumento", () => {
  it("usa fecha_documento cuando existe", () => {
    expect(
      fechaEfectivaDocumento({
        fecha_documento: "2026-03-10",
        created_at: "2026-07-01T12:00:00Z",
      })
    ).toBe("2026-03-10");
  });

  it("cae a la fecha de subida (created_at) cuando fecha_documento es null", () => {
    expect(
      fechaEfectivaDocumento({
        fecha_documento: null,
        created_at: "2026-07-01T12:00:00Z",
      })
    ).toBe("2026-07-01");
  });
});

describe("dentroDeRango", () => {
  it("sin límites, siempre true", () => {
    expect(dentroDeRango("2026-07-01")).toBe(true);
  });
  it("respeta el límite inferior (inclusivo)", () => {
    expect(dentroDeRango("2026-07-01", "2026-07-01")).toBe(true);
    expect(dentroDeRango("2026-06-30", "2026-07-01")).toBe(false);
  });
  it("respeta el límite superior (inclusivo)", () => {
    expect(dentroDeRango("2026-07-31", undefined, "2026-07-31")).toBe(true);
    expect(dentroDeRango("2026-08-01", undefined, "2026-07-31")).toBe(false);
  });
  it("respeta un rango completo", () => {
    expect(dentroDeRango("2026-07-15", "2026-07-01", "2026-07-31")).toBe(true);
    expect(dentroDeRango("2026-09-01", "2026-07-01", "2026-07-31")).toBe(false);
  });
});
