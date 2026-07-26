/**
 * Botón de submit con apariencia de switch on/off (verde=activo, gris=inactivo).
 * Se usa dentro de un <form action={...}> para activar/desactivar un registro.
 */
export function ToggleSwitch({ on, label }: { on: boolean; label: string }) {
  return (
    <button
      type="submit"
      aria-label={label}
      title={label}
      aria-pressed={on}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-emerald-400" : "bg-white/25"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
