/**
 * Kids friendly English localization variables.
 * Enable by setting locale: "de" in config.js.
 */
config({
  simulation: {
    run: "Go!",
  },
  error: {
    parser: {
      token_read:
        "I don't understand what you mean on line {line}.",
      unexpected_eof:
        "The program isn't finished yet.",
      unexpected_eof_instead:
        "The program isn't finished yet. Next I'd write {expected}.",
      unexpected_token:
        "I don't understand what you mean by '{value}' on line {line}.",
      unexpected_token_instead:
        "I don't understand what you mean on line {line}. You wrote '{value}', but I was expecting {expected}.",
      nested_program_definition:
        "A Programm can't be inside another block.",
      nested_routine_definition:
        "A Routine can't be inside another block.",
    },
    runtime: {
      undefined: "I don't know the command '{identifier}'.",
    },
    world: {
      move_out_of_world: "I can't walk over the edge of my world.",
      jump_too_high: "I can't jump that high.",
      move_cuboid: "I can't stand on a cuboid.",
      action_out_of_world: "I can't throw bricks out of my world.",
      action_cuboid: "I can't place bricks on top of a cuboid.",
      action_too_high: "I can't stack any higher.",
      action_no_blocks: "There are no bricks here to pick up.",
      action_already_marked: "This field is already marked.",
      action_no_mark: "There is no mark here to remove.",
    },
  },
})
