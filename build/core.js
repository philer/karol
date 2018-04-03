(function () {
  'use strict';

  /**
   * Convenience abbreviation of document.getElementById
   */
  const byId = document.getElementById.bind(document);


  const resolveUrl = (function() {
    if (URL) {
      return url => (new URL(url, document.location)).href;
    }
    return function compatibleUrlResolver(url) {
      const a = document.createElement("a");
      a.href = url;
      return a.href;
    };
  })();

  /**
   * sleep function for use with await
   * @param  {int} ms
   * @return {Promise}
   */
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


  /**
   * Wrapper for Math.random to get ints
   * @param  {int} min
   * @param  {int} max
   * @return {int}
   */
  const rand = (min, max) => Math.floor(Math.random() * Math.floor(max)) + min;

  const cache = Object.create(null);

  /**
   * Global function will be called by JSONP style config files.
   * TODO: May need to adjust the name to something less prone to collisions.
   * @param  {mixed} data whatever the config file defines
   */
  window.config = function setConfigData(data) {
    cache[document.currentScript.src] = data;
  };

  /**
   * Load JSONP style configuration from .js files. This is necessary
   * so we can load config files in local context (file://).
   * @param  {String} url relative path to config .js file
   * @return {Promise}
   */
  function get(url) {
    url = resolveUrl(url);
    if (url in cache) {
      return Promise.resolve(cache[url]);
    }
    return new Promise(function(resolve, reject) {
      const script = document.createElement("script");
      script.onload = function() {
        resolve(cache[script.src]);
        script.remove();
      };
      script.onerror = function() {
        reject();
        script.remove();
      };
      document.head.appendChild(script);
      script.src = url;
    });
  }

  /*
   * A speed-improved perlin and simplex noise algorithms for 2D.
   *
   * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
   * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
   * Better rank ordering method by Stefan Gustavson in 2012.
   * Converted to Javascript by Joseph Gentle.
   *
   * Version 2012-03-09
   *
   * This code was placed in the public domain by its original author,
   * Stefan Gustavson. You may use it as you see fit, but
   * attribution is appreciated.
   *
   *
   * https://github.com/josephg/noisejs
   *
   * [modified by Philipp Miller to work as an ES module]
   */

  /* eslint-disable */


  function Grad(x, y, z) {
    this.x = x; this.y = y; this.z = z;
  }

  Grad.prototype.dot2 = function(x, y) {
    return this.x*x + this.y*y;
  };

  Grad.prototype.dot3 = function(x, y, z) {
    return this.x*x + this.y*y + this.z*z;
  };

  var grad3 = [new Grad(1,1,0),new Grad(-1,1,0),new Grad(1,-1,0),new Grad(-1,-1,0),
               new Grad(1,0,1),new Grad(-1,0,1),new Grad(1,0,-1),new Grad(-1,0,-1),
               new Grad(0,1,1),new Grad(0,-1,1),new Grad(0,1,-1),new Grad(0,-1,-1)];

  var p = [151,160,137,91,90,15,
  131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,240,21,10,23,
  190, 6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,33,
  88,237,149,56,87,174,20,125,136,171,168, 68,175,74,165,71,134,139,48,27,166,
  77,146,158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,
  102,143,54, 65,25,63,161, 1,216,80,73,209,76,132,187,208, 89,18,169,200,196,
  135,130,116,188,159,86,164,100,109,198,173,186, 3,64,52,217,226,250,124,123,
  5,202,38,147,118,126,255,82,85,212,207,206,59,227,47,16,58,17,182,189,28,42,
  223,183,170,213,119,248,152, 2,44,154,163, 70,221,153,101,155,167, 43,172,9,
  129,22,39,253, 19,98,108,110,79,113,224,232,178,185, 112,104,218,246,97,228,
  251,34,242,193,238,210,144,12,191,179,162,241, 81,51,145,235,249,14,239,107,
  49,192,214, 31,181,199,106,157,184, 84,204,176,115,121,50,45,127, 4,150,254,
  138,236,205,93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180];
  // To remove the need for index wrapping, double the permutation table length
  var perm = new Array(512);
  var gradP = new Array(512);

  // This isn't a very good seeding function, but it works ok. It supports 2^16
  // different seed values. Write something better if you need more seeds.
  function seed(seed) {
    if(seed > 0 && seed < 1) {
      // Scale the seed out
      seed *= 65536;
    }

    seed = Math.floor(seed);
    if(seed < 256) {
      seed |= seed << 8;
    }

    for(var i = 0; i < 256; i++) {
      var v;
      if (i & 1) {
        v = p[i] ^ (seed & 255);
      } else {
        v = p[i] ^ ((seed>>8) & 255);
      }

      perm[i] = perm[i + 256] = v;
      gradP[i] = gradP[i + 256] = grad3[v % 12];
    }
  }
  seed(0);

  /*
  for(var i=0; i<256; i++) {
    perm[i] = perm[i + 256] = p[i];
    gradP[i] = gradP[i + 256] = grad3[perm[i] % 12];
  }*/

  // Skewing and unskewing factors for 2, 3, and 4 dimensions
  var F2 = 0.5*(Math.sqrt(3)-1);
  var G2 = (3-Math.sqrt(3))/6;

  // 2D simplex noise
  function simplex2(xin, yin) {
    var n0, n1, n2; // Noise contributions from the three corners
    // Skew the input space to determine which simplex cell we're in
    var s = (xin+yin)*F2; // Hairy factor for 2D
    var i = Math.floor(xin+s);
    var j = Math.floor(yin+s);
    var t = (i+j)*G2;
    var x0 = xin-i+t; // The x,y distances from the cell origin, unskewed.
    var y0 = yin-j+t;
    // For the 2D case, the simplex shape is an equilateral triangle.
    // Determine which simplex we are in.
    var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
    if(x0>y0) { // lower triangle, XY order: (0,0)->(1,0)->(1,1)
      i1=1; j1=0;
    } else {    // upper triangle, YX order: (0,0)->(0,1)->(1,1)
      i1=0; j1=1;
    }
    // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
    // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
    // c = (3-sqrt(3))/6
    var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
    var y1 = y0 - j1 + G2;
    var x2 = x0 - 1 + 2 * G2; // Offsets for last corner in (x,y) unskewed coords
    var y2 = y0 - 1 + 2 * G2;
    // Work out the hashed gradient indices of the three simplex corners
    i &= 255;
    j &= 255;
    var gi0 = gradP[i+perm[j]];
    var gi1 = gradP[i+i1+perm[j+j1]];
    var gi2 = gradP[i+1+perm[j+1]];
    // Calculate the contribution from the three corners
    var t0 = 0.5 - x0*x0-y0*y0;
    if(t0<0) {
      n0 = 0;
    } else {
      t0 *= t0;
      n0 = t0 * t0 * gi0.dot2(x0, y0);  // (x,y) of grad3 used for 2D gradient
    }
    var t1 = 0.5 - x1*x1-y1*y1;
    if(t1<0) {
      n1 = 0;
    } else {
      t1 *= t1;
      n1 = t1 * t1 * gi1.dot2(x1, y1);
    }
    var t2 = 0.5 - x2*x2-y2*y2;
    if(t2<0) {
      n2 = 0;
    } else {
      t2 *= t2;
      n2 = t2 * t2 * gi2.dot2(x2, y2);
    }
    // Add contributions from each corner to get the final noise value.
    // The result is scaled to return values in the interval [-1,1].
    return 70 * (n0 + n1 + n2);
  }

  /**
   * Basic isometric graphics inspired by Karol.
   *
   * Potential optimizations:
   * - draw on hidden canvas
   * - background/floor caching
   * - multiple canvas layers
   */

  const DEFAULT_THEME_DIR = "img/simple/";

  // themes should provide their own settings
  const DEFAULT_SETTINGS = {
    tile_width: 64,
    tile_depth: 32,
    block_height: 16,
    player_height: 128,
    tile_gap: 2,
    tile_gap_z: 1,
    noise_amplifier: 1,
  };

  const ORIENTATIONS = ["south", "east", "north", "west"];
  const PLAYER_SPRITE_NAMES = ORIENTATIONS.map(str => "player_" + str);
  const TILE_SPRITE_NAMES = ["floor", "block", "mark", "cuboid"];

  // drawable objects
  const sprites  = {};

  const imageCache = Object.create(null);

  let tileWidth, tileDepth, blockHeight,
      tileGap, tileGapZ, noiseAmplifier,
      playerHeight;

  let canvas;
  let ctx;

  let _showPlayer = true;
  let _showHeightNoise = true;

  function showPlayer(show=true) {
    _showPlayer = show;
  }

  function showHeightNoise(show=true) {
    _showHeightNoise = show;
  }

  /**
   * Initialize the module. Loads graphics.
   * @return {Promise}
   */
  function init(cfg) {
    return Promise.all([initSprites(cfg), initCanvas()]);
  }

  /**
   * Prepare canvas and drawing context
   * @return {Promise}
   */
  async function initCanvas() {
    canvas = document.getElementById("world-canvas");
    ctx = canvas.getContext("2d");
    ctx.mozImageSmoothingEnabled = false;
    ctx.webkitImageSmoothingEnabled = false;
    ctx.msImageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
  }

  /**
   * Load sprite theme including fallbacks
   * @param  {Object} cfg
   * @return {Promise}
   */
  async function initSprites(cfg) {
    const tileThemeDir = cfg.tile_theme + "/";
    const playerThemeDir = (cfg.player_theme || cfg.tile_theme) + "/";

    const [tileTheme, playerTheme, defaultTheme] = await Promise.all([
        tileThemeDir + "theme.js",
        playerThemeDir + "theme.js",
        DEFAULT_THEME_DIR + "theme.js",
      ].map(get));

    const sizes = Object.assign({}, DEFAULT_SETTINGS, tileTheme);
    tileWidth      = sizes.tile_width;
    tileDepth      = sizes.tile_depth;
    blockHeight    = sizes.block_height;
    tileGap        = sizes.tile_gap;
    tileGapZ       = sizes.tile_gap_z;
    noiseAmplifier = sizes.noise_amplifier;
    playerHeight   = playerTheme.player_height || sizes.player_height;

    for (const key of PLAYER_SPRITE_NAMES) {
      if (playerTheme.sprites.hasOwnProperty(key)) {
        sprites[key] = createSprite(key, playerTheme, playerThemeDir);
      } else if (tileTheme.sprites.hasOwnProperty(key)) {
        sprites[key] = createSprite(key, tileTheme, tileThemeDir);
      } else {
        sprites[key] = createSprite(key, defaultTheme, DEFAULT_THEME_DIR);
      }
    }
    for (const key of TILE_SPRITE_NAMES) {
      if (tileTheme.sprites.hasOwnProperty(key)) {
        sprites[key] = createSprite(key, tileTheme, tileThemeDir);
      } else {
        sprites[key] = createSprite(key, defaultTheme, DEFAULT_THEME_DIR);
      }
    }
    return Promise.all(Object.values(sprites).map(sprite => sprite.load()));
  }

  function createSprite(spriteName, theme, themeDir) {
    let filename, crop;
    try {
      [filename, ...crop] = theme.images[theme.sprites[spriteName]];
    } catch (err) {
      console.warn(`Bad theme config: No image for sprite '${spriteName}' in ${themeDir}`);
      return;
    }
    if (crop.length) {
      return new AtlasSprite(themeDir + filename, ...crop);
    } else {
      return new Sprite(themeDir + filename);
    }
  }

  /**
   * Things that can be drawn on the canvas.
   * Allows preloading images.
   */
  class Sprite {
    constructor(imagePath) {
      this.imagePath = imagePath;
    }
    async load() {
      this._image = await loadImage(this.imagePath);
      const scale = tileWidth / this._image.width;
      this._scaledWidth = tileWidth;
      this._scaledHeight = scale * this._image.height;
      this.height = this._scaledHeight - tileDepth;
    }
    draw(ctx, x, y) {
      ctx.drawImage(this._image,
                    x, y - this.height,
                    this._scaledWidth, this._scaledHeight);
    }
  }

  /**
   * Things that can be drawn on the canvas from a sprite sheet / atlas.
   * Allows preloading.
   */
  class AtlasSprite {
    constructor(imagePath, x, y, width, height, xOffset=0, yOffset=0) {
      this.imagePath = imagePath;
      this._crop = {x, y, width, height};
      const scale = tileWidth / width;
      this._scaledWidth = tileWidth;
      this._scaledHeight = scale * height;
      this.height = this._scaledHeight - tileDepth;
      this.xOffset = xOffset;
      this.yOffset = yOffset;
    }
    async load() {
      this._image = await loadImage(this.imagePath);
    }
    draw(ctx, x, y) {
      ctx.drawImage(this._image,
                    this._crop.x, this._crop.y,
                    this._crop.width, this._crop.height,
                    x + this.xOffset, y - this.height - this.yOffset,
                    this._scaledWidth, this._scaledHeight);
    }
  }

  function loadImage(path) {
    if (path in imageCache) {
      return imageCache[path];
    }
    return imageCache[path] = new Promise(function(resolve) {
      const image = new Image();
      image.onload = function() {
        resolve(image);
      };
      image.src = path;
    });
  }


  /**
   * Draw a given game state to the canvas
   * @param  {Object} options.world   {width, length, height}
   * @param  {Object} options.player   {x, y, orientation}
   * @param  {Array}  options.tiles   tiles data
   * @return {undefined}
   */
  function render({width, length, height, player, tiles, seed: seed$$1}) {
    let w = (width + length) * 0.5 * (tileWidth + 2 * tileGap);
    let h = (width + length) * 0.5 * (tileDepth + 1 * tileGap)
          + height * blockHeight + playerHeight;

    if (canvas.width !== w) {
      canvas.width = w;
    }
    if (canvas.height !== h) {
      canvas.height = h;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (_showHeightNoise) {
      seed(seed$$1);
    }

    const canvas00X = 0.5 * (length - 1) * (tileWidth + 2 * tileGap);
    let canvasX, canvasY, z;

    for (let x = 0 ;  x < width ; ++x) {
      for (let y = 0 ; y < length ; ++y) {
        canvasX = (-y + x) * 0.5 * (tileWidth + 2 * tileGap)
                + tileGap
                + canvas00X;
        canvasY = (y + x) * 0.5 * (tileDepth + 1 * tileGap)
                - 0.5 * tileGap
                + height * blockHeight
                + playerHeight;

        const tile = tiles[x * length + y];

        z = 0;
        if (_showHeightNoise) {
          z += 5 * noiseAmplifier * simplex2(x / 10, y / 10)
                 + noiseAmplifier * simplex2(x / 3, y / 3);
        }

        sprites.floor.draw(ctx, canvasX, canvasY - z);
        z += sprites.floor.height + tileGapZ;
        if (tile.cuboid) {
          sprites.cuboid.draw(ctx, canvasX, canvasY - z);
          z += sprites.cuboid.height + tileGapZ;
        } else {
          for (let layer = 0 ; layer < tile.blocks ; ++layer) {
            sprites.block.draw(ctx, canvasX, canvasY - z);
            z += sprites.block.height + tileGapZ;
          }
          if (tile.mark) {
            sprites.mark.draw(ctx, canvasX, canvasY - z);
            z += sprites.mark.height + tileGapZ;
          }
        }
        if (_showPlayer && player.x === x && player.y === y) {
          sprites["player_" + ORIENTATIONS[player.orientation]].draw(
              ctx, canvasX, canvasY - z);
        }
        // ctx.fillText(x + "," + y, canvasX+.4*tileWidth, canvasY);
      }
    }
  }

  const nativeSymbols = {
    "linksdrehen":   "turnLeft",
    "rechtsdrehen":  "turnRight",
    "schritt":       "step",
    "schrittzurück": "stepBackwards",
    "hinlegen":      "placeBlock",
    "aufheben":      "takeBlock",
    "markesetzen":   "placeMark",
    "markelöschen":  "takeMark",

    "istwand":       "isLookingAtEdge",
  };

  let world;
  let delay_ms = 100;

  function setSpeed(speed) {
    delay_ms = Math.pow(10, 4 - speed);
  }

  function redraw() {
    render(world);
  }

  function setWorld(newWorld) {
    world = newWorld;
    redraw();
  }

  async function execute(identifier, ignore_delay=false) {
    const methodName = nativeSymbols[identifier.toLowerCase()];
    if (!methodName) {
      throw new Error(`RunTime Error: ${identifier} is not defined.`);
    }
    world[methodName]();
    redraw();

    if (!ignore_delay) {
      await sleep(delay_ms);
    }
  }

  function evaluate(identifier) {
    const methodName = nativeSymbols[identifier.toLowerCase()];
    if (!methodName) {
      throw new Error(`RunTime Error: ${identifier} is not defined.`);
    }
    return world[methodName]();
  }

  var simulation = /*#__PURE__*/Object.freeze({
    setSpeed: setSpeed,
    redraw: redraw,
    setWorld: setWorld,
    execute: execute,
    evaluate: evaluate
  });

  class World {

    constructor(width, length, height, seed, player, tiles) {
      this.width = width;
      this.length = length;
      this.height = height;
      this.seed = seed || rand(1<<31, -(1<<31));
      this.player = player || {x: 0, y: 0, orientation: 0};
      this.tiles = tiles || Array.from({length: width * length},
                                       () => ({blocks: 0, mark: false}));
    }


    /**
     * Get coordinates of tile by offset from player position.
     * @param  {int} options.x           current location
     * @param  {int} options.y           current location y
     * @param  {int} options.orientation forward direction
     * @param  {int} forward             forward offset
     * @param  {int} left                sideways offset
     * @return {Array}                   [x, y] coordinates of target tile
     */
    static move({x, y, orientation}, forward=1, left=0) {
      switch (orientation) {
        case 0: x += left; y += forward; break;
        case 1: x += forward; y += left; break;
        case 2: x -= left; y -= forward; break;
        case 3: x -= forward; y -= left; break;
      }
      return [x, y];
    }


    contains(x, y) {
      return x >= 0 && y >= 0 && x < this.width && y < this.length;
    }

    isLookingAtEdge() {
      return !this.contains(...World.move(this.player));
    }


    step(forward=1, left=0) {
      const z = this.tiles[this.player.x * this.length + this.player.y].blocks;
      const [x, y] = World.move(this.player, forward, left);
      if (!this.contains(x, y)) {
        throw new Error("invalid move: out of world");
      }
      const targetTile = this.tiles[x * this.length + y];
      if (1 < Math.abs(z - targetTile.blocks)) {
        throw new Error("invalid move: jump too high");
      }
      if (targetTile.cuboid) {
        throw new Error("invalid move: cuboid");
      }
      [this.player.x, this.player.y] = [x, y];
    }

    stepBackwards() {
      this.step(-1);
    }


    turnLeft() {
      this.player.orientation = (this.player.orientation + 1) % 4;
    }

    turnRight() {
      this.player.orientation = (this.player.orientation + 3) % 4;
    }


    placeBlock() {
      const [x, y] = World.move(this.player);
      if (!this.contains(x, y)) {
        throw new Error("invalid action: out of world");
      }
      const targetTile = this.tiles[x * this.length + y];
      if (targetTile.cuboid) {
        throw new Error("invalid action: block on cuboid");
      }
      if (targetTile.blocks >= this.height) {
        throw new Error("invalid action: building too high");
      }
      targetTile.blocks++;
    }

    takeBlock() {
      const [x, y] = World.move(this.player);
      if (!this.contains(x, y)) {
        throw new Error("invalid action: out of world");
      }
      const targetTile = this.tiles[x * this.length + y];
      if (targetTile.blocks <= 0) {
        throw new Error("invalid action: no blocks");
      }
      targetTile.blocks--;
    }


    placeMark() {
      const targetTile = this.tiles[this.player.x * this.length + this.player.y];
      // can't stand on cuboid -> no need to check
      if (targetTile.mark) {
        throw new Error("invalid action: already has a mark");
      }
      targetTile.mark = true;
    }

    takeMark() {
      const targetTile = this.tiles[this.player.x * this.length + this.player.y];
      if (!targetTile.mark) {
        throw new Error("invalid action: no mark");
      }
      targetTile.mark = false;
    }
  }

  const MAX_RECURSION_DEPTH = 10;

  // token types
  const IDENTIFIER = "IDENTIFIER";
  const INTEGER = "INTEGER";
  const NOT = "NOT";

  const IF = "IF";
  const THEN = "THEN";
  const ELSE = "ELSE";
  const WHILE = "WHILE";
  const DO = "DO";
  const REPEAT = "REPEAT";
  const TIMES = "TIMES";
  const PROGRAM = "PROGRAM";
  const ROUTINE = "ROUTINE";

  const LPAREN = "LPAREN";
  const RPAREN = "RPAREN";
  const DOT = "DOT";
  const ASTERISC = "ASTERISC";

  const WHITESPACE = "WHITESPACE";
  const EOF = "EOF";

  const TokenTypes = Object.freeze({
    IDENTIFIER, INTEGER, NOT,
    IF, THEN, ELSE, WHILE, DO, REPEAT, TIMES,
    PROGRAM, ROUTINE,
    LPAREN, RPAREN, DOT, ASTERISC,
    WHITESPACE, EOF,
  });

  class Token {
    constructor(type, value) {
      this.type = type;
      this.value = value;
    }
    toString() {
      return this.type + "(" + this.value + ")";
    }
  }

  const keywordTokenTypes = {
    "wenn":       IF,
    "if":         IF,
    "dann":       THEN,
    "then":       THEN,
    "sonst":      ELSE,
    "else":       ELSE,
    "solange":    WHILE,
    "while":      WHILE,
    "tue":        DO,
    "do":         DO,
    "nicht":      NOT,
    "not":        NOT,
    "wiederhole": REPEAT,
    "repeat":     REPEAT,
    "mal":        TIMES,
    "times":      TIMES,
    "programm":   PROGRAM,
    "program":    PROGRAM,
    "anweisung":  ROUTINE,
    "routine":    ROUTINE,
  };
  const keywords = Object.keys(keywordTokenTypes);

  const symbolTokenTypes = {
    "(": LPAREN,
    ")": RPAREN,
    ".": DOT,
    "*": ASTERISC,
  };
  const symbols = Object.keys(symbolTokenTypes);



  const reSpace = /\s/;
  const reDigit = /[0-9]/;
  const reLetter = /[A-Za-z_]/i;

  /**
   * Iterable lexer
   */
  class TokenIterator {

    constructor(text, includeWhitespace=false) {
      this.text = text;
      this.includeWhitespace = includeWhitespace;
      this.position = 0;
      this.line = 1;
    }

    /**
     * @return {Iterator} this
     */
    [Symbol.iterator]() {
      return this;
    }

    /**
     * Implement iterator protocol
     * @return {Object}
     */
    next() {
      const token = this.nextToken();
      if (token.type === EOF) {
        return {done: true};
      }
      return {value: token, done: false};
    }

    /**
     * Read the next token, forwarding the internal position
     * accordingly.
     * @return {Token}
     */
    nextToken() {
      // eat whitespace, stop when we're done.
      let whitespace = "";
      while (this.position < this.text.length
             && reSpace.test(this.text[this.position])) {
        whitespace += this.text[this.position];
        if (this.text[this.position] === "\n") {
          this.line++;
        }
        this.position++;
      }
      if (whitespace.length && this.includeWhitespace) {
        return new Token(WHITESPACE, whitespace);
      }

      // read special character token
      const symbol = this.text[this.position];
      if (symbols.includes(symbol)) {
        this.position++;
        return new Token(symbolTokenTypes[symbol], symbol);
      }

      // read integer token
      let integer = "";
      while (this.position < this.text.length
             && reDigit.test(this.text[this.position])) {
        integer += this.text[this.position];
        this.position++;
      }
      if (integer.length) {
        return new Token(INTEGER, +integer);
      }

      // read word token
      let word = "";
      while (this.position < this.text.length
             && reLetter.test(this.text[this.position])) {
        word += this.text[this.position];
        this.position++;
      }
      if (word.length) {
        const lowercase = word.toLowerCase();
        if (keywords.includes(lowercase)) {
          return new Token(keywordTokenTypes[lowercase], word);
        } else {
          return new Token(IDENTIFIER, word);
        }
      }

      // end of file
      if (this.position >= this.text.length) {
        return new Token(EOF);
      }

      // found nothing useful
      throw new Error("Syntax Error on line "
                      + this.line
                      + ": Could not read next token at offset "
                      + this.position);
    }
  }


  class Parser {
    constructor(tokens) {
      this.tokens = tokens;
      this.depth = 0;
      this.forward();
    }

    forward() {
      this.currentToken = this.tokens.nextToken();
    }

    eat(type) {
      if (this.currentToken.type !== type) {
        throw new Error("Syntax Error on line "
                        + this.tokens.line
                        + ": Unexpected token " + this.currentToken
                        + ", was expecting " + type + ".");
      }
      this.forward();
    }

    readToken(...validTypes) {
      if (validTypes.includes(this.currentToken.type)) {
        const value = this.currentToken.value;
        this.forward();
        return value;
      }
      throw new Error("Syntax Error on line "
                      + this.tokens.line
                      + ": Unexpected token "
                      + this.currentToken
                      + ". Expected any of " + validTypes);
    }

    readExpression() {
      switch (this.currentToken.type) {

        case IDENTIFIER: {
          return this.readCall();
        }
        case INTEGER: {
          const value = +this.currentToken.value;
          this.forward();
          return {type: INTEGER, value};
        }
        case NOT: {
          this.forward();
          return {type: NOT, expression: this.readExpression()};
        }
        case LPAREN: {
          const expr = this.readExpression();
          this.eat(RPAREN);
          return expr;
        }
      }
    }

    readCall() {
      const call = {
        type: IDENTIFIER,
        identifier: this.currentToken.value,
      };
      this.forward();
      if (this.currentToken.type === LPAREN) {
        this.forward();
        if (this.currentToken.type === RPAREN) {
          this.forward();
        } else {
          call.argument = this.readExpression();
          this.eat(RPAREN);
        }
      }
      return call;
    }

    readSequence() {
      const statements = [];
      const endTokens = [ASTERISC, ELSE, EOF];
      this.depth++;
      while (!endTokens.includes(this.currentToken.type)) {
        statements.push(this.readStatement());
      }
      this.depth--;
      return statements;
    }

    readStatement() {
      const statement = {type: this.currentToken.type};
      switch (this.currentToken.type) {
        case IDENTIFIER:
          return this.readCall();

        case IF:
          this.forward();
          statement.condition = this.readExpression();
          this.eat(THEN);
          statement.sequence = this.readSequence();
          if (this.currentToken.type === ELSE) {
            this.forward();
            statement.alternative = this.readSequence();
          }
          this.eat(ASTERISC);
          this.eat(IF);
          return statement;

        case WHILE:
          this.forward();
          statement.condition = this.readExpression();
          this.eat(DO);
          statement.sequence = this.readSequence();
          this.eat(ASTERISC);
          this.eat(WHILE);
          return statement;

        case REPEAT:
          this.forward();
          if (this.currentToken.type === WHILE) {
            statement.type = WHILE;
            this.forward();
            statement.condition = this.readExpression();
          } else {
            statement.count = this.readExpression();
            this.eat(TIMES);
          }
          statement.sequence = this.readSequence();
          this.eat(ASTERISC);
          this.eat(REPEAT);
          return statement;

        case PROGRAM:
          if (this.depth > 1) {
            throw new Error("Parse Error on line "
                            + this.tokens.line
                            + ": Can't define program in nested context.");
          }
          this.forward();
          statement.sequence = this.readSequence();
          this.eat(ASTERISC);
          this.eat(PROGRAM);
          return statement;

        case ROUTINE:
          if (this.depth > 1) {
            throw new Error("Parse Error on line "
                            + this.tokens.line
                            + ": Can't define routine in nested context.");
          }
          this.forward();
          statement.identifier = this.readToken(IDENTIFIER);
          statement.sequence = this.readSequence();
          this.eat(ASTERISC);
          this.eat(ROUTINE);
          return statement;
      }
      throw new Error("Parse Error on line "
                      + this.tokens.line
                      + " while parsing token "
                      + this.currentToken
                      + ": I have no idea what happened.");
    }
  }


  /**
   * Run a program upon the world simulation.
   * More specifically, interpret a given AST and
   * yield actions for each step that may be executed
   * in their own time by a RunTime.
   *
   * TODO runtime/scopes
   */
  class Interpreter {

    /**
     * Create a new program iteration
     * @param  {RunTime} runtime  simulated machine/world
     */
    constructor(runtime) {
      this.runtime = runtime;
      this.routines = Object.create(null);
    }

    interrupt() {
      this._interrupted = true;
    }

    async run(text) {
      const tokens = new TokenIterator(text);
      const parser = new Parser(tokens);
      const ast = parser.readSequence();
      this._interrupted = false;
      await this.visitSequence(ast);
    }

    async visitSequence(sequence) {
      for (const statement of sequence) {
        await this.visitStatement(statement);
      }
    }

    async visitStatement(statement) {
      switch (statement.type) {
        case IDENTIFIER:
          if (this._interrupted) {
            return;
          }
          if (statement.identifier in this.routines) {
            if (this.depth > MAX_RECURSION_DEPTH) {
              throw new Error("RunTime Error: Maximum recursion depth (" + MAX_RECURSION_DEPTH + ") exceeded.");
            }
            await this.visitSequence(
                          this.routines[statement.identifier]);
          } else {
            await this.runtime.execute(statement.identifier);
          }
          break;

        case IF:
          if (await this.visitExpression(statement.condition)) {
            await this.visitSequence(statement.sequence);
          } else if (statement.alternative) {
            await this.visitSequence(statement.alternative);
          }
          break;

        case WHILE:
          while (await this.visitExpression(statement.condition)) {
            await this.visitSequence(statement.sequence);
          }
          break;

        case REPEAT: {
          const count = await this.visitExpression(statement.count);
          for (let i = 0 ; i < count ; i++) {
            await this.visitSequence(statement.sequence);
          }
          break;
        }

        case PROGRAM:
          await this.visitSequence(statement.sequence);
          break;

        case ROUTINE:
          this.routines[statement.identifier] = statement.sequence;
          break;

        default:
          throw new Error(`Unimplemented statement type ${statement.type}`);
      }
    }

    async visitExpression(expression) {
      switch (expression.type) {
        case INTEGER:
          return +expression.value;

        case IDENTIFIER:
          return this.runtime.evaluate(expression.identifier);

        case NOT:
          return ! await this.visitExpression(expression.expression);

        default:
          throw new Error("Unimplemented expression type");
      }
    }
  }

  /**
   * Map TokenTypes to css class names
   */
  const ttClasses = Object.create(null);

  ttClasses[TokenTypes.IDENTIFIER] = "identifier";
  ttClasses[TokenTypes.INTEGER] =  "number";
  [
    TokenTypes.NOT,
    TokenTypes.IF,
    TokenTypes.THEN,
    TokenTypes.ELSE,
    TokenTypes.WHILE,
    TokenTypes.DO,
    TokenTypes.REPEAT,
    TokenTypes.TIMES,
    TokenTypes.PROGRAM,
    TokenTypes.ROUTINE,
  ].forEach(tt => ttClasses[tt] = "keyword");
  [
    TokenTypes.LPAREN,
    TokenTypes.RPAREN,
    TokenTypes.DOT,
    TokenTypes.ASTERISC,
  ].forEach(tt => ttClasses[tt] = "punctuation");


  /**
   * Add syntax highlighting HTML tags to given code snippet.
   * @param  {String} text code
   * @return {String}      code with tokens wrapped in HTML tags
   */
  function highlight(text) {
    let html = "";
    for (const token of new TokenIterator(text, true)) {
      if (token.type in ttClasses) {
        html += `<span class="token ${ttClasses[token.type]}">${token.value}</span>`;
      } else {
        html += token.value;
      }
    }
    return html;
  }

  class Editor {

    constructor() {
      this.textarea = byId("editor-textarea");
      this.highlighted = byId("editor-highlight");

      this.textarea.addEventListener("input", this.update.bind(this));
      //  more events: paste propertychange
    }

    get value() {
      return this.textarea.value;
    }
    set value(text) {
      this.textarea.value = text;
      this.update();
    }

    update() {
      this.highlighted.innerHTML = highlight(this.textarea.value);
      this.textarea.style.height = this.highlighted.offsetHeight + "px";
    }
  }

  var editor = new Editor();

  /**
   * Read a .kdw file
   * @param  {File} file DOM file (from input[type="filel"])
   * @return {Promise} resolves with text content
   */
  function readKdwFile(file) {
    return readFile(file).then(parseKdw);
  }

  /**
   * Read a text file (e.g. .kdw file)
   * @param  {File} file DOM file (from input[type="filel"])
   * @return {Promise} resolves with text content
   */
  function readFile(file) {
    return new Promise(function(resolve) {
      const reader = new FileReader();
      reader.onload = function() {
        resolve(reader.result);
      };
      reader.readAsText(file);
    });
  }


  /**
   * Parse text from a *.kdw file and return a valid game state object
   * @param  {String} kdw contents of a .kdw file
   * @return {Object} game state
   */
  function parseKdw(kdw) {
    const parts = kdw.split(/\s+/);
    const [width, length, height,
           playerX, playerY, orientation] = parts.slice(1, 7).map(x => +x);
    const tiles = [];
    for (let xy = 0 ; xy < width * length ; xy++) {
      const offset = 7 + (height + 1) * xy;
      const colData = parts.slice(offset, offset + height + 1);
      const tile = {
        blocks: colData.filter(s => s === "z").length,
        mark: colData[colData.length - 1] === "m",
      };
      if (colData.includes("q")) {
        tile.cuboid = true;
      }
      /*else if (playerX * length + playerY === xy) {
        tile.player = true;
      }*/
      tiles.push(tile);
    }
    return new World(width, length, height, 0,
                     {x: playerX, y: playerY, orientation},  // player
                     tiles);
  }

  const keyMap = {
    "ArrowLeft":  "LinksDrehen",
    "a":          "LinksDrehen",
    "ArrowRight": "RechtsDrehen",
    "d":          "RechtsDrehen",
    "ArrowUp":    "Schritt",
    "w":          "Schritt",
    "ArrowDown":  "SchrittZurück",
    "s":          "SchrittZurück",
    "h":          "Hinlegen",
    "H":          "Aufheben",
    "m":          "MarkeSetzen",
    "M":          "MarkeLöschen",
  };


  const widthInput = byId("width-input");
  const lengthInput = byId("length-input");
  const heightInput = byId("height-input");
  const fileInput = byId("file-input");
  const simSpeedInput = byId("world-simulation-speed");
  const showPlayerCheckbox = byId("world-show-player");
  const showFlatWorldCheckbox = byId("world-show-flat");
  const statusOutput = byId("status-text");
  // const debugOutput = byId("debug-text");


  function resetSimulation(evt) {
    if (evt) evt.preventDefault();
    setWorld(new World(+widthInput.value,
                                  +lengthInput.value,
                                  +heightInput.value));
  }

  function loadWorld(evt) {
    if (evt) evt.preventDefault();
    readKdwFile(fileInput.files[0]).then(setWorld);
  }

  function init$1(/* cfg */) {

    // world creation/loading
    byId("world-create-form").addEventListener("submit", resetSimulation);
    byId("world-load-form").addEventListener("submit", loadWorld);
    fileInput.addEventListener("change", loadWorld);

    // view settings
    showPlayerCheckbox.addEventListener("change", function() {
      showPlayer(showPlayerCheckbox.checked);
      redraw();
    });
    showPlayer(showPlayerCheckbox.checked);
    showFlatWorldCheckbox.addEventListener("change", function() {
      showHeightNoise(!showFlatWorldCheckbox.checked);
      redraw();
    });
    showHeightNoise(!showFlatWorldCheckbox.checked);

    simSpeedInput.addEventListener("change", function() {
      setSpeed(+simSpeedInput.value);
    });
    setSpeed(+simSpeedInput.value);

    let pending = false;

    // key controls
    addEventListener("keydown", async function(evt) {
      if (evt.defaultPrevented || evt.target instanceof HTMLTextAreaElement) {
        return;
      }
      const action = keyMap[evt.key];
      if (action) {
        evt.preventDefault();
        if (pending) return;
        pending = true;
        try {
          await execute(action.toLowerCase(), true);
          statusOutput.innerHTML = "";
          statusOutput.classList.remove("status-error");
        } catch (err) {
          statusOutput.innerHTML = err.message;
          statusOutput.classList.add("status-error");
        } finally {
          pending = false;
        }
      }
    });

    const interpreter = new Interpreter(simulation);

    byId("run-button").addEventListener("click", async function(evt) {
      evt.preventDefault();
      if (pending) return;
      pending = true;
      statusOutput.innerHTML = "";
      statusOutput.classList.remove("status-error");
      try {
        await interpreter.run(editor.value);
      } catch (err) {
        statusOutput.innerHTML = err.message;
        statusOutput.classList.add("status-error");
      } finally {
          pending = false;
        }
    });

    byId("stop-button").addEventListener("click", function(evt) {
      evt.preventDefault();
      interpreter.interrupt();
      statusOutput.innerHTML = "STOPPED.";
    });

    resetSimulation();

    // demo
    fetch("BOT.kdp")
      .then(response => response.text())
      .then(text => editor.value = text);

  }

  get("config.js").then(cfg => init(cfg).then(init$1));

}());
//# sourceMappingURL=core.js.map
