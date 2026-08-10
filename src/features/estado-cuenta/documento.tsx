import { AlertTriangle, Home } from "lucide-react";
import { etiquetaTipoCargo } from "@/features/cobros/constants";
import { formatearFecha, formatearPeriodo } from "@/lib/fecha";
import type { DestinoPago, EstadoCuenta } from "./types";

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

/** Texto del isotipo, igual al de los sidebars (`components/sidebar.tsx`). */
const BADGE = "RZK";

/**
 * Nombre de la empresa sin la palabra que ya muestra el isotipo, para que el
 * membrete diga "[RZK] Prop" y no "[RZK] RZK Prop". Si el nombre no empieza con
 * el badge (otra empresa en el futuro), se devuelve tal cual.
 */
function nombreJuntoAlBadge(nombre: string): string {
  const sinBadge = nombre.trim().replace(new RegExp(`^${BADGE}\\s+`, "i"), "");
  return sinBadge || nombre;
}

function CampoPago({ rotulo, valor, destacado }: { rotulo: string; valor: string; destacado?: boolean }) {
  return (
    <div className="min-w-0">
      <dt className="text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400">{rotulo}</dt>
      <dd
        className={`mt-0.5 break-words text-xs font-bold ${
          destacado ? "text-burgundy" : "text-slate-700"
        }`}
      >
        {valor}
      </dd>
    </div>
  );
}

