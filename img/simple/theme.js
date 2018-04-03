config({
  url: "https://kenney.nl/assets/",
  tile_width: 132,
  tile_depth: 66,
  block_height: 33,
  player_height: 33,
  tile_gap: 2,
  tile_gap_z: 2,
  noise_amplifier: 2,
  sprites: {
    floor: "grass",
    block: "dirt",
    cuboid: "building_section_windows",
    mark: "roof_center_slab",
    player_north: "concrete_river_north",
    player_east: "concrete_river_east",
    player_south: "concrete_river_south",
    player_west: "concrete_river_west"
  },
  images: {
    grass: ["landscape.png", 398, 265, 132, 99],
    dirt: ["landscape.png", 266, 723, 132, 99],
    roof_center_slab: ["buildings.png", 595, 1425, 99, 54],
    concrete_river_north: ["city.png", 398, 555, 132, 101],
    concrete_river_east: ["city.png", 529, 1419, 132, 101],
    concrete_river_south: ["city.png", 530, 101, 132, 101],
    concrete_river_west: ["city.png", 529, 1318, 132, 101],
    building_section_windows: ["buildings.png", 595, 1230, 98, 84]
  }
});
