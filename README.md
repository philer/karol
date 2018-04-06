# Karol / Karl / Kerl / Clara / Finn / Phinn

## Usage

Copy the project and open `index.html` in a browser. It should just work.
If it doesn't, try a different browser.

## Configuration

Configuration is stored in `config.js`. Additionally, sprite themes are located in `img`. Each theme has a `theme.js` which defines the exact sprites used.

## Development

Dependencies and build tools are managed via `yarn` or `npm`. The following uses `yarn`, `npm` has mostly the same syntax.

1. Run `yarn` (or `npm install`) to install all development dependencies.

2. Run `yarn build` to build the bundles and `yarn dist` to generate minified bundles for production.

3. While editing use `yarn watch` for automatic bundle building.

4. Run `yarn lint` to check syntax.

Check `package.json` where these commands are defined, in case this gets outdated.

## TODO

* jump to current line
* fast/slow/instant
* routine arguments
* nested routines (scopes)

* save & load (program & world)

* localization

* extended tiles

* resizable layout

* recording

* fullscreen, screenshot

+ help
+ better steve


## Compatibility

I'm not quite sure which browsers are currently supported.
Current targets are up-to-date Firefox and Chrome as well as Internet Explore 11.

Required APIs:

* canvas: IE9+

* dataset: IE11+
