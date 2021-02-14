import {nodeResolve} from '@rollup/plugin-node-resolve'
import {terser} from 'rollup-plugin-terser'

const DEBUG = process.env.NODE_ENV !== 'production'

// generate config with given output name and plugins array
export default {
  input: 'src/main.js',

  output: [
    {
      file: 'build/core.js',
      format: 'iife',
      sourcemap: true,
    },
    DEBUG && {
      file: 'build/core.min.js',
      format: 'iife',
      plugins: [terser()],
    },
  ].filter(Boolean),

  plugins: [
    nodeResolve(),  // import NPM modules
  ],
}
