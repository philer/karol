import {rand} from "../util"
import {Exception} from "../exception"

export interface Builtins {
  isLookingAtEdge: () => boolean
  isNotLookingAtEdge: () => boolean
  step: (count?: number) => void
  stepBackwards: (count?: number) => void
  turnLeft: () => void
  turnRight: () => void
  isLookingAtBlock: () => boolean
  isNotLookingAtBlock: () => boolean
  placeBlock: (count?: number) => void
  takeBlock: (count?: number) => void
  isOnMark: () => boolean
  isNotOnMark: () => boolean
  placeMark: () => void
  takeMark: () => void
}

export type Orientation = 0 | 1 | 2 | 3

export interface Player {
  x: number
  y: number
  orientation: Orientation
}

export interface Tile {
  blocks: number
  mark: boolean
  cuboid: boolean
}

/** Check if a given string represents a valid, known *.kdw file's content. */
// Currently not checking for the typical "KarolVersion2Deutsch" prefix.
export const checkKdwFormat = (str: string) =>
  /^\w+(?:\s+\d+){6}(?:\s+\w)*\s*$/.test(str)

export class World implements Builtins {
  width: number
  length: number
  height: number
  seed: number
  player: Player
  tiles: Tile[]

  constructor(
    width: number, length: number, height: number,
    seed?: number, player?: Player, tiles?: Tile[],
  ) {
    this.width = width
    this.length = length
    this.height = height
    this.seed = seed || rand(1<<31, -(1<<31))
    this.player = player || {x: 0, y: 0, orientation: 0}
    this.tiles = tiles || Array.from({length: width * length},
      () => ({blocks: 0, mark: false, cuboid: false}))
  }

  get currentTile() {
    return this.tiles[this.player.x * this.length + this.player.y]
  }

  get forwardTile() {
    const [x, y] = World.move(this.player)
    if (this.contains(x, y)) {
      return this.tiles[x * this.length + y]
    }
    return null
  }

  /** Get coordinates of tile by offset from player position. */
  static move({x, y, orientation}: Player, forward=1, left=0): [number, number] {
    switch (orientation) {
      case 0: x += left; y += forward; break
      case 1: x += forward; y += left; break
      case 2: x -= left; y -= forward; break
      case 3: x -= forward; y -= left; break
    }
    return [x, y]
  }


  contains(x: number, y: number) {
    return x >= 0 && y >= 0 && x < this.width && y < this.length
  }

  isLookingAtEdge() {
    return !this.contains(...World.move(this.player))
  }

  isNotLookingAtEdge() {
    return this.contains(...World.move(this.player))
  }


  step(count=1) {
    const direction = count >= 0 ? 1 : -1
    for (let i = Math.abs(count) ; i ; --i) {
      const [targetX, targetY] = World.move(this.player, direction)
      if (!this.contains(targetX, targetY)) {
        throw new Exception("error.world.move_out_of_world")
      }
      const targetTile = this.tiles[targetX * this.length + targetY]
      if (1 < Math.abs(this.currentTile.blocks - targetTile.blocks)) {
        throw new Exception("error.world.jump_too_high")
      }
      if (targetTile.cuboid) {
        throw new Exception("error.world.move_cuboid")
      }
      [this.player.x, this.player.y] = [targetX, targetY]
    }
  }

  stepBackwards(count=1) {
    this.step(-count)
  }


  turnLeft() {
    this.player.orientation = (this.player.orientation + 1) % 4 as Orientation
  }

  turnRight() {
    this.player.orientation = (this.player.orientation + 3) % 4 as Orientation
  }


  isLookingAtBlock() {
    return Boolean(this.forwardTile?.blocks)
  }

  isNotLookingAtBlock() {
    return !this.isLookingAtBlock()
  }

  placeBlock(count=1) {
    const targetTile = this.forwardTile
    if (!targetTile) {
      throw new Exception("error.world.action_out_of_world")
    }
    if (targetTile.cuboid) {
      throw new Exception("error.world.action_cuboid")
    }
    if (targetTile.blocks + count > this.height) {
      throw new Exception("error.world.action_too_high")
    }
    targetTile.blocks += count
  }

  takeBlock(count=1) {
    const targetTile = this.forwardTile
    if (!targetTile) {
      throw new Exception("error.world.action_out_of_world")
    }
    if (targetTile.blocks - count < 0) {
      throw new Exception("error.world.action_no_blocks")
    }
    targetTile.blocks -= count
  }


  isOnMark() {
    return this.currentTile.mark
  }

  isNotOnMark() {
    return !this.currentTile.mark
  }

  placeMark() {
    const targetTile = this.currentTile
    // can't stand on cuboid -> no need to check
    if (targetTile.mark) {
      throw new Exception("error.world.action_already_marked")
    }
    targetTile.mark = true
  }

  takeMark() {
    const targetTile = this.currentTile
    if (!targetTile.mark) {
      throw new Exception("error.world.action_no_mark")
    }
    targetTile.mark = false
  }

  /** Parse text from a *.kdw file and return a valid game state object */
  static parseKdw(kdw: string) {
    const parts = kdw.split(/\s+/)
    const [width, length, height, playerX, playerY, orientation]
      = parts.slice(1, 7).map(x => +x)
    const tiles: Tile[] = []
    for (let xy = 0 ; xy < width * length ; xy++) {
      const offset = 7 + (height + 1) * xy
      const colData = parts.slice(offset, offset + height + 1)
      tiles.push({
        blocks: colData.filter(s => s === "z").length,
        mark: colData[colData.length - 1] === "m",
        cuboid: colData.includes("q"),
      })
    }
    return new World(width, length, height, 0,
      {x: playerX, y: playerY, orientation: orientation as Orientation},
      tiles)
  }

  /**
   * Generate contents for a .kdw file readable by the legacy karol application.
   *
   * Note: As features get added, this may become impossible!
   */
  toKdwString() {
    const {width, length, height} = this
    const {x, y, orientation} = this.player
    let str = `KarolVersion2Deutsch ${width} ${length} ${height} ${x} ${y} ${orientation}`
    for (const tile of this.tiles) {
      if (tile.cuboid) {
        str += ` q${" n".repeat(height - 1)}`
      } else {
        str += " z".repeat(tile.blocks) + " n".repeat(height - tile.blocks)
      }
      str += ` ${tile.mark ? "m" : "o"}`
    }
    return str
  }

}
