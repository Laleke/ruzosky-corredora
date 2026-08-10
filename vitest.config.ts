import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

/**
 * Vitest no lee los `paths` del tsconfig, así que el alias `@/` hay que
 * declararlo acá: sin esto, cualquier módulo con test que importe otro con
 * `@/...` falla al resolver (primer caso: `features/contratos/vigencia.ts`).
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
