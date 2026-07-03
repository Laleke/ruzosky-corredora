/**
 * Exportación de reportes sin dependencias externas.
 *  - CSV: text/csv nativo.
 *  - Excel: HTML-table con extensión .xls y mime de Excel (lo abre nativo).
 *  - PDF: impresión del navegador (Guardar como PDF), igual que Liquidaciones.
 * Se ejecutan solo desde manejadores de cliente (usan Blob/DOM/window).
 */

export type TablaExport = {
  titulo: string;
  headers: string[];
  filas: (string | number)[][];
};

function descargar(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function celdaCSV(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function exportarCSV(tablas: TablaExport[], nombre: string) {
  const lineas: string[] = [];
  for (const t of tablas) {
    lineas.push(celdaCSV(t.titulo));
    lineas.push(t.headers.map(celdaCSV).join(";"));
    for (const f of t.filas) lineas.push(f.map(celdaCSV).join(";"));
    lineas.push("");
  }
  // BOM para que Excel lea acentos correctamente.
  const blob = new Blob(["﻿" + lineas.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  descargar(blob, `${nombre}.csv`);
}

function escapeHtml(v: string | number): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function exportarExcel(tablas: TablaExport[], nombre: string) {
  const secciones = tablas
    .map((t) => {
      const head = t.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("");
      const body = t.filas
        .map(
          (f) =>
            `<tr>${f
              .map((c) => `<td>${escapeHtml(c)}</td>`)
              .join("")}</tr>`
        )
        .join("");
      return `<h3>${escapeHtml(t.titulo)}</h3><table border="1">
        <thead><tr>${head}</tr></thead><tbody>${body}</tbody></table><br/>`;
    })
    .join("");

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
    xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"/></head><body>${secciones}</body></html>`;

  const blob = new Blob(["﻿" + html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  descargar(blob, `${nombre}.xls`);
}

export function exportarPDF() {
  window.print();
}
