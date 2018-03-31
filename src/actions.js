
// TODO immutable state update (redux style)

function move({x, y, orientation}, forward=1, left=0) {
  switch (orientation) {
    case 0: x += left; y += forward; break;
    case 1: x += forward; y += left; break;
    case 2: x -= left; y -= forward; break;
    case 3: x -= forward; y -= left; break;
  }
  return [x, y];
}

function inWorld(x, y, world) {
  return x >= 0 && y >= 0
      && x < world.width && y < world.length;
}


export function isLookingAtEdge(world) {
  const [x, y] = move(world.player);
  return !inWorld(x, y, world);
}

export function step(world, forward=true) {
  const player = world.player;
  const length = world.length;
  const z = world.tiles[player.x * length + player.y].blocks;
  let [x, y] = move(player, forward ? 1 : -1);
  if (!inWorld(x, y, world)) {
    throw new Error("invalid move: out of world");
  }
  if (1 < Math.abs(z - world.tiles[x * length + y].blocks)) {
    throw new Error("invalid move: jump too high");
  }
  if (world.tiles[x * length + y].cuboid) {
    throw new Error("invalid move: cuboid");
  }
  [world.player.x, world.player.y] = [x, y];
}

export function stepBackwards(world) {
  step(world, false);
}


export function turnLeft(world) {
  world.player.orientation = (world.player.orientation + 1) % 4;
}

export function turnRight(world) {
  world.player.orientation = (world.player.orientation + 3) % 4;
}


export function placeBlock(world) {
  const {length, height, player, tiles} = world;
  const [x, y] = move(player);
  if (!inWorld(x, y, world)) {
    throw new Error("invalid action: out of world");
  }
  const tile = tiles[x * length + y];
  if (tile.cuboid) {
    throw new Error("invalid action: block on cuboid");
  }
  if (tile.blocks >= height) {
    throw new Error("invalid action: building too high");
  }
  tile.blocks++;
}

export function takeBlock(world) {
  const {length, player, tiles} = world;
  const [x, y] = move(player);
  if (!inWorld(x, y, world)) {
    throw new Error("invalid action: out of world");
  }
  const tile = tiles[x * length + y];
  if (tile.blocks <= 0) {
    throw new Error("invalid action: no blocks");
  }
  tile.blocks--;
}


export function placeMark(world) {
  const {x, y} = world.player;
  const tile = world.tiles[x * world.length + y];
  // can't stand on cuboid -> no need to check
  if (tile.mark) {
    throw new Error("invalid action: already has a mark");
  }
  tile.mark = true;
}

export function takeMark(world) {
  const {x, y} = world.player;
  const tile = world.tiles[x * world.length + y];
  if (!tile.mark) {
    throw new Error("invalid action: no mark");
  }
  tile.mark = false;
}

