import { RecuperarClaveForm } from "./recuperar-clave-form";

export default function RecuperarClavePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-burgundy px-6 py-12">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Recuperar contraseña
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Ingresa tu email y te enviaremos un link para definir una contraseña nueva.
          </p>
        </div>
        <RecuperarClaveForm />
      </div>
    </main>
  );
}
