import {nodeResolve} from "@rollup/plugin-node-resolve"
import { babel } from "@rollup/plugin-babel"
import {terser} from "rollup-plugin-terser"

const DEBUG = process.env.NODE_ENV !== "production"

// generate config with given output name and plugins array
export default {
  input: "src/App.jsx",

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
      extensions: [".js", ".jsx", ".json"],
    }),
    babel({babelHelpers: "bundled"}),
  ],
}
