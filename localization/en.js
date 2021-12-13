/**
 * English localization variables.
 * Enable by setting locale: "en" in config.js.
 *
 * This file should be kept up-to-date at all times
 * and serve as reference for other languages.
 */
config({
  welcome: "Welcome! 👋🤖 I am online Karol version {version}. You can also try an {older_release}.",
  older_release: "older release",
  or: "or",
  program: {
    code: "Code",
    save: "Save",
    load: "Load",
    help: "Programming Help",
    default_filename: "program.kdp",
  },
  simulation: {
    run: "Run",
    speed: "Speed",
    message: {
      running: "RUNNING...",
      paused: "PAUSED",
      canceled: "CANCELED",
      finished: "DONE",
    },
  },
  world: {
    world: "World",
    reset: "Reset",
    save: "Save",
    load: "Load",
    settings: "Settings",
    length: "Length",
    width: "Width",
    height: "Height",
    flat: "Flat World",
    show_player: "Show Player",
    default_filename: "world.kdw",
    action: {
      placeBlock: "Place block",
      takeBlock: "Take block",
      placeMark: "Place mark",
      takeMark: "Take mark",
      turnLeft: "Turn left",
      step: "Step forward",
      stepBackwards: "Step backwards",
      turnRight: "Turn right",
    },
  },
  language: {
    keywords: {
      IF: ["if"],
      THEN: ["then"],
      ELSE: ["else"],
      WHILE: ["while"],
      DO: ["do"],
      NOT: ["not"],
      REPEAT: ["repeat"],
      TIMES: ["times"],
      PROGRAM: ["program"],
      ROUTINE: ["routine"],
    },
    builtins: {
      isLookingAtEdge: ["isEdge"],
      isNotLookingAtEdge: ["notIsEdge"],
      step: ["step"],
      stepBackwards: ["stepBackwards"],
      turnLeft: ["turnLeft"],
      turnRight: ["turnRight"],
      isLookingAtBlock: ["isBlock"],
      isNotLookingAtBlock: ["notIsBlock"],
      placeBlock: ["placeBlock"],
      takeBlock: ["takeBlock"],
      isOnMark: ["isOnMark"],
      isNotOnMark: ["notIsOnMark"],
      placeMark: ["placeMark"],
      takeMark: ["takeMark"],
    },
    help: {
      example: "Example",
      copy: "Copy",
      all_builtins: "All Commands",
      conditional_statements: "Conditional Statements",
      repetitions: "Repetitions",
      custom_routines: "Custom Routines",
      turnAround: "turnAround",
    },
  },
  help: {
    controls: "Controls",
    about: "About",
    builtin: "Command",
    key: "Key",
  },
  error: {
    browser_feature_not_available: "Your browser does not support his feature. Consider switch to an up-to-date browser.",
    invalid_world_file: "This does not appear to be a valid *.kdw file.",
    parser: {
      token_read:
        "Syntax Error on line {line}, column {column}: Could not read next token.",
      unexpected_eof:
        "Parse Error: Unexpected end of input.",
      unexpected_eof_instead:
        "Parse Error: Unexpected end of input, was expecting {expected}",
      unexpected_token:
        "Parse Error on line {line}, column {column}: Unexpected token '{value}'.",
      unexpected_token_instead:
        "Parse Error on line {line}, column {column}: Unexpected token '{value}', was expecting {expected}.",
      nested_program_definition:
        "Parse Error on line {line}: Can't define program in nested context.",
      nested_routine_definition:
        "Parse Error on line {line}: Can't define routine in nested context.",
    },
    runtime: {
      undefined: "Runtime Error on line {line}: {identifier} is not defined.",
      max_recursion_depth_exceeded:
        "Runtime Error: Maximum recursion depth ({depth}) exceeded.",
      cannot_overwrite_function:
        "Runtime Error: Can't overwrite existing function {identifier}.",
      unimplemented_statement_type:
        "Runtime Error: Unimplemented statement type {type}.",
      unimplemented_expression_type:
        "Runtime Error: Unimplemented expression type {type}.",
    },
    world: {
      move_out_of_world: "Invalid move: out of world",
      jump_too_high: "Invalid move: jump too high",
      move_cuboid: "Invalid move: cuboid",
      action_out_of_world: "Invalid action: out of world",
      action_cuboid: "Invalid action: block on cuboid",
      action_too_high: "Invalid action: building too high",
      action_no_blocks: "Invalid action: no blocks",
      action_already_marked: "Invalid action: already has a mark",
      action_no_mark: "Invalid action: no mark",
    },
  },
})
