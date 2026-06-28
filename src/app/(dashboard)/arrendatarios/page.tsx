import Link from "next/link";
import { listArrendatarios } from "@/features/arrendatarios/queries";
import { cambiarActivoArrendatario } from "@/features/arrendatarios/actions";

function nombreMostrar(a: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (a.tipo_persona === "persona_juridica") return a.razon_social ?? "—";
  return [a.nombre, a.apellido].filter(Boolean).join(" ") || "—";
}

export default async function ArrendatariosPage() {
  const arrendatarios = await listArrendatarios();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Arrendatarios</h1>
        <Link
          href="/arrendatarios/nuevo"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo arrendatario
        </Link>
      </div>

      {arrendatarios.length === 0 ? (
        <p className="opacity-60">Aún no hay arrendatarios registrados.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/10 text-left">
                <th className="py-2 pr-4">Nombre / Razón social</th>
                <th className="py-2 pr-4">RUT</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Teléfono</th>
                <th className="py-2 pr-4">Estado</th>
                <th className="py-2 pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {arrendatarios.map((a) => (
                <tr key={a.id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{nombreMostrar(a)}</td>
                  <td className="py-2 pr-4">{a.rut}</td>
                  <td className="py-2 pr-4">{a.email ?? "—"}</td>
                  <td className="py-2 pr-4">{a.telefono ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span className={a.activo ? "text-green-700" : "text-black/40"}>
                      {a.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="flex gap-3 py-2 pr-4">
                    <Link
                      href={`/arrendatarios/${a.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form
                      action={cambiarActivoArrendatario.bind(
                        null,
                        a.id,
                        !a.activo
                      )}
                    >
                      <button
                        type="submit"
                        className="text-black/50 hover:underline"
                      >
                        {a.activo ? "Desactivar" : "Activar"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
