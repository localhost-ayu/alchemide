import process from "node:process";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

const host = process.env.TAURI_DEV_HOST;
const ipcMock = fileURLToPath(new URL("./src/lib/ipc.mock.ts", import.meta.url));
const usesMockIpc = (mode: string) => mode === "mock" || mode === "test";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: usesMockIpc(mode) ? [{ find: /^.*\/lib\/ipc$/, replacement: ipcMock }] : [],
  },
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: "ws", host, port: 1421 } : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
  },
}));
