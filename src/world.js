import {rand} from "./util.js";
import {Exception} from "./localization.js";

export class World {

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
      throw new Exception("error.world.move_out_of_world");
    }
    const targetTile = this.tiles[x * this.length + y];
    if (1 < Math.abs(z - targetTile.blocks)) {
      throw new Exception("error.world.jump_too_high");
    }
    if (targetTile.cuboid) {
      throw new Exception("error.world.move_cuboid");
    }
    [this.player.x, this.player.y] = [x, y];
  }

  stepBackwards(count=1) {
    this.step(-count);
  }


  turnLeft() {
    this.player.orientation = (this.player.orientation + 1) % 4;
  }

  turnRight() {
    this.player.orientation = (this.player.orientation + 3) % 4;
  }


  placeBlock(count=1) {
    const [x, y] = World.move(this.player);
    if (!this.contains(x, y)) {
      throw new Exception("error.world.action_out_of_world");
    }
    const targetTile = this.tiles[x * this.length + y];
    if (targetTile.cuboid) {
      throw new Exception("error.world.action_cuboid");
    }
    if (targetTile.blocks + count > this.height) {
      throw new Exception("error.world.action_too_high");
    }
    targetTile.blocks += count;
  }

  takeBlock(count=1) {
    const [x, y] = World.move(this.player);
    if (!this.contains(x, y)) {
      throw new Exception("error.world.action_out_of_world");
    }
    const targetTile = this.tiles[x * this.length + y];
    if (targetTile.blocks - count < 0) {
      throw new Exception("error.world.action_no_blocks");
    }
    targetTile.blocks -= count;
  }


  placeMark() {
    const targetTile = this.tiles[this.player.x * this.length + this.player.y];
    // can't stand on cuboid -> no need to check
    if (targetTile.mark) {
      throw new Exception("error.world.action_already_marked");
    }
    targetTile.mark = true;
  }

  takeMark() {
    const targetTile = this.tiles[this.player.x * this.length + this.player.y];
    if (!targetTile.mark) {
      throw new Exception("error.world.action_no_mark");
    }
    targetTile.mark = false;
  }
}

// Currently not checking for the typical "KarolVersion2Deutsch" prefix.
const reKdwFile = /^\w+(?:\s+\d+){6}(?:\s+\w)*\s*$/;

/**
 * Check if a given string represents a valid, known *.kdw file's content.
 * @param  {string} kdw
 * @return {boolean}
 */
export const checkKdwFormat = reKdwFile.test.bind(reKdwFile);

/**
 * Parse text from a *.kdw file and return a valid game state object
 * @param  {String} kdw contents of a .kdw file
 * @return {Object} game state
 */
export function parseKdw(kdw) {
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

/**
 * Generate contents for a .kdw file readable by the legacy karol application.
 *
 * Note: As features get added, this may become impossible!
 *
 * @param  {World} world
 * @return {string}
 */
export function worldToKdwString(world) {
  const {width, length, height} = world;
  const {x, y, orientation} = world.player;
  let str = "KarolVersion2Deutsch"
          + " " + width + " " + length + " " + height
          + " " + x     + " " + y      + " " + orientation;
  for (const tile of world.tiles) {
    if (tile.cuboid) {
      str += " q" + " n".repeat(height - 1);
    } else {
      str += " z".repeat(tile.blocks) + " n".repeat(height - tile.blocks);
    }
    str += " " + (tile.mark ? "m" : "o");
  }
  return str;
}
