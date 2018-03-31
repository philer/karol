/**
 * Basic isometric graphics inspired by Karol.
 *
 * Potential optimizations:
 * - draw on hidden canvas
 * - background/floor caching
 * - multiple canvas layers
 */

// import {Random} from "./util.js";
import * as noise from "./perlin.js";
import {fetchJson} from "./util.js";

const DEFAULT_THEME = "img/simple/";

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

// should be included in a themes "mapping"
const SPRITE_NAMES = [
  "floor",
  "block",
  "mark",
  "player_north",
  "player_east",
  "player_south",
  "player_west"
];


const ORIENTATIONS = ["north", "east", "south", "west"];

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

/**
 * Initialize the module. Loads graphics.
 * @return {Promise}
 */
export function init(cfg) {
  return Promise.all([initSprites(cfg), initCanvas()]);
}

/**
 * Load sprite theme including fallbacks
 * @param  {Object} cfg
 * @return {Promise}
 */
async function initSprites(cfg) {
  const themeDir = cfg.sprite_theme + "/";
  const theme = Object.assign(
                  {},
                  DEFAULT_SETTINGS,
                  await fetchJson(themeDir + "theme.json")
                );
  tileWidth = theme.tile_width;
  tileDepth = theme.tile_depth;
  blockHeight = theme.block_height;
  playerHeight = theme.player_height;
  tileGap = theme.tile_gap;
  tileGapZ = theme.tile_gap_z;
  noiseAmplifier = theme.noise_amplifier;

  const defaultTheme = await fetchJson(DEFAULT_THEME + "theme.json");

  const loaders = [];
  for (const key of SPRITE_NAMES) {
    let mappedSpriteName = theme.mapping[key];
    let file, crop;
    if (mappedSpriteName) {
      [file, ...crop] = theme.sprites[mappedSpriteName];
      file = themeDir + file;
    } else {
      mappedSpriteName = defaultTheme.mapping[key];
      [file, ...crop] = defaultTheme.sprites[mappedSpriteName];
      file = DEFAULT_THEME + file;
    }
    if (crop.length) {
      sprites[key] = new AtlasSprite(file, ...crop);
    } else {
      sprites[key] = new Sprite(file);
    }
    loaders.push(sprites[key].load())
  }
  return Promise.all(loaders);
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

export function showPlayer(show=true) {
  _showPlayer = show;
}

export function showHeightNoise(show=true) {
  _showHeightNoise = show;
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
 * Things that can be drawn on the canvas.
 * Allows preloading images.
 */
class Sprite {
  constructor(imagePath) {
    this.imagePath = imagePath;
  }
  async load() {
    this._image = await loadImage(this.imagePath);
    const scale = tileWidth / img.width;
    this._scaledWidth = tileWidth;
    this._scaledHeight = scale * img.height;
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


/**
 * Draw a given game state to the canvas
 * @param  {Object} options.world   {width, length, height}
 * @param  {Object} options.player   {x, y, orientation}
 * @param  {Array}  options.tiles   tiles data
 * @return {undefined}
 */
export function render({width, length, height, player, tiles, seed}) {
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
    noise.seed(seed);
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
        z += 5 * noiseAmplifier * noise.simplex2(x / 10, y / 10)
               + noiseAmplifier * noise.simplex2(x / 3, y / 3);
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
