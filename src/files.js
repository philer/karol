import {World} from "./world.js";

/**
 * Read a .kdw file
 * @param  {File} file DOM file (from input[type="filel"])
 * @return {Promise} resolves with text content
 */
export function readKdwFile(file) {
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
