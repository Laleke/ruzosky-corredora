import { describe, it, expect } from "vitest";
import { etiquetaPropiedad, etiquetaContrato } from "./propiedad";

describe("etiquetaPropiedad", () => {
  it("combina código, calle+número y unidad", () => {
    expect(
      etiquetaPropiedad({
        codigo_interno: "PRD0001",
        direccion: "Av. Siempre Viva",
        numero: "742",
        departamento: "12B",
      })
    ).toBe("PRD0001 · Av. Siempre Viva 742 · Depto/Unidad 12B");
  });

  it("omite las partes ausentes", () => {
    expect(
      etiquetaPropiedad({
        codigo_interno: "PRD0002",
        direccion: "Calle Uno",
        numero: null,
        departamento: null,
      })
    ).toBe("PRD0002 · Calle Uno");
  });

  it("devuelve — cuando no hay datos", () => {
    expect(etiquetaPropiedad(null)).toBe("—");
    expect(
      etiquetaPropiedad({ codigo_interno: null, direccion: null })
    ).toBe("—");
  });
});

describe("etiquetaContrato", () => {
  it("antepone el número al detalle de la propiedad", () => {
    expect(
      etiquetaContrato("N°123", {
        codigo_interno: "PRD0001",
        direccion: "Calle Uno",
        numero: "5",
        departamento: null,
      })
    ).toBe("N°123 · PRD0001 · Calle Uno 5");
  });

  it("usa 'Contrato' si no hay número", () => {
    expect(etiquetaContrato(null, { codigo_interno: "PRD0001" })).toBe(
      "Contrato · PRD0001"
    );
  });

  it("solo el número si la propiedad no tiene datos", () => {
    expect(etiquetaContrato("N°9", null)).toBe("N°9");
  });
});
