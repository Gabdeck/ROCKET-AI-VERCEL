import { defineConfig } from "vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    tanstackStart({
      server: {
        preset: "vercel",
        entry: "src/server.ts",
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
  },
});
