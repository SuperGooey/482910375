import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Served from a GitHub Pages project site (https://supergooey.github.io/482910375/),
// so all asset URLs need the repo name as a base path.
export default defineConfig({
  base: "/482910375/",
  plugins: [react(), tailwindcss()],
});
