import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";
import { APP_NAME } from "@/config/constants";

export default async function LoginPage() {
  // Si ya hay sesión, no mostrar el login.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="flex w-full max-w-sm flex-col items-center gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{APP_NAME}</h1>
          <p className="text-sm opacity-60">Acceso al sistema</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
