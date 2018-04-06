import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import alias from 'rollup-plugin-alias';
import babel from 'rollup-plugin-babel';
import uglify from 'rollup-plugin-uglify';

const DEBUG = process.env.NODE_ENV !== 'production';

// generate config with given output name and plugins array
const makeConfig = (output, plugins) => ({
  input: 'src/main.js',
  output: {
    file: `build/${output}.js`,
    format: 'iife',
    sourcemap: DEBUG,
  },
  plugins: [
    alias({
      // allows tree-shaking imports, see https://fontawesome.com/how-to-use/use-with-node-js#tree-shaking
      '@fortawesome/fontawesome-free-solid': 'node_modules/@fortawesome/fontawesome-free-solid/shakable.es.js'
    }),
    resolve(),   // import NPM modules
    commonjs(),  // import commonJs bundled modules
    ...plugins,
  ],
});

// Plugin needed to run rollup with babel.
// This also requires the node-resolve and commonjs plugins.
const babelPlugin = babel({
  babelrc: true,
  comments: DEBUG,
  sourceMaps: DEBUG,
  exclude: 'node_modules/**',
  runtimeHelpers: true,
  externalHelpers: false,
  plugins: [
    "external-helpers",
    ["transform-runtime", {
      "helpers": false,
      "polyfill": false,
      "regenerator": true,
    }],
  ],
});

export default DEBUG ? [
  makeConfig("core", []),
  makeConfig("core-old-browsers", [babelPlugin]),
] : [
  makeConfig("core.min", [uglify()]),
  makeConfig("core-old-browsers.min", [babelPlugin, uglify()]),
];
