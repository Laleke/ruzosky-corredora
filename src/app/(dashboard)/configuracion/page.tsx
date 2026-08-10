import { notFound } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { DatosCobranzaForm } from "@/features/empresa/datos-cobranza-form";
import { ActivarNotificaciones } from "@/features/notificaciones/activar-notificaciones";

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
      <PageHeader titulo="Configuración" descripcion="Datos de la corredora y avisos." />
      <div className="flex max-w-3xl flex-col gap-4">
        <DatosCobranzaForm empresa={empresa} />
        <ActivarNotificaciones />
      </div>
    </div>
  );
}
