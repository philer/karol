# Karol / Karl / Kerl / Clara / Finn / Phinn

## Usage

Download the latest [release](https://github.com/philer/karol/releases) and unpack it. Open the included `index.html` in a browser. It should just work.
If it doesn't, try a different browser.

### Configuration

Configuration is stored in `config.js`.

Translation files are stored in `localization/`.

Additionally, sprite themes are located in `img/`. Each theme has a `theme.js` which defines the exact sprites used.

### Compatibility

Current targets are up-to-date Firefox and Chrome. It probably works in latest Edge, too.

## Development

Dependencies and build tools are managed via `yarn` or `npm`. The following uses `yarn`, `npm` has mostly the same syntax.

1. Run `yarn` (or `npm install`) to install all development dependencies.
2. Run `yarn build` to build the bundles and `yarn dist` to generate minified bundles for production.
3. While editing use `yarn watch` for automatic bundle building. *Note: `index.html` links minified files by default.*
4. Run `yarn lint` to check syntax.

Check `package.json` for more commands under the `scripts` key.

### TODO

* [ ] fast/slow/instant builtins
* [ ] arguments for custom routines
* [ ] nested routines (scopes)
* [ ] extended world format for more block types
* [ ] resizable layout
* [ ] help
* [ ] fullscreen, screenshot
* [ ] recording
* [ ] more/better sprites
