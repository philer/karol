import {readFileSync} from "fs"
import {nodeResolve} from "@rollup/plugin-node-resolve"
import typescript from "@rollup/plugin-typescript"
import json from "@rollup/plugin-json"
import html from "@rollup/plugin-html"
import postcss from "rollup-plugin-postcss"
import {terser} from "rollup-plugin-terser"

const DEBUG = process.env.NODE_ENV !== "production"

const indexHtml = readFileSync(`${__dirname}/index.html`, "utf8")

// generate config with given output name and plugins array
export default {
  input: "src/App.tsx",

  output: {
    dir: "build",
    entryFileNames: DEBUG ? "[name].js" : "[name].[hash].min.js",
    format: "iife",
    sourcemap: DEBUG,
  },

  plugins: [
    json(),
    nodeResolve({
      extensions: [".js", ".jsx", ".ts", ".tsx", ".json"],
    }),
    typescript({
      sourceMap: DEBUG,
      noEmitOnError: false,
    }),
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
    !DEBUG && terser(),
    !DEBUG && html({
      template: ({files: {js, css}}) =>
        indexHtml
          .replace(/^\s+/mg, "")
          .replace(
            /<!--\s*#ROLLUP_CSS.*?ROLLUP_CSS#\s*-->/s,
            css.map(({fileName}) => `<link rel="stylesheet" href="scripts/${fileName}" />`).join("\n"),
          )
          .replace(
            /<!--\s*#ROLLUP_JS.*?ROLLUP_JS#\s*-->/s,
            js.map(({fileName}) => `<script async src="scripts/${fileName}"></script>`).join("\n"),
          ),
    }),
  ],
}
