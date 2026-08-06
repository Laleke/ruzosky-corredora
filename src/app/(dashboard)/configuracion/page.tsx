import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { DatosCobranzaForm } from "@/features/empresa/datos-cobranza-form";

export default async function ConfiguracionPage() {
  const profile = await getCurrentProfile();
  if (!profile) notFound();

  const supabase = await createClient();
  const { data: empresa } = await supabase
    .from("empresas")
    .select("*")
    .eq("id", profile.empresa_id)
    .single();
  if (!empresa) notFound();

  return (
    <div>
      <PageHeader titulo="Configuración" descripcion="Datos de la corredora usados en los documentos." />
      <div className="max-w-3xl">
        <DatosCobranzaForm empresa={empresa} />
      </div>
    </div>
  );
}
