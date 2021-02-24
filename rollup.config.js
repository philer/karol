import {nodeResolve} from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import json from "@rollup/plugin-json"
import postcss from "rollup-plugin-postcss"
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
    !DEBUG && {
      file: "build/core.min.js",
      format: "iife",
      plugins: [terser()],
    },
  ].filter(Boolean),

  plugins: [
    nodeResolve({
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    }),
    json(),
    postcss({
      extract: true,
      modules: {
        generateScopedName: DEBUG ? "[name]_[local]_[hash:base64:5]" : "[hash:base64:6]",
      },
      autoModules: false,
      minimize: !DEBUG,
      namedExports: true,
      // use: ['sass'],
    }),
    typescript({
      sourceMap: DEBUG,
      noEmitOnError: false,
    }),
  ],
}
