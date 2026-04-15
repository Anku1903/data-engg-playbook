import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import uploadPlugin from "./vite-plugins/upload-plugin";

export default defineConfig({
  plugins: [react(), uploadPlugin()],
  server: {
    port: 5173,
  },
});