function BloquePago({ destino, mostrarEncabezado }: { destino: DestinoPago; mostrarEncabezado: boolean }) {
  const { cuenta } = destino;
  return (
    <div className="doc-sin-corte">
      {mostrarEncabezado && (
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-200 pb-2">
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800">{destino.titulo}</p>
            <p className="text-[10px] text-slate-500">{destino.propiedades.join(" · ")}</p>
          </div>
          <p className="text-xs font-bold tabular-nums text-burgundy">{clp(destino.subtotal)}</p>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
        <CampoPago rotulo="Banco" valor={cuenta.banco ?? "—"} />
        <CampoPago rotulo="Tipo de cuenta" valor={cuenta.tipo_cuenta ?? "—"} />
        <CampoPago rotulo="Número de cuenta" valor={cuenta.numero_cuenta ?? "—"} />
        {cuenta.titular_nombre && <CampoPago rotulo="Titular" valor={cuenta.titular_nombre} />}
        {cuenta.rut_titular && <CampoPago rotulo="RUT titular" valor={cuenta.rut_titular} />}
        {cuenta.email_pagos && (
          <CampoPago rotulo="Enviar comprobante a" valor={cuenta.email_pagos} destacado />
        )}
      </dl>
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
 * Todos los cargos que llegan acá están vencidos y con saldo: es un documento
 * de cobranza (ver `estadoCuentaDeArrendatario`), así que el lenguaje es
 * siempre de mora y no hay estados intermedios que representar.
 */
export function EstadoCuentaDocumento({ datos }: { datos: EstadoCuenta }) {
  const {
    arrendatario,
    empresa,
    cargos,
    cargos_directos,
    destinos,
    total,
    total_directo,
    dias_mora_maxima,
  } = datos;
  const hayDirectos = cargos_directos.length > 0;
  // Una cuenta incompleta se omite en vez de mostrarse a medias: un informe con
  // "Banco: —" es peor que no incluir la sección (la vista de admin avisa aparte).
  const destinosVisibles = destinos.filter((d) => d.completa);
  const variosDestinos = destinosVisibles.length > 1;
  const propiedades = [
    ...new Set([...cargos, ...cargos_directos].map((c) => c.propiedad_label)),
  ];

  return (
    <article className="doc-print mx-auto w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-sm print:max-w-none print:rounded-none print:shadow-none">
      {/* Membrete */}
      <header className="flex items-start justify-between gap-4 px-6 pb-6 pt-7 sm:px-8">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="rounded-md bg-burgundy px-2.5 py-1 text-sm font-extrabold tracking-wide text-white">
              {BADGE}
            </span>
            <span className="text-xl font-extrabold text-slate-800">
              {nombreJuntoAlBadge(empresa.nombre)}
            </span>
          </div>
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            Administración de arriendos
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-extrabold uppercase leading-tight tracking-tight text-burgundy sm:text-2xl">
            Estado de cuenta
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Fecha de Emisión:{" "}
            <span className="font-bold text-slate-700">{formatearFecha(datos.emitido)}</span>
          </p>
        </div>
      </header>

      {/* Arrendatario + total */}
      <section className="doc-sin-corte mx-6 rounded-lg border-l-4 border-burgundy bg-slate-50 px-5 py-4 sm:mx-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row">
          <div className="min-w-0">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              Información del arrendatario
            </p>
            <p className="mt-1 text-lg font-bold leading-tight text-slate-800">
              {arrendatario.nombre}
            </p>
            <p className="mt-1.5 text-[11px] text-slate-600">
              <span className="font-bold">RUT:</span> {arrendatario.rut}
            </p>
            {(arrendatario.email || arrendatario.telefono) && (
              <p className="text-[11px] break-words text-slate-600">
                {arrendatario.email && (
                  <>
                    <span className="font-bold">Email:</span> {arrendatario.email}
                  </>
                )}
                {arrendatario.email && arrendatario.telefono && " | "}
                {arrendatario.telefono && (
                  <>
                    <span className="font-bold">Teléfono:</span> {arrendatario.telefono}
                  </>
                )}
              </p>
            )}
            {propiedades.length > 0 && (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {propiedades.map((p) => (
                  <span
                    key={p}
                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-200/70 px-2.5 py-1 text-[11px] font-bold text-slate-700"
                  >
                    <Home size={12} className="shrink-0 text-slate-500" />
                    Propiedad: {p}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 text-left sm:text-right">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-slate-500">
              {hayDirectos ? "Total a transferir" : "Total vencido / moroso"}
            </p>
            <p className="mt-0.5 text-3xl font-extrabold leading-none tabular-nums text-burgundy">
              {clp(total)}
            </p>
            <p className="mt-1.5 text-[11px] font-bold text-burgundy">
              {cargos.length} {cargos.length === 1 ? "cargo moroso" : "cargos morosos"} pendiente
              {cargos.length === 1 ? "" : "s"}
            </p>
            {hayDirectos && (
              <p className="text-[11px] text-slate-500">
                + {clp(total_directo)} que pagas directo
              </p>
            )}
          </div>
        </div>
      </section>

      {(cargos.length > 0 || hayDirectos) && (
        <div className="doc-sin-corte mx-6 mt-4 flex items-start gap-2.5 rounded-lg border-l-4 border-red-400 bg-red-50 px-4 py-3 sm:mx-8">
          <AlertTriangle size={15} className="mt-px shrink-0 text-amber-500" />
          <p className="text-[11px] font-bold leading-relaxed text-red-800">
            Atención: Existen saldos pendientes en mora con hasta {dias_mora_maxima}{" "}
            {dias_mora_maxima === 1 ? "día" : "días"} de atraso. Le solicitamos regularizar este
            pago a la brevedad.
          </p>
        </div>
      )}

      {/* Detalle */}
      <section className="px-6 pt-6 sm:px-8">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-slate-800">
          {hayDirectos
            ? "Detalle de cargos morosos a transferir"
            : "Detalle de cargos morosos"}
        </h2>

        {cargos.length === 0 ? (
          <p className="rounded-lg bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            {hayDirectos
              ? "No hay cargos que debas transferir. Revisa abajo los que pagas directo."
              : "No hay cargos vencidos. Tu cuenta está al día."}
          </p>
        ) : (
          <>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-100 text-[9px] uppercase tracking-[0.1em] text-slate-500">
                  <th className="hidden rounded-l-md px-3 py-2.5 text-left font-bold sm:table-cell print:table-cell">
                    Período
                  </th>
                  <th className="rounded-l-md px-3 py-2.5 text-left font-bold sm:rounded-none">
                    Concepto
                  </th>
                  <th className="px-3 py-2.5 text-left font-bold">Vencimiento</th>
                  <th className="hidden px-3 py-2.5 text-left font-bold sm:table-cell print:table-cell">
                    Atraso
                  </th>
                  <th className="rounded-r-md px-3 py-2.5 text-right font-bold">Monto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cargos.map((c) => (
                  <tr key={c.id} className="align-top">
                    <td className="hidden px-3 py-3 text-xs font-bold tabular-nums text-slate-700 sm:table-cell print:table-cell">
                      {formatearPeriodo(c.periodo)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-xs font-bold text-slate-800">
                        {etiquetaTipoCargo(c.tipo_cargo)}
                      </span>
                      {variosDestinos && (
                        <span className="block text-[10px] text-slate-500">{c.propiedad_label}</span>
                      )}
                      <span className="block text-[10px] text-slate-500 sm:hidden print:hidden">
                        Período {formatearPeriodo(c.periodo)} · {c.dias_mora} d atraso
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-slate-600">
                      {formatearFecha(c.fecha_vencimiento)}
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell print:table-cell">
                      <span className="inline-flex whitespace-nowrap rounded-md bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        {c.dias_mora} d atraso
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-bold tabular-nums text-slate-800">
                      {clp(c.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="doc-sin-corte mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-100 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-800 sm:text-sm">
                {hayDirectos ? "Total a transferir:" : "Total deuda vencida / morosa:"}
              </p>
              <p className="text-lg font-extrabold tabular-nums text-burgundy sm:text-xl">
                {clp(total)} CLP
              </p>
            </div>
          </>
        )}
      </section>

      {/* Servicios que el arrendatario paga directo: se informan como
          recordatorio, fuera del total a transferir. */}
      {hayDirectos && (
        <section className="px-6 pt-6 sm:px-8">
          <h2 className="mb-1 text-xs font-bold uppercase tracking-[0.08em] text-slate-800">
            Servicios que pagas directo
          </h2>
          <p className="mb-3 text-[11px] text-slate-500">
            Estos montos <span className="font-bold">no se transfieren</span>: los pagas
            directamente a cada empresa de servicios. Se listan solo como recordatorio.
          </p>

          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-[9px] uppercase tracking-[0.1em] text-slate-500">
                <th className="hidden rounded-l-md px-3 py-2.5 text-left font-bold sm:table-cell print:table-cell">
                  Período
                </th>
                <th className="rounded-l-md px-3 py-2.5 text-left font-bold sm:rounded-none">
                  Servicio
                </th>
                <th className="px-3 py-2.5 text-left font-bold">Vencimiento</th>
                <th className="hidden px-3 py-2.5 text-left font-bold sm:table-cell print:table-cell">
                  Atraso
                </th>
                <th className="rounded-r-md px-3 py-2.5 text-right font-bold">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {cargos_directos.map((c) => (
                <tr key={c.id} className="align-top">
                  <td className="hidden px-3 py-3 text-xs font-bold tabular-nums text-slate-700 sm:table-cell print:table-cell">
                    {formatearPeriodo(c.periodo)}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-xs font-bold text-slate-800">
                      {etiquetaTipoCargo(c.tipo_cargo)}
                    </span>
                    {variosDestinos && (
                      <span className="block text-[10px] text-slate-500">{c.propiedad_label}</span>
                    )}
                    <span className="block text-[10px] text-slate-500 sm:hidden print:hidden">
                      Período {formatearPeriodo(c.periodo)} · {c.dias_mora} d atraso
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-xs tabular-nums text-slate-600">
                    {formatearFecha(c.fecha_vencimiento)}
                  </td>
                  <td className="hidden px-3 py-3 sm:table-cell print:table-cell">
                    <span className="inline-flex whitespace-nowrap rounded-md bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {c.dias_mora} d atraso
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-right text-xs font-bold tabular-nums text-slate-800">
                    {clp(c.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="doc-sin-corte mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-slate-50 px-5 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.06em] text-slate-600">
              Total pagos directos (no se transfiere):
            </p>
            <p className="text-base font-extrabold tabular-nums text-slate-700">
              {clp(total_directo)} CLP
            </p>
          </div>
        </section>
      )}

      {/* Cómo pagar — un bloque por cuenta de destino */}
      {destinosVisibles.length > 0 && (
        <section className="px-6 pt-6 sm:px-8">
          {/* Sin corte: en el PDF de prueba las instrucciones cayeron en la
              página siguiente, separadas de los datos bancarios. */}
          <div className="doc-sin-corte rounded-lg border border-slate-200 p-5">
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.06em] text-burgundy sm:text-sm">
              ¿Cómo regularizar tu pago?
            </h2>

            {variosDestinos && (
              <p className="mb-4 text-[11px] text-slate-500">
                Tus cargos se pagan en {destinosVisibles.length} cuentas distintas. Transfiere el
                monto indicado a cada una.
              </p>
            )}

            <div className="flex flex-col gap-5">
              {destinosVisibles.map((d) => (
                <BloquePago key={d.clave} destino={d} mostrarEncabezado={variosDestinos} />
              ))}
            </div>

            <div className="mt-4 rounded-md bg-slate-50 px-4 py-3">
              <p className="text-[11px] leading-relaxed text-slate-600">
                <span className="font-bold text-slate-700">Instrucciones:</span> Al realizar la
                transferencia, indica tu <span className="font-bold">RUT en el mensaje</span> /
                asunto y envíanos el comprobante por correo. Si ya realizaste el pago en los últimos
                días, es posible que aún no esté reflejado en el sistema. Por favor avísanos para
                regularizar tu estado de cuenta.
              </p>
            </div>
          </div>
        </section>
      )}

      <footer className="mt-6 border-t border-dashed border-slate-300 px-6 py-4 text-center sm:px-8">
        <p className="text-[10px] text-slate-400">
          Documento informativo emitido electrónicamente por {empresa.nombre} el{" "}
          {formatearFecha(datos.emitido)}.
        </p>
        <p className="text-[10px] text-slate-400">
          Los montos corresponden al saldo registrado en el sistema a la fecha y hora de emisión.
        </p>
      </footer>
    </article>
  );
}
