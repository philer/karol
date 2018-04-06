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
      throw new Exception("error.world.action_out_of_world");
    }
    const targetTile = this.tiles[x * this.length + y];
    if (targetTile.cuboid) {
      throw new Exception("error.world.action_cuboid");
    }
    if (targetTile.blocks >= this.height) {
      throw new Exception("error.world.action_too_high");
    }
    targetTile.blocks++;
  }

  takeBlock() {
    const [x, y] = World.move(this.player);
    if (!this.contains(x, y)) {
      throw new Exception("error.world.action_out_of_world");
    }
    const targetTile = this.tiles[x * this.length + y];
    if (targetTile.blocks <= 0) {
      throw new Exception("error.world.action_no_blocks");
    }
    targetTile.blocks--;
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
