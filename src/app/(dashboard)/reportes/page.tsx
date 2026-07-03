import { getReporteFinanciero, getOpcionesReporte } from "@/features/reportes/queries";
import { ReportesDashboard } from "@/features/reportes/reportes-dashboard";
import { PageHeader } from "@/components/page-header";
import { ui } from "@/components/ui";

type SP = { anio?: string; propiedad?: string; propietario?: string };

export default async function ReportesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const opciones = await getOpcionesReporte();

  const anio =
    sp.anio && /^\d{4}$/.test(sp.anio)
      ? parseInt(sp.anio, 10)
      : opciones.anios[0];

  const filtros = {
    anio,
    propiedadId: sp.propiedad || undefined,
    propietarioId: sp.propietario || undefined,
  };

  const reporte = await getReporteFinanciero(filtros);

  const etiquetaFiltro =
    opciones.propiedades.find((p) => p.id === sp.propiedad)?.label ??
    opciones.propietarios.find((p) => p.id === sp.propietario)?.label ??
    "Toda la cartera";

  return (
    <div>
      <PageHeader
        titulo="Reportes financieros"
        descripcion="Indicadores, gráficos y comparativos calculados sobre los datos del sistema."
      />

      <form
        method="get"
        className="no-print mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Año</span>
          <select name="anio" defaultValue={String(anio)} className={ui.input}>
            {opciones.anios.map((a) => (
              <option key={a} value={a}>
                {a}
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
          <span className="font-medium">Propietario</span>
          <select name="propietario" defaultValue={sp.propietario ?? ""} className={ui.input}>
            <option value="">Todos</option>
            {opciones.propietarios.map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <button type="submit" className={ui.btnSecondary}>
            Aplicar filtros
          </button>
        </div>
      </form>

      <ReportesDashboard reporte={reporte} etiquetaFiltro={etiquetaFiltro} />
    </div>
  );
}
