import {nodeResolve} from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import {terser} from "rollup-plugin-terser"

const DEBUG = process.env.NODE_ENV !== "production"

// generate config with given output name and plugins array
export default {
  input: "src/App.tsx",

  output: [
    {
      file: "build/core.js",
      format: "iife",
      sourcemap: true,
    },
    DEBUG && {
      file: "build/core.min.js",
      format: "iife",
      plugins: [terser()],
    },
  ].filter(Boolean),

  plugins: [
    nodeResolve({
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    }),
    typescript({
      jsx: "react-jsx",
      jsxImportSource: "preact",
      sourceMap: DEBUG,
      noEmitOnError: false,
      lib: ["es5", "es6", "es2017", "dom"],
      target: "es2017",
    }),
  ],
}
