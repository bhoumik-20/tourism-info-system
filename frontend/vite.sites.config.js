import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  define: {
    "import.meta.env.VITE_API_BASE_URL": JSON.stringify("/api"),
    "import.meta.env.VITE_USE_MOCK_DATA": JSON.stringify("false"),
  },
  plugins: [react(), tailwindcss(), cloudflare({
    viteEnvironment: { name: "server" },
    inspectorPort: false,
    config: {
      name: "voyage-team",
      main: "./worker/index.js",
      compatibility_date: "2026-10-06",
      assets: { binding: "ASSETS", not_found_handling: "single-page-application", run_worker_first: ["/api/*"] },
    },
  })],
});
