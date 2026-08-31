import { PagoItem } from "./pago-item";
import type { Pago } from "./types";

/** Listado de pagos de un cargo, en el mismo patrón de tarjeta usado en el resto de la app. */
export function PagosLista({
  cargoId,
  pagos,
  contratoId,
  empresaId,
  tipoCargo,
  periodo,
}: {
  cargoId: string;
  pagos: Pago[];
  contratoId: string;
  empresaId: string;
  tipoCargo: string;
  periodo: string;
}) {
  return (
    <div className="flex flex-col gap-3">
      {pagos.map((p) => (
        <PagoItem
          key={p.id}
          pago={p}
          cargoId={cargoId}
          contratoId={contratoId}
          empresaId={empresaId}
          tipoCargo={tipoCargo}
          periodo={periodo}
        />
      ))}
    </div>
  );
}
