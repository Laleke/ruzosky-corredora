import { redirect } from "next/navigation";
import {
  getOpcionesRelacion,
  getContextoVigentePorPropiedad,
} from "@/features/documentos/queries";
import { DocumentoWizard } from "@/features/documentos/documento-wizard";
import { getCurrentProfile } from "@/lib/auth";

export default async function NuevoDocumentoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/documentos");

  const [opciones, contexto] = await Promise.all([
    getOpcionesRelacion(),
    getContextoVigentePorPropiedad(),
  ]);

  return (
    <DocumentoWizard opciones={opciones} empresaId={profile.empresa_id} contexto={contexto} />
  );
}
