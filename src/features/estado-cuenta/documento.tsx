import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import type { EstadoCuenta } from "./types";

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

function Dato({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{rotulo}</dt>
      <dd className="mt-0.5 break-words text-sm text-ink">{valor}</dd>
    </div>
  );
}

/**
 * Documento imprimible de estado de cuenta. Presentacional puro: lo renderizan
 * tanto la vista de administración (`/cobros/estados-cuenta/[id]`) como el link
 * público que recibe el arrendatario (`/e/[token]`), para que lo que se ve en
 * pantalla, lo que se imprime y lo que abre el arrendatario sean exactamente lo
 * mismo — sin dos maquetas que puedan desincronizarse.
 *
 * Hoja blanca sobre el canvas oscuro de la app; en impresión ocupa la página
 * completa (ver `@media print` en globals.css).
 */
export function EstadoCuentaDocumento({ datos }: { datos: EstadoCuenta }) {
  const { arrendatario, empresa, cargos, destinos, total, total_vencido, dias_mora_maxima } = datos;
  const hayVencido = total_vencido > 0;
  // Una cuenta incompleta se omite en vez de mostrarse a medias: un informe con
  // "Banco: —" es peor que no incluir la sección (la vista de admin avisa aparte).
  const destinosVisibles = destinos.filter((d) => d.completa);
  const variosDestinos = destinosVisibles.length > 1;

  return (
    <article className="mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-sm print:max-w-none print:rounded-none print:shadow-none">
      {/* Membrete */}
      <header className="flex items-start justify-between gap-4 border-b-2 border-burgundy px-6 py-5 sm:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-burgundy text-sm font-bold text-white">
            RZK
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold text-ink">{empresa.nombre}</p>
            <p className="text-xs text-muted">Administración de arriendos</p>
            {empresa.rut && <p className="text-xs text-muted">RUT {empresa.rut}</p>}
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-burgundy">
            Estado de cuenta
          </p>
          <p className="mt-1 text-xs text-muted">Emitido {formatearFecha(datos.emitido)}</p>
        </div>
      </header>

      {/* Arrendatario + total */}
      <section className="grid gap-5 border-b border-line px-6 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-8">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
          <Dato rotulo="Arrendatario" valor={arrendatario.nombre} />
          <Dato rotulo="RUT" valor={arrendatario.rut} />
          {arrendatario.email && <Dato rotulo="Email" valor={arrendatario.email} />}
          {arrendatario.telefono && <Dato rotulo="Teléfono" valor={arrendatario.telefono} />}
        </dl>

        <div
          className={`rounded-lg px-5 py-4 text-right sm:min-w-[13rem] ${
            hayVencido ? "bg-burgundy text-white" : "bg-stone-100 text-ink"
          }`}
        >
          <p
            className={`text-[10px] font-semibold uppercase tracking-wider ${
              hayVencido ? "text-white/70" : "text-muted"
            }`}
          >
            Total pendiente
          </p>
          <p className="mt-0.5 text-3xl font-semibold tabular-nums">{clp(total)}</p>
          <p className={`mt-1 text-xs ${hayVencido ? "text-white/80" : "text-muted"}`}>
            {cargos.length} {cargos.length === 1 ? "cargo" : "cargos"}
            {hayVencido && ` · ${clp(total_vencido)} vencido`}
          </p>
        </div>
      </section>

      {hayVencido && (
        <p className="border-b border-line bg-burgundy-50 px-6 py-2.5 text-xs text-burgundy-strong sm:px-8">
          Hay saldos con {dias_mora_maxima} {dias_mora_maxima === 1 ? "día" : "días"} de atraso.
          Te pedimos regularizar a la brevedad o indicarnos una fecha de pago.
        </p>
      )}

      {/* Detalle */}
      <section className="px-6 py-5 sm:px-8">
        <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Detalle de cargos pendientes
        </h2>

        {cargos.length === 0 ? (
          <p className="rounded-lg bg-stone-50 px-4 py-6 text-center text-sm text-muted">
            No hay cargos pendientes. Tu cuenta está al día.
          </p>
        ) : (
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-line text-[10px] uppercase tracking-wider text-muted">
                <th className="hidden py-2 pr-3 text-left font-semibold sm:table-cell print:table-cell">
                  Período
                </th>
                <th className="py-2 pr-3 text-left font-semibold">Concepto</th>
                <th className="py-2 pr-3 text-left font-semibold">Vence</th>
                <th className="hidden py-2 pr-3 text-right font-semibold sm:table-cell print:table-cell">
                  Atraso
                </th>
                <th className="py-2 text-right font-semibold">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cargos.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="hidden py-2.5 pr-3 tabular-nums text-muted sm:table-cell print:table-cell">
                    {formatearPeriodo(c.periodo)}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span className="font-medium text-ink">{etiquetaTipoCargo(c.tipo_cargo)}</span>
                    <span className="block text-xs text-muted">{c.propiedad_label}</span>
                    <span className="block text-xs text-muted sm:hidden print:hidden">
                      Período {formatearPeriodo(c.periodo)}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 whitespace-nowrap tabular-nums text-muted">
                    {formatearFecha(c.fecha_vencimiento)}
                  </td>
                  <td className="hidden py-2.5 pr-3 text-right tabular-nums sm:table-cell print:table-cell">
                    {c.dias_mora > 0 ? (
                      <span className="font-medium text-burgundy">{c.dias_mora} d</span>
                    ) : (
                      <span className="text-muted">Al día</span>
                    )}
                  </td>
                  <td className="py-2.5 text-right font-medium tabular-nums text-ink">
                    {clp(c.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-ink">
                <td
                  className="py-3 text-sm font-semibold text-ink"
                  colSpan={2}
                >
                  Total pendiente
                </td>
                <td className="py-3" />
                <td className="hidden print:table-cell sm:table-cell" />
                <td className="py-3 text-right text-base font-semibold tabular-nums text-ink">
                  {clp(total)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </section>

      {/* Cómo pagar — un bloque por cuenta de destino */}
      {destinosVisibles.length > 0 && (
        <section className="border-t border-line bg-stone-50 px-6 py-5 sm:px-8">
          <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
            Cómo regularizar
          </h2>

          {variosDestinos && (
            <p className="mb-4 text-xs text-muted">
              Tus cargos se pagan en {destinosVisibles.length} cuentas distintas. Transfiere el
              monto indicado a cada una.
            </p>
          )}

          <div className="flex flex-col gap-4">
            {destinosVisibles.map((d) => (
              <div
                key={d.clave}
                className={variosDestinos ? "rounded-lg border border-line bg-white p-4" : undefined}
              >
                {variosDestinos && (
                  <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-line pb-2">
                    <div>
                      <p className="text-sm font-semibold text-ink">{d.titulo}</p>
                      <p className="text-xs text-muted">{d.propiedades.join(" · ")}</p>
                    </div>
                    <p className="text-sm font-semibold tabular-nums text-ink">{clp(d.subtotal)}</p>
                  </div>
                )}
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
                  <Dato rotulo="Banco" valor={d.cuenta.banco ?? "—"} />
                  {d.cuenta.tipo_cuenta && (
                    <Dato rotulo="Tipo de cuenta" valor={d.cuenta.tipo_cuenta} />
                  )}
                  <Dato rotulo="N° de cuenta" valor={d.cuenta.numero_cuenta ?? "—"} />
                  {d.cuenta.titular_nombre && (
                    <Dato rotulo="Titular" valor={d.cuenta.titular_nombre} />
                  )}
                  {d.cuenta.rut_titular && <Dato rotulo="RUT titular" valor={d.cuenta.rut_titular} />}
                  {d.cuenta.email_pagos && (
                    <Dato rotulo="Enviar comprobante a" valor={d.cuenta.email_pagos} />
                  )}
                </dl>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs text-muted">
            Al transferir, indica tu RUT en el mensaje y envíanos el comprobante. Si ya realizaste
            el pago en los últimos días, es posible que aún no esté registrado — avísanos para
            regularizarlo.
          </p>
        </section>
      )}

      <footer className="border-t border-line px-6 py-4 text-center text-[11px] text-muted sm:px-8">
        Documento informativo emitido por {empresa.nombre} el {formatearFecha(datos.emitido)}. Los
        montos corresponden al saldo registrado a esa fecha.
      </footer>
    </article>
  );
}
