import { getReporteFinanciero, getOpcionesReporte } from "@/features/reportes/queries";
import { ReportesDashboard } from "@/features/reportes/reportes-dashboard";
import { FiltroReportes } from "@/features/reportes/filtro-reportes";
import { PageHeader } from "@/components/page-header";

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

      <FiltroReportes
        valores={{
          anio: String(anio),
          propiedad: sp.propiedad ?? "",
          propietario: sp.propietario ?? "",
        }}
        anios={opciones.anios}
        propiedades={opciones.propiedades}
        propietarios={opciones.propietarios}
        hayFiltros={Boolean(sp.propiedad || sp.propietario || (sp.anio && anio !== opciones.anios[0]))}
      />

      <ReportesDashboard reporte={reporte} etiquetaFiltro={etiquetaFiltro} />
    </div>
  );
}
