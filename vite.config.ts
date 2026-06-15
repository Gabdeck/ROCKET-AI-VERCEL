import { defineConfig } from "@tanstack/react-start/config";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  tsr: {
    routesDirectory: "./src/routes",
    generatedRouteTree: "./src/routeTree.gen.ts",
  },
  vite: {
    plugins: [tailwindcss(), tsconfigPaths()],
    build: {
      chunkSizeWarningLimit: 1000,
    },
  },
  server: {
    preset: "vercel",
  },
});
