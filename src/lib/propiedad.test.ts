import { describe, it, expect } from "vitest";
import { etiquetaPropiedad, etiquetaContrato } from "./propiedad";

describe("etiquetaPropiedad", () => {
  it("combina calle+número y unidad, sin el código interno", () => {
    expect(
      etiquetaPropiedad({
        codigo_interno: "PRD0001",
        direccion: "Av. Siempre Viva",
        numero: "742",
        departamento: "12B",
      })
    ).toBe("Av. Siempre Viva 742 · Depto/Unidad 12B");
  });

  it("omite las partes ausentes", () => {
    expect(
      etiquetaPropiedad({
        codigo_interno: "PRD0002",
        direccion: "Calle Uno",
        numero: null,
        departamento: null,
      })
    ).toBe("Calle Uno");
  });

  it("usa el código interno como respaldo si no hay dirección cargada", () => {
    expect(
      etiquetaPropiedad({ codigo_interno: "PRD0003", direccion: null })
    ).toBe("PRD0003");
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
    ).toBe("N°123 · Calle Uno 5");
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
