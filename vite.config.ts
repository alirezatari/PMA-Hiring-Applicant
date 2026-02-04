/* import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
 */

/* import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // این تنظیم باعث میشه که درخواست‌های /pmahiringservice به localhost:80 هدایت بشه
      "/pmahiringservice": {
        target: "http://localhost/pmahiringservice", // دامنه API
        //target: "https://pmaapi.partowpooyesh.ir",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          // path.replace(/^\/pmahiringservice/, "/pmahiringservice"),
          path.replace(/^\/pmahiringservice/, ""),
      },
    },
  },
});
 */

/* 
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

console.log("Base URL : ", process.env.VITE_API_BASE_URL);

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // این تنظیم باعث میشه که درخواست‌های /pmahiringservice به localhost:80 هدایت بشه
      "/api": {
        //target: "http://localhost/pmahiringservice", // دامنه API
        // target: process.env.VITE_API_BASE_URL, //"https://pmaapi.partowpooyesh.ir",
        target: "https://pmaapi.partowpooyesh.ir",
        changeOrigin: true,
        secure: false,
        rewrite: (path) =>
          // path.replace(/^\/pmahiringservice/, "/pmahiringservice"),
          path.replace(/^\/api/, "/api"),
      },
    },
  },
});
 */

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // env های مربوط به mode فعلی (development / production) رو می‌خونه
  const env = loadEnv(mode, process.cwd(), "");

  console.log("Base URL from loadEnv:", env.VITE_API_BASE_URL);

  return {
    plugins: [react()],
    server: {
      proxy: {
        "/api": {
          target: env.VITE_API_BASE_URL,
          changeOrigin: true,
          secure: false,
          // چون می‌خوای /api حفظ بشه، عملاً rewrite لازم نیست:
          // rewrite: (path) => path,
        },
      },
    },
  };
});
