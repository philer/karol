/**
 * Basic isometric graphics inspired by Karol.
 *
 * Potential optimizations:
 * - draw on hidden canvas
 * - background/floor caching
 * - multiple canvas layers
 */

import * as config from "./config"
import * as noise from "./util/perlin"

const DEFAULT_THEME_DIR = "img/simple"

// themes should provide their own settings
const DEFAULT_SETTINGS = {
  tile_width: 64,
  tile_depth: 32,
  block_height: 16,
  player_height: 128,
  tile_gap: 2,
  tile_gap_z: 1,
  noise_amplifier: 1,
}

const ORIENTATIONS = ["south", "east", "north", "west"]
const PLAYER_SPRITE_NAMES = ORIENTATIONS.map(str => "player_" + str)
const TILE_SPRITE_NAMES = ["floor", "block", "mark", "cuboid"]

// drawable objects
export const sprites  = {}

const imageCache = Object.create(null)

let tileWidth, tileDepth, blockHeight,
  tileGap, tileGapZ, noiseAmplifier,
  playerHeight

let canvas
let ctx

let _showPlayer = true
let _showHeightNoise = true

export function showPlayer(show=true) {
  _showPlayer = show
}

export function showHeightNoise(show=true) {
  _showHeightNoise = show
}

/**
 * Prepare canvas and drawing context
 * @return {Promise}
 */
export function setCanvas(canvasElement) {
  canvas = canvasElement
  if (!canvas) {
    ctx = null
    return
  }
  ctx = canvas.getContext("2d")
  ctx.mozImageSmoothingEnabled = false
  ctx.webkitImageSmoothingEnabled = false
  ctx.msImageSmoothingEnabled = false
  ctx.imageSmoothingEnabled = false
}

/**
 * Load sprite theme including fallbacks
 * @param  {Object} cfg
 * @return {Promise}
 */
async function initSprites({tile_theme, player_theme}) {
  const tileThemeDir = tile_theme
  const playerThemeDir = player_theme || tile_theme

  const [tileTheme, playerTheme, defaultTheme] = await Promise.all([
    tileThemeDir + "/theme.js",
    playerThemeDir + "/theme.js",
    DEFAULT_THEME_DIR + "/theme.js",
  ].map(config.get))

  const sizes = Object.assign({}, DEFAULT_SETTINGS, tileTheme)
  tileWidth = sizes.tile_width
  tileDepth = sizes.tile_depth
  blockHeight = sizes.block_height
  tileGap = sizes.tile_gap
  tileGapZ = sizes.tile_gap_z
  noiseAmplifier = sizes.noise_amplifier
  playerHeight = playerTheme.player_height || sizes.player_height

  for (const key of PLAYER_SPRITE_NAMES) {
    if (playerTheme.sprites.hasOwnProperty(key)) {
      sprites[key] = createSprite(key, playerTheme, playerThemeDir)
    } else if (tileTheme.sprites.hasOwnProperty(key)) {
      sprites[key] = createSprite(key, tileTheme, tileThemeDir)
    } else {
      sprites[key] = createSprite(key, defaultTheme, DEFAULT_THEME_DIR)
    }
  }
  for (const key of TILE_SPRITE_NAMES) {
    if (tileTheme.sprites.hasOwnProperty(key)) {
      sprites[key] = createSprite(key, tileTheme, tileThemeDir)
    } else {
      sprites[key] = createSprite(key, defaultTheme, DEFAULT_THEME_DIR)
    }
  }
  Object.freeze(sprites)
  return Promise.all(Object.values(sprites).map(sprite => sprite.load()))
}

function createSprite(spriteName, theme, themeDir) {
  let filename, crop
  try {
    [filename, ...crop] = theme.images[theme.sprites[spriteName]]
  } catch (err) {
    console.warn(`Bad theme config: No image for sprite '${spriteName}' in ${themeDir}`)
    return
  }
  if (crop.length) {
    return new AtlasSprite(`${themeDir}/${filename}`, ...crop)
  } else {
    return new Sprite(`${themeDir}/${filename}`)
  }
}

/**
 * Things that can be drawn on the canvas.
 * Allows preloading images.
 */
