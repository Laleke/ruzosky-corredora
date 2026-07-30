import Link from "next/link";
import { Eye, Info } from "lucide-react";
import { listGastos } from "@/features/gastos/queries";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { FiltroGastos } from "@/features/gastos/filtro-gastos";
import {
  CATEGORIA_GASTO_LABEL,
  ESTADO_GASTO,
  clp,
} from "@/features/gastos/constants";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";
import type { CategoriaGasto, EstadoGasto } from "@/types/database.types";
import type { FiltrosGastos } from "@/features/gastos/types";

type SP = {
  q?: string;
  categoria?: string;
  estado?: string;
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
        descripcion="Un gasto es un cargo asociado al propietario de la propiedad: podrá descontarse automáticamente en su liquidación según la configuración seleccionada."
        accion={{ href: "/gastos/nuevo", label: "Registrar gasto" }}
      />

      <FiltroGastos
        valores={sp}
        propiedades={opciones.propiedades}
        hayFiltros={Boolean(
          sp.q || sp.categoria || sp.estado || sp.propiedad || sp.desde || sp.hasta
        )}
      />

      {gastos.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay gastos con esos filtros.
        </div>
      ) : (
        <>
          <div className="mb-3 text-sm text-canvas-muted">
            {gastos.length} gasto{gastos.length === 1 ? "" : "s"} · Total vigente:{" "}
            <span className="font-semibold text-canvas-fg">{clp(totalVigente)}</span>
          </div>
          <div className={ui.cardGrid}>
            {gastos.map((g) => {
              const est = ESTADO_GASTO[g.estado];
              return (
                <div key={g.id} className={ui.listCard}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs text-white/60">
                        {g.fecha} · {CATEGORIA_GASTO_LABEL[g.categoria]}
                      </p>
                      <p className="flex items-center gap-2 font-medium text-white">
                        {g.descripcion}
                        {g.descontar_de_liquidacion && (
                          <span className={badge("info")} title="Se descuenta de la liquidación del propietario">
                            Liq.
                          </span>
                        )}
                      </p>
                    </div>
                    <span className={badge(est.tone)}>{est.label}</span>
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <details className="min-w-0 flex-1">
                      <summary className={ui.listCardDisclosure}>
                        <Info size={14} /> Ver más información
                      </summary>
                      <div className="mt-2 flex flex-col gap-1 text-sm text-white/80">
                        <span>Propiedad: {g.propiedad_label ?? "—"}</span>
                        <span>Monto: {clp(g.monto)}</span>
                      </div>
                    </details>

                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/gastos/${g.id}`}
                        aria-label="Ver detalle"
                        title="Ver detalle"
                        className={ui.listCardIconBtn}
                      >
                        <Eye size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
