import { describe, expect, it } from "vitest";
import {
  resolverMontoObligacion,
  sumarMeses,
  generarCuotas,
  validarReparto,
  estadoComprometido,
  type FilaObligacion,
} from "./reparto";

describe("resolverMontoObligacion", () => {
  it("calcula el monto desde un porcentaje", () => {
    expect(resolverMontoObligacion(400000, "porcentaje", 75)).toBe(300000);
  });

  it("redondea a 2 decimales", () => {
    expect(resolverMontoObligacion(100000, "porcentaje", 33.33)).toBe(33330);
  });

  it("pasa directo el valor cuando es monto fijo", () => {
    expect(resolverMontoObligacion(400000, "monto_fijo", 150000)).toBe(150000);
  });
});

describe("sumarMeses", () => {
  it("avanza meses dentro del mismo año", () => {
    expect(sumarMeses("2026-03-15", 2)).toBe("2026-05-15");
  });

  it("cruza el fin de año sin desfase", () => {
    expect(sumarMeses("2026-11-10", 3)).toBe("2027-02-10");
  });

  it("con 0 meses devuelve la misma fecha", () => {
    expect(sumarMeses("2026-06-01", 0)).toBe("2026-06-01");
  });
});

describe("generarCuotas", () => {
  it("una sola cuota con el monto completo si numeroCuotas=1", () => {
    expect(generarCuotas(300000, 1, "2026-09-01")).toEqual([
      { numero_cuota: 1, monto: 300000, fecha_vencimiento: "2026-09-01" },
    ]);
  });

  it("reparte en partes iguales cuando divide exacto", () => {
    const cuotas = generarCuotas(600000, 6, "2026-01-01");
    expect(cuotas).toHaveLength(6);
    expect(cuotas.every((c) => c.monto === 100000)).toBe(true);
    expect(cuotas.map((c) => c.fecha_vencimiento)).toEqual([
      "2026-01-01",
      "2026-02-01",
      "2026-03-01",
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
    ]);
  });

  it("el resto de la división cae en la última cuota", () => {
    const cuotas = generarCuotas(100000, 3, "2026-01-01");
    expect(cuotas.map((c) => c.monto)).toEqual([33333.33, 33333.33, 33333.34]);
    expect(cuotas.reduce((s, c) => s + c.monto, 0)).toBeCloseTo(100000, 2);
  });
});

describe("validarReparto", () => {
  const cuota = (monto: number): FilaObligacion["cuotas"] => [
    { numero_cuota: 1, monto, fecha_vencimiento: null },
  ];

  it("acepta un reparto simple de 100% a un responsable", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 100, cuotas: cuota(400000) },
    ];
    expect(validarReparto(filas, 400000)).toBeNull();
  });

  it("acepta un reparto compartido válido con cuotas", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 75, cuotas: cuota(300000) },
      { responsable: "arrendatario", tipo_monto: "porcentaje", valor: 25, cuotas: cuota(100000) },
    ];
    expect(validarReparto(filas, 400000)).toBeNull();
  });

  it("rechaza porcentajes que no suman 100", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 75, cuotas: cuota(300000) },
      { responsable: "arrendatario", tipo_monto: "porcentaje", valor: 20, cuotas: cuota(80000) },
    ];
    expect(validarReparto(filas, 400000)).toMatch(/sumar 100/);
  });

  it("rechaza responsables repetidos", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 50, cuotas: cuota(200000) },
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 50, cuotas: cuota(200000) },
    ];
    expect(validarReparto(filas, 400000)).toMatch(/repetirse/);
  });

  it("rechaza mezclar porcentaje y monto fijo", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 75, cuotas: cuota(300000) },
      { responsable: "arrendatario", tipo_monto: "monto_fijo", valor: 100000, cuotas: cuota(100000) },
    ];
    expect(validarReparto(filas, 400000)).toMatch(/mezclar/);
  });

  it("rechaza montos fijos que no suman el total del gasto", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "monto_fijo", valor: 300000, cuotas: cuota(300000) },
      { responsable: "arrendatario", tipo_monto: "monto_fijo", valor: 50000, cuotas: cuota(50000) },
    ];
    expect(validarReparto(filas, 400000)).toMatch(/sumar el total/);
  });

  it("rechaza cuotas que no suman el monto de la obligación", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 100, cuotas: cuota(350000) },
    ];
    expect(validarReparto(filas, 400000)).toMatch(/cuotas de propietario/);
  });

  it("rechaza una obligación sin ninguna cuota", () => {
    const filas: FilaObligacion[] = [
      { responsable: "propietario", tipo_monto: "porcentaje", valor: 100, cuotas: [] },
    ];
    expect(validarReparto(filas, 400000)).toMatch(/al menos una cuota/);
  });
});

describe("estadoComprometido", () => {
  it("libre si no hay obligaciones", () => {
    expect(estadoComprometido([])).toBe("libre");
  });

  it("libre si ninguna cuota está pagada ni liquidada", () => {
    expect(
      estadoComprometido([{ cuotas: [{ estado: "pendiente", liquidacion_id: null }] }])
    ).toBe("libre");
  });

  it("total si todas las cuotas están comprometidas", () => {
    expect(
      estadoComprometido([{ cuotas: [{ estado: "pagado", liquidacion_id: "L1" }] }])
    ).toBe("total");
  });

  it("parcial si algunas cuotas están comprometidas y otras no", () => {
    const obligaciones = [
      {
        cuotas: [
          { estado: "pagado" as const, liquidacion_id: "L1" },
          { estado: "pendiente" as const, liquidacion_id: null },
        ],
      },
    ];
    expect(estadoComprometido(obligaciones)).toBe("parcial");
  });

  it("una cuota pagada sin liquidacion_id también cuenta como comprometida", () => {
    expect(
      estadoComprometido([{ cuotas: [{ estado: "pagado", liquidacion_id: null }] }])
    ).toBe("total");
  });
});
