import { fileURLToPath } from "node:url";
import process from "node:process";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const host = process.env.TAURI_DEV_HOST;
const ipcMock = fileURLToPath(new URL("./src/lib/ipc.mock.ts", import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  clearScreen: false,
  resolve: {
    alias: mode === "mock" ? [{ find: /^.*\/lib\/ipc$/, replacement: ipcMock }] : [],
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
}));
