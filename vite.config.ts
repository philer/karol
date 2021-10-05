import {defineConfig} from "vite"

export default defineConfig(({mode}) => ({
  base: "./",
  build: {
    target: "es2017",
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  css: {
    modules: {
      generateScopedName: mode === "development"
        ? "[name]_[local]_[hash:base64:5]"
        : "[hash:base64:6]",
    },
  },
}))
