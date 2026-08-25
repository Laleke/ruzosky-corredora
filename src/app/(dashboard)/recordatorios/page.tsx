import { listRecordatorios } from "@/features/recordatorios/queries";
import { RecordatorioForm } from "@/features/recordatorios/recordatorio-form";
import { RecordatorioCard } from "@/features/recordatorios/recordatorio-card";
import { PageHeader } from "@/components/page-header";
import { ui } from "@/components/ui";

export default async function RecordatoriosPage() {
  const recordatorios = await listRecordatorios();

  return (
    <div>
      <PageHeader
        titulo="Recordatorios"
        descripcion="Avisos automáticos por push cuando falta cargar luz, agua, GGCC u otro cargo recurrente."
      />

      <div className="mb-6 rounded-xl bg-burgundy p-5">
        <h2 className="mb-3 text-sm font-semibold text-white">Nuevo recordatorio</h2>
        <RecordatorioForm />
      </div>

      {recordatorios.length === 0 ? (
        <div className={`${ui.card} p-10 text-center text-sm text-muted`}>
          Aún no hay recordatorios. Crea uno para que te avise cuando falte cargar un cobro.
        </div>
      ) : (
        <div className={ui.cardGrid}>
          {recordatorios.map((r) => (
            <RecordatorioCard key={r.id} recordatorio={r} />
          ))}
        </div>
      )}
    </div>
  );
}
