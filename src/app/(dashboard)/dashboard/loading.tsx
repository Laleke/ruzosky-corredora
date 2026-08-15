/**
 * El logo "RZK Prop" y el ítem "Dashboard" del menú navegan aquí; sin este
 * loading.tsx la pantalla queda en blanco/congelada mientras se resuelven
 * las ~13 consultas de KPIs y tareas pendientes (ver getDashboardStats/
 * getTareasPendientes) — Next.js muestra este esqueleto de inmediato en su
 * lugar, para que la navegación se sienta instantánea aunque los datos
 * tarden lo mismo en llegar.
 *
 * TEMPORAL (debug "divide y vencerás"): reducido a 1 sola tarjeta para que
 * calce con page.tsx, que también tiene comentadas las otras 3 KPI y las
 * tareas pendientes. Restaurar el esqueleto completo junto con page.tsx.
 */
export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <div className="h-7 w-56 animate-pulse rounded bg-white/10" />
        <div className="mt-2 h-4 w-72 animate-pulse rounded bg-white/5" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-3 rounded-xl bg-burgundy p-4 shadow-sm">
          <span className="h-10 w-10 shrink-0 animate-pulse rounded-lg bg-white/10" />
          <div className="min-w-0 flex-1">
            <div className="h-5 w-20 animate-pulse rounded bg-white/15" />
            <div className="mt-1.5 h-3 w-24 animate-pulse rounded bg-white/10" />
          </div>
        </div>
      </div>
    </div>
  );
}
