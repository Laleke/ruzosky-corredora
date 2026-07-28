/** Muestra un email largo permitiendo salto de línea justo antes del "@" en vez de un corte en medio de palabra. */
export function EmailTexto({ value }: { value: string }) {
  const arroba = value.indexOf("@");
  if (arroba === -1) return <>{value}</>;
  return (
    <span className="break-words">
      {value.slice(0, arroba)}
      <wbr />
      {value.slice(arroba)}
    </span>
  );
}
