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
import type {World} from "./simulation/world"

interface Config {
  tile_theme: string
  player_theme: string
}

export type TileSpriteName =
  | "floor"
  | "block"
  | "mark"
  | "cuboid"

export type PlayerSpriteName =
  | "player_north"
  | "player_east"
  | "player_south"
  | "player_west"

export type SpriteName = TileSpriteName | PlayerSpriteName

const TILE_SPRITE_NAMES
  = ["floor", "block", "mark", "cuboid"] as const

const PLAYER_SPRITE_NAMES
  = ["player_south", "player_east", "player_north", "player_west"] as const

interface Theme {
  artist?: string
  url?: string
  tile_width?: number
  tile_depth?: number
  block_height?: number
  player_height?: number
  tile_gap?: number
  tile_gap_z?: number
  noise_amplifier?: number
  sprites: Record<SpriteName, string>
  images: Record<string, string | [string, number, number, number, number]>
}

const DEFAULT_THEME_DIR = "themes/simple"

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


// drawable objects
export const sprites: Record<string, Sprite> = {}

const imageCache = Object.create(null)

let tileWidth: number
let tileDepth: number
let blockHeight: number

let tileGap: number
let tileGapZ: number
let noiseAmplifier: number

let playerHeight: number

let canvas: HTMLCanvasElement
let ctx: CanvasRenderingContext2D | null

let _showPlayer = true
let _showHeightNoise = true

export function showPlayer(show=true) {
  _showPlayer = show
}

export function showHeightNoise(show=true) {
  _showHeightNoise = show
}

/** Prepare canvas and drawing context */
export function setCanvas(canvasElement: HTMLCanvasElement) {
  canvas = canvasElement
  if (!canvas) {
    ctx = null
    return
  }
  if (ctx = canvas.getContext("2d")) {
    // @ts-expect-error Support old browsers
    ctx.mozImageSmoothingEnabled = false
    // @ts-expect-error Support old browsers
    ctx.webkitImageSmoothingEnabled = false
    // @ts-expect-error Support old browsers
    ctx.msImageSmoothingEnabled = false
    ctx.imageSmoothingEnabled = false
  }
}

/** Things that can be drawn on the canvas. Allows preloading images. */
export class Sprite {
  imagePath: string
  _image: HTMLImageElement
  height: number
  _scaledWidth: number
  _scaledHeight: number

  constructor(imagePath: string) {
    this.imagePath = imagePath
  }

  async load() {
    this._image = await loadImage(this.imagePath)
    const scale = tileWidth / this._image.width
    this._scaledWidth = tileWidth
    this._scaledHeight = scale * this._image.height
    this.height = this._scaledHeight - tileDepth
  }

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.drawImage(this._image,
      x, y - this.height,
      this._scaledWidth, this._scaledHeight)
  }
}

/**
 * Things that can be drawn on the canvas from a sprite sheet / atlas.
 * Allows preloading.
 */
export class AtlasSprite extends Sprite {
  crop: {x: number, y: number, width: number, height: number}
  xOffset: number
  yOffset: number

  constructor(
    imagePath: string, x: number, y: number, width: number, height: number,
    xOffset=0, yOffset=0,
  ) {
    super(imagePath)
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

  draw(ctx: CanvasRenderingContext2D, x: number, y: number) {
    ctx.drawImage(this._image,
      this.crop.x, this.crop.y,
      this.crop.width, this.crop.height,
      x + this.xOffset, y - this.height - this.yOffset,
      this._scaledWidth, this._scaledHeight)
  }
}

// TODO missing sprite graphic
export class MissingSprite extends Sprite {
  constructor() { super("") }
  async load() {}
  draw() {}
}


function createSprite(spriteName: SpriteName, theme: Theme, themeDir: string) {
  const spriteDefinition = theme.images[theme.sprites[spriteName]]
  if (!spriteDefinition) {
    console.warn(`Bad theme config: No image for sprite '${spriteName}' in ${themeDir}`)
    return new MissingSprite()
  }
  if (Array.isArray(spriteDefinition)) {
    const [filename, ...crop] = spriteDefinition
    return new AtlasSprite(`${themeDir}/${filename}`, ...crop)
  } else {
    return new Sprite(`${themeDir}/${spriteDefinition}`)
  }
}


function loadImage(path: string): Promise<HTMLImageElement> {
  if (path in imageCache) {
    return imageCache[path]
  }
  return imageCache[path] = new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", reject)
    image.src = path
  })
}


/**
 * Load sprite theme including fallbacks
 * @param  {Object} cfg
 * @return {Promise}
 */
async function initSprites({tile_theme, player_theme}: Config) {
  const tileThemeDir = tile_theme
  const playerThemeDir = player_theme || tile_theme

  const [tileTheme, playerTheme, defaultTheme] = await Promise.all([
    config.get<Theme>(tileThemeDir + "/theme.js"),
    config.get<Theme>(playerThemeDir + "/theme.js"),
    config.get<Theme>(DEFAULT_THEME_DIR + "/theme.js"),
  ])

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


/** Draw a given game state to the canvas */
export function render(world: World) {
  requestAnimationFrame(() => _render(world))
}

function _render({width, length, height, player, tiles, seed}: World) {
  if (!ctx) {
    return
  }
  const w = (width + length) * 0.5 * (tileWidth + 2 * tileGap)
  const h = (width + length) * 0.5 * (tileDepth + 1 * tileGap)
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

  for (let x = 0 ; x < width ; ++x) {
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
        sprites[PLAYER_SPRITE_NAMES[player.orientation]].draw(
          ctx, canvasX, canvasY - z)
      }
      // ctx.fillText(x + "," + y, canvasX+.4*tileWidth, canvasY);
    }
  }
}

/** Initialize the module. Loads graphics. */
export const init = () => config.get<Config>().then(initSprites)
