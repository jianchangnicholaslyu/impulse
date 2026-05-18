import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      __IMPULSE_PUBLIC_ENV__: JSON.stringify({})
    },
    server: {
      host: "0.0.0.0",
      port: 5173
    },
    preview: {
      host: "0.0.0.0",
      port: 4173
    }
  };
});
