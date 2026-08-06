import Link from "next/link";
import { FileText } from "lucide-react";
import { arrendatariosConDeuda } from "@/features/estado-cuenta/queries";
import { PageHeader } from "@/components/page-header";
import { ui, badge } from "@/components/ui";

function clp(n: number): string {
  return `$${Math.round(n).toLocaleString("es-CL")}`;
}

export default async function EstadosCuentaPage() {
  const deudores = await arrendatariosConDeuda();
  const totalGeneral = deudores.reduce((acc, d) => acc + d.total_vencido, 0);

  return (
    <div>
      <PageHeader
        titulo="Estados de cuenta"
        descripcion="Arrendatarios con deuda vencida. Genera el informe de cobranza para enviarlo por WhatsApp."
      />

      {deudores.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          No hay arrendatarios con deuda vencida.
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-canvas-muted">
            {deudores.length} {deudores.length === 1 ? "arrendatario" : "arrendatarios"} en mora ·
            Total vencido {clp(totalGeneral)}
          </p>

          <div className={ui.cardGrid}>
            {deudores.map((d) => (
              <Link key={d.id} href={`/cobros/estados-cuenta/${d.id}`} className={ui.listCard}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-white/60">{d.rut}</p>
                    <p className="truncate font-medium text-white">{d.nombre}</p>
                  </div>
                  <span className={badge("danger")}>{clp(d.total_vencido)}</span>
                </div>

                <div className="flex flex-col gap-1 text-sm text-white/80">
                  <span>
                    {d.cargos_morosos} {d.cargos_morosos === 1 ? "cargo vencido" : "cargos vencidos"}{" "}
                    · {d.dias_mora_maxima} {d.dias_mora_maxima === 1 ? "día" : "días"} de atraso
                  </span>
                  {d.total_por_vencer > 0 && (
                    <span className="text-xs text-white/60">
                      + {clp(d.total_por_vencer)} por vencer (no va en el informe)
                    </span>
                  )}
                  {d.propiedades.length > 0 && (
                    <span className="truncate text-xs text-white/60">
                      {d.propiedades.join(" · ")}
                    </span>
                  )}
                </div>

                <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-white/80">
                  <FileText size={14} /> Ver informe
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
