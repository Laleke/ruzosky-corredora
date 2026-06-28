import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      {/* Panel de marca */}
      <div className="relative hidden flex-col justify-between bg-ink p-12 lg:flex">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-burgundy text-lg font-bold text-white">
            R
          </span>
          <div className="leading-tight">
            <p className="text-lg font-semibold text-white">Ruzosky</p>
            <p className="text-sm text-white/50">Corredora</p>
          </div>
        </div>
        <div>
          <h2 className="max-w-md text-3xl font-semibold leading-tight text-white">
            Administra tu cartera inmobiliaria en un solo lugar.
          </h2>
          <p className="mt-4 max-w-md text-white/60">
            Propiedades, contratos, arrendatarios y cobros, centralizados y al día.
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full"
          style={{ background: "radial-gradient(circle, #7c1d3f55, transparent 70%)" }}
        />
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-sm flex-col gap-8">
          <div className="flex items-center gap-2.5 lg:hidden">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-burgundy text-lg font-bold text-white">
              R
            </span>
            <span className="text-lg font-semibold text-ink">Ruzosky Corredora</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-ink">
              Iniciar sesión
            </h1>
            <p className="mt-1 text-sm text-muted">
              Ingresa tus credenciales para acceder al sistema.
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
