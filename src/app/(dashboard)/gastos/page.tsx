import Link from "next/link";
import { listGastos } from "@/features/gastos/queries";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import {
  CATEGORIAS_GASTO,
  CATEGORIA_GASTO_LABEL,
  ESTADOS_GASTO,
  ESTADO_GASTO,
  RESPONSABLES_GASTO,
  RESPONSABLE_GASTO_LABEL,
  clp,
} from "@/features/gastos/constants";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import type {
  CategoriaGasto,
  EstadoGasto,
  ResponsableGasto,
} from "@/types/database.types";
import type { FiltrosGastos } from "@/features/gastos/types";

type SP = {
  q?: string;
  categoria?: string;
  estado?: string;
  responsable?: string;
  propiedad?: string;
  propietario?: string;
  desde?: string;
  hasta?: string;
};

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const filtros: FiltrosGastos = {
    q: sp.q,
    categoria: sp.categoria as CategoriaGasto | undefined,
    estado: sp.estado as EstadoGasto | undefined,
    responsable: sp.responsable as ResponsableGasto | undefined,
    propiedadId: sp.propiedad,
    propietarioId: sp.propietario,
    desde: sp.desde,
    hasta: sp.hasta,
  };

  const [gastos, opciones] = await Promise.all([
    listGastos(filtros),
    getOpcionesRelacion(),
  ]);

  const totalVigente = gastos
    .filter((g) => g.estado !== "anulado")
    .reduce((acc, g) => acc + Number(g.monto), 0);

  return (
    <div>
      <PageHeader
        titulo="Gastos"
        descripcion="Gastos por propiedad. Fuente oficial de gastos para reportes y liquidaciones."
        accion={{ href: "/gastos/nuevo", label: "Registrar gasto" }}
      />

      <form
        method="get"
        className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm sm:col-span-2">
          <span className="font-medium">Buscar</span>
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Descripción…"
            className={ui.input}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Categoría</span>
          <select name="categoria" defaultValue={sp.categoria ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {CATEGORIAS_GASTO.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Estado</span>
          <select name="estado" defaultValue={sp.estado ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {ESTADOS_GASTO.map((e) => (
              <option key={e.value} value={e.value}>
                {e.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Responsable</span>
          <select name="responsable" defaultValue={sp.responsable ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {RESPONSABLES_GASTO.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Propiedad</span>
          <select name="propiedad" defaultValue={sp.propiedad ?? ""} className={ui.input}>
            <option value="">Todas</option>
            {opciones.propiedades.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Desde</span>
          <input type="date" name="desde" defaultValue={sp.desde ?? ""} className={ui.input} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Hasta</span>
          <input type="date" name="hasta" defaultValue={sp.hasta ?? ""} className={ui.input} />
        </label>
        <div className="flex items-end gap-2">
          <button type="submit" className={ui.btnSecondary}>
            Filtrar
          </button>
          <Link href="/gastos" className={ui.btnGhost}>
            Limpiar
          </Link>
        </div>
      </form>

      {gastos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay gastos con esos filtros.
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-muted">
            {gastos.length} gasto{gastos.length === 1 ? "" : "s"} · Total vigente:{" "}
            <span className="font-semibold text-ink">{clp(totalVigente)}</span>
          </div>
          <div className={`${ui.card} overflow-hidden`}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-line bg-stone-50/60">
                  <tr>
                    <th className={ui.th}>Fecha</th>
                    <th className={ui.th}>Descripción</th>
                    <th className={ui.th}>Categoría</th>
                    <th className={ui.th}>Propiedad</th>
                    <th className={ui.th}>Responsable</th>
                    <th className={`${ui.th} text-right`}>Monto</th>
                    <th className={ui.th}>Estado</th>
                    <th className={ui.th}></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {gastos.map((g) => {
                    const est = ESTADO_GASTO[g.estado];
                    return (
                      <tr key={g.id} className="transition-colors hover:bg-stone-50/50">
                        <td className={`${ui.td} text-muted`}>{g.fecha}</td>
                        <td className={`${ui.td} font-medium`}>
                          <span className="flex items-center gap-2">
                            {g.descripcion}
                            {g.descontar_de_liquidacion && (
                              <span className={badge("info")} title="Se descuenta de la liquidación del propietario">
                                Liq.
                              </span>
                            )}
                          </span>
                        </td>
                        <td className={ui.td}>{CATEGORIA_GASTO_LABEL[g.categoria]}</td>
                        <td className={`${ui.td} text-muted`}>{g.propiedad_label ?? "—"}</td>
                        <td className={ui.td}>{RESPONSABLE_GASTO_LABEL[g.responsable_pago]}</td>
                        <td className={`${ui.td} text-right font-medium`}>{clp(g.monto)}</td>
                        <td className={ui.td}>
                          <span className={badge(est.tone)}>{est.label}</span>
                        </td>
                        <td className={`${ui.td} text-right`}>
                          <Link href={`/gastos/${g.id}`} className={ui.linkAction}>
                            Ver
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
