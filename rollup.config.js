import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
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
  plugins: plugins,
});

// plugins needed to run rollup with babel
const babelPlugins = [
  resolve(),
  commonjs({
    include: [
      'node_modules/**/*.js'
    ],
  }),
  babel({
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
  })
];

export default DEBUG ? [
  makeConfig("core", []),
  makeConfig("core-old-browsers", babelPlugins),
] : [
  makeConfig("core.min", [uglify()]),
  makeConfig("core-old-browsers.min", [...babelPlugins, uglify()]),
];
