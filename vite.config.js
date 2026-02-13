import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:8080", // 你的 Spring Boot 后端端口
        changeOrigin: true,
      },
    },
  },
});
