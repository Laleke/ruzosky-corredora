import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getOpcionesRelacion } from "@/features/documentos/queries";
import { UploadForm } from "@/features/documentos/upload-form";
import { getCurrentProfile } from "@/lib/auth";
import { PageHeader } from "@/components/page-header";
import { ui } from "@/components/ui";

export default async function NuevoDocumentoPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");
  if (profile.rol !== "admin") redirect("/documentos");

  const opciones = await getOpcionesRelacion();

  return (
    <div>
      <Link href="/documentos" className={`${ui.btnGhost} mb-4`}>
        <ArrowLeft size={16} /> Volver
      </Link>
      <PageHeader
        titulo="Subir documento"
        descripcion="Adjunta el archivo y asócialo a la propiedad, contrato o persona correspondiente."
      />
      <div className={`${ui.card} p-6`}>
        <UploadForm opciones={opciones} empresaId={profile.empresa_id} />
      </div>
    </div>
  );
}