class Sprite {
  constructor(imagePath) {
    this.imagePath = imagePath
  }
  async load() {
    this._image = await loadImage(this.imagePath)
    const scale = tileWidth / this._image.width
    this._scaledWidth = tileWidth
    this._scaledHeight = scale * this._image.height
    this.height = this._scaledHeight - tileDepth
  }
  draw(ctx, x, y) {
    ctx.drawImage(this._image,
      x, y - this.height,
      this._scaledWidth, this._scaledHeight)
  }
}

/**
 * Things that can be drawn on the canvas from a sprite sheet / atlas.
 * Allows preloading.
 */
class AtlasSprite {
  constructor(imagePath, x, y, width, height, xOffset=0, yOffset=0) {
    this.imagePath = imagePath
    this.crop = {x, y, width, height}
    const scale = tileWidth / width
    this._scaledWidth = tileWidth
    this._scaledHeight = scale * height
    this.height = this._scaledHeight - tileDepth
    this.xOffset = xOffset
    this.yOffset = yOffset
  }
  async load() {
    this._image = await loadImage(this.imagePath)
  }
  draw(ctx, x, y) {
    ctx.drawImage(this._image,
      this.crop.x, this.crop.y,
      this.crop.width, this.crop.height,
      x + this.xOffset, y - this.height - this.yOffset,
      this._scaledWidth, this._scaledHeight)
  }
}

function loadImage(path) {
  if (path in imageCache) {
    return imageCache[path]
  }
  return imageCache[path] = new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", reject)
    image.src = path
  })
}


/**
 * Draw a given game state to the canvas
 * @param  {Object} options.world   {width, length, height}
 * @param  {Object} options.player   {x, y, orientation}
 * @param  {Array}  options.tiles   tiles data
 * @return {undefined}
 */
export const render = world => requestAnimationFrame(() => _render(world))

function _render({width, length, height, player, tiles, seed}) {
  if (!ctx) {
    return
  }
  let w = (width + length) * 0.5 * (tileWidth + 2 * tileGap)
  let h = (width + length) * 0.5 * (tileDepth + 1 * tileGap)
        + height * blockHeight + playerHeight

  if (canvas.width !== w) {
    canvas.width = w
  }
  if (canvas.height !== h) {
    canvas.height = h
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height)
  if (_showHeightNoise) {
    noise.seed(seed)
  }

  const canvas00X = 0.5 * (length - 1) * (tileWidth + 2 * tileGap)
  let canvasX, canvasY, z

  for (let x = 0 ;  x < width ; ++x) {
    for (let y = 0 ; y < length ; ++y) {
      canvasX = (-y + x) * 0.5 * (tileWidth + 2 * tileGap)
              + tileGap
              + canvas00X
      canvasY = (y + x) * 0.5 * (tileDepth + 1 * tileGap)
              - 0.5 * tileGap
              + height * blockHeight
              + playerHeight

      const tile = tiles[x * length + y]

      z = 0
      if (_showHeightNoise) {
        z += 5 * noiseAmplifier * noise.simplex2(x / 10, y / 10)
               + noiseAmplifier * noise.simplex2(x / 3, y / 3)
      }

      sprites.floor.draw(ctx, canvasX, canvasY - z)
      z += sprites.floor.height + tileGapZ
      if (tile.cuboid) {
        sprites.cuboid.draw(ctx, canvasX, canvasY - z)
        z += sprites.cuboid.height + tileGapZ
      } else {
        for (let layer = 0 ; layer < tile.blocks ; ++layer) {
          sprites.block.draw(ctx, canvasX, canvasY - z)
          z += sprites.block.height + tileGapZ
        }
        if (tile.mark) {
          sprites.mark.draw(ctx, canvasX, canvasY - z)
          z += sprites.mark.height + tileGapZ
        }
      }
      if (_showPlayer && player.x === x && player.y === y) {
        sprites["player_" + ORIENTATIONS[player.orientation]].draw(
          ctx, canvasX, canvasY - z)
      }
      // ctx.fillText(x + "," + y, canvasX+.4*tileWidth, canvasY);
    }
  }
}

/**
 * Initialize the module. Loads graphics.
 * @return {Promise}
 */
export const init = () => config.get().then(initSprites)
