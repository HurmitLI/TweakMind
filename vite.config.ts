import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const host = process.env.TAURI_DEV_HOST ?? "127.0.0.1";

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
    host,
    hmr: {
      protocol: "ws",
      host,
      port: 5174
    },
    watch: {
      ignored: ["**/src-tauri/target/**"]
    }
  }
});
