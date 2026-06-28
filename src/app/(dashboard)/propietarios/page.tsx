import Link from "next/link";
import { listPropietarios } from "@/features/propietarios/queries";
import { cambiarActivoPropietario } from "@/features/propietarios/actions";

function nombreMostrar(p: {
  tipo_persona: string;
  nombre: string | null;
  apellido: string | null;
  razon_social: string | null;
}): string {
  if (p.tipo_persona === "persona_juridica") return p.razon_social ?? "—";
  return [p.nombre, p.apellido].filter(Boolean).join(" ") || "—";
}

export default async function PropietariosPage() {
  const propietarios = await listPropietarios();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Propietarios</h1>
        <Link
          href="/propietarios/nuevo"
          className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Nuevo propietario
        </Link>
      </div>

      {propietarios.length === 0 ? (
        <p className="opacity-60">Aún no hay propietarios registrados.</p>
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
              {propietarios.map((p) => (
                <tr key={p.id} className="border-b border-black/5">
                  <td className="py-2 pr-4">{nombreMostrar(p)}</td>
                  <td className="py-2 pr-4">{p.rut}</td>
                  <td className="py-2 pr-4">{p.email ?? "—"}</td>
                  <td className="py-2 pr-4">{p.telefono ?? "—"}</td>
                  <td className="py-2 pr-4">
                    <span
                      className={
                        p.activo ? "text-green-700" : "text-black/40"
                      }
                    >
                      {p.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="flex gap-3 py-2 pr-4">
                    <Link
                      href={`/propietarios/${p.id}`}
                      className="text-blue-700 hover:underline"
                    >
                      Editar
                    </Link>
                    <form
                      action={cambiarActivoPropietario.bind(
                        null,
                        p.id,
                        !p.activo
                      )}
                    >
                      <button
                        type="submit"
                        className="text-black/50 hover:underline"
                      >
                        {p.activo ? "Desactivar" : "Activar"}
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
