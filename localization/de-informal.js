/**
 * Kids friendly German localization variables.
 * Enable by setting locale: "de-informal" in config.js.
 */
config({
  simulation: {
    run: "Los!",
  },
  error: {
    parser: {
      token_read:
        "Ich verstehe nicht, was du in Zeile {line} meinst.",
      unexpected_eof:
        "Das Programm sollte noch weitergehen.",
      unexpected_eof_instead:
        "Das Programm sollte noch weitergehen. Als nächstes würde ich {expected} schreiben.",
      unexpected_token:
        "Ich verstehe nicht, was du mit '{value}' in Zeile {line} meinst.",
      unexpected_token_instead:
        "Ich verstehe nicht, was was du in Zeile {line} meinst. Du hast '{value}' geschrieben, aber ich habe {expected} erwartet.",
      nested_program_definition:
        "Ein Programm darf nicht in einem anderen Block stehen.",
      nested_routine_definition:
        "Eine Anweisung darf nicht in einem anderen Block stehen.",
    },
    runtime: {
      undefined: "Den Befehl '{identifier}' kenne ich nicht.",
      cannot_overwrite_function: "Die Anweisung {identifier} gibt es schon.",
    },
    world: {
      move_out_of_world: "Ich kann nicht über den Rand meiner Welt laufen.",
      jump_too_high: "So hoch kann ich nicht springen.",
      move_cuboid: "Auf einen Quader kann ich mich nicht stellen.",
      action_out_of_world: "Ich kann Ziegel nicht aus meiner Welt hinauswerfen.",
      action_cuboid: "Auf einen Quader kann ich keine Ziegel legen.",
      action_too_high: "Ich kann nicht höher stapeln.",
      action_no_blocks: "Hier gibt es keine Ziegel zum aufheben.",
      action_already_marked: "Das Feld ist schon markiert.",
      action_no_mark: "Hier gibt es keine Markierung zum löschen.",
    },
  },
})
