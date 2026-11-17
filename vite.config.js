import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";

const hasCert =
  fs.existsSync("./cert/server.key") && fs.existsSync("./cert/server.crt");

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    https: hasCert
      ? {
          key: fs.readFileSync("./cert/server.key"),
          cert: fs.readFileSync("./cert/server.crt"),
        }
      : undefined,
  },
});
