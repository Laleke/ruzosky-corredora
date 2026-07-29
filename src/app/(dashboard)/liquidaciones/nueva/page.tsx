import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { listPropietarios } from "@/features/propietarios/queries";
import { calcularLiquidacion, existeLiquidacion } from "@/features/liquidaciones/queries";
import { generarLiquidacion } from "@/features/liquidaciones/actions";
import { ConfirmarForm } from "@/features/liquidaciones/confirmar-form";
import { SeleccionLiquidacionWizard } from "@/features/liquidaciones/seleccion-wizard";
import { CATEGORIA_GASTO_LABEL } from "@/features/gastos/constants";
import { ui } from "@/components/ui";

function nombre(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function NuevaLiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ propietario?: string; periodo?: string }>;
}) {
  const sp = await searchParams;
  const propietarioId = sp.propietario ?? "";
  const periodo = sp.periodo ?? "";
  const haySeleccion = !!propietarioId && /^\d{4}-\d{2}$/.test(periodo);

  const propietarios = (await listPropietarios())
    .filter((p) => p.activo)
    .map((p) => ({ id: p.id, label: `${nombre(p)} · ${p.rut}` }));

  let preview = null;
  let propLabel = "";
  let yaExiste = false;
  if (haySeleccion) {
    const supabase = await createClient();
    [preview, yaExiste] = await Promise.all([
      calcularLiquidacion(supabase, propietarioId, `${periodo}-01`),
      existeLiquidacion(propietarioId, `${periodo}-01`),
    ]);
    propLabel = propietarios.find((p) => p.id === propietarioId)?.label ?? "";
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/liquidaciones" className="text-sm text-muted hover:text-ink">
          ← Volver a liquidaciones
        </Link>
      </div>

      {!haySeleccion && <SeleccionLiquidacionWizard propietarios={propietarios} />}

      {/* Vista previa (objetos sin cambios) */}
      {haySeleccion && preview && (
        <div className="flex flex-col gap-5">
          <div className={`${ui.card} flex items-center justify-between gap-3 p-5`}>
            <p className="text-sm text-muted">
              {propLabel} · período <strong className="text-ink">{periodo}</strong>
            </p>
            <Link href="/liquidaciones/nueva" className={ui.linkAction}>
              Cambiar propietario/período
            </Link>
          </div>

          {preview.ingresos.length === 0 &&
          preview.descuentos.length === 0 &&
          preview.gastos.length === 0 ? (
            <div className={`${ui.card} p-8 text-center text-sm text-muted`}>
              No hay movimientos en este período para liquidar.
            </div>
          ) : (
            <>
              <div className={`${ui.card} overflow-hidden`}>
                <div className="border-b border-line bg-stone-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Ingresos
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-line">
                    {preview.ingresos.map((l, i) => (
                      <tr key={i}>
                        <td className={ui.td}>{l.concepto}</td>
                        <td className={`${ui.td} text-right font-medium`}>{clp(l.monto)}</td>
                      </tr>
                    ))}
                    {preview.ingresos.length === 0 && (
                      <tr>
                        <td className={`${ui.td} text-muted`} colSpan={2}>Sin ingresos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={`${ui.card} overflow-hidden`}>
                <div className="border-b border-line bg-stone-50/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  Descuentos
                </div>
                <table className="w-full">
                  <tbody className="divide-y divide-line">
                    {preview.descuentos.map((l, i) => (
                      <tr key={`d-${i}`}>
                        <td className={ui.td}>{l.concepto}</td>
                        <td className={`${ui.td} text-right font-medium`}>{clp(l.monto)}</td>
                      </tr>
                    ))}
                    {preview.gastos.map((g) => (
                      <tr key={g.gasto_id}>
                        <td className={ui.td}>
                          {g.descripcion}
                          <span className="block text-xs text-muted">
                            Gasto:{" "}
                            {CATEGORIA_GASTO_LABEL[
                              g.categoria as keyof typeof CATEGORIA_GASTO_LABEL
                            ] ?? g.categoria}{" "}
                            · {g.fecha}
                          </span>
                        </td>
                        <td className={`${ui.td} text-right font-medium`}>
                          − {clp(g.monto)}
                        </td>
                      </tr>
                    ))}
                    {preview.descuentos.length === 0 && preview.gastos.length === 0 && (
                      <tr>
                        <td className={`${ui.td} text-muted`} colSpan={2}>Sin descuentos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className={`${ui.card} flex flex-col gap-2 p-5`}>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total ingresos</span>
                  <span>{clp(preview.subtotal_ingresos)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted">Total descuentos</span>
                  <span>− {clp(preview.subtotal_descuentos + preview.subtotal_gastos)}</span>
                </div>
                <div className="mt-1 flex justify-between border-t border-line pt-2 text-base font-semibold text-ink">
                  <span>Total a liquidar</span>
                  <span>{clp(preview.total_liquidacion)}</span>
                </div>
              </div>

              {/* Paso 4: confirmar */}
              <div className={`${ui.card} p-5`}>
                <h2 className="mb-3 text-sm font-semibold text-ink">
                  Confirmar generación
                </h2>
                {yaExiste ? (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Ya existe una liquidación para {propLabel} en el período {periodo}.
                    No se puede generar otra hasta anular la existente.
                  </p>
                ) : (
                  <ConfirmarForm
                    action={generarLiquidacion.bind(null, propietarioId, periodo)}
                    subtotalIngresos={preview.subtotal_ingresos}
                    subtotalDescuentos={preview.subtotal_descuentos + preview.subtotal_gastos}
                  />
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
