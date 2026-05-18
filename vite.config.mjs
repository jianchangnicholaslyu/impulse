import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    define: {
      __IMPULSE_PUBLIC_ENV__: JSON.stringify({
        NEXT_PUBLIC_TAWK_PROPERTY_ID: env.NEXT_PUBLIC_TAWK_PROPERTY_ID || "",
        NEXT_PUBLIC_TAWK_WIDGET_ID: env.NEXT_PUBLIC_TAWK_WIDGET_ID || ""
      })
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
