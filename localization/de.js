/**
 * German localization variables.
 * Enable by setting locale: "de" in config.js.
 */
config({
  welcome: "Hallo! 👋🤖 Ich bin online Karol Version {version}. Du kannst auch eine {older_release} ausprobieren.",
  older_release: "ältere Version",
  or: "oder",
  program: {
    code: "Programm",
    save: "Speichern",
    load: "Öffnen",
    help: "Programmierhilfe",
    default_filename: "program.kdp",
  },
  simulation: {
    run: "Ausführen",
    speed: "Geschwindigkeit",
    message: {
      running: "GESTARTET...",
      paused: "PAUSIERT",
      canceled: "ABGEBROCHEN",
      finished: "FERTIG",
    },
  },
  world: {
    world: "Welt",
    reset: "Zurücksetzen",
    save: "Speichern",
    load: "Öffnen",
    settings: "Einstellungen",
    length: "Länge",
    width: "Breite",
    height: "Höhe",
    flat: "Flache Welt",
    show_player: "Figur anzeigen",
    default_filename: "welt.kdw",
    action: {
      placeBlock: "Hinlegen",
      takeBlock: "Aufheben",
      placeMark: "Marke setzen",
      takeMark: "Marke löschen",
      turnLeft: "Nach links drehen",
      step: "Schritt vorwärts",
      stepBackwards: "Schritt zurück",
      turnRight: "Nach rechts drehen",
    },
  },
  language: {
    keywords: {
      IF: ["wenn"],
      THEN: ["dann"],
      ELSE: ["sonst"],
      WHILE: ["solange"],
      DO: ["tue"],
      NOT: ["nicht"],
      REPEAT: ["wiederhole"],
      TIMES: ["mal"],
      PROGRAM: ["programm"],
      ROUTINE: ["anweisung"],
    },
    builtins: {
      isLookingAtEdge: ["istWand"],
      isNotLookingAtEdge: ["nichtIstWand"],
      step: ["schritt"],
      stepBackwards: ["schrittZurück", "schrittZurueck"],
      turnLeft: ["linksDrehen"],
      turnRight: ["rechtsDrehen"],
      isLookingAtBlock: ["istZiegel"],
      isNotLookingAtBlock: ["nichtIstZiegel"],
      placeBlock: ["hinlegen"],
      takeBlock: ["aufheben"],
      isOnMark: ["istMarke"],
      isNotOnMark: ["nichtIstMarke"],
      placeMark: ["markeSetzen"],
      takeMark: ["markeLöschen", "markeLoeschen"],
    },
    help: {
      example: "Beispiel",
      copy: "Kopieren",
      builtins: "Anweisungen",
    },
  },
  error: {
    browser_feature_not_available: "Der Browser ist veraltet und unterstützt diese Funktionalität nicht.",
    invalid_world_file: "Das ist keine valide *.kdw Datei.",
    parser: {
      token_read:
        "Syntax-Fehler in Zeile {line}, Spalte {column}: Nächstes Wort nicht lesbar.",
      unexpected_eof:
        "Lese-Fehler: Unerwartetes End der Eingabe.",
      unexpected_eof_instead:
        "Lese-Fehler: Unerwartetes End der Eingabe, erwarte stattdessen {expected}.",
      unexpected_token:
        "Lese-Fehler in Zeile {line}, Spalte {column}: Unerwartes Wort '{value}'.",
      unexpected_token_instead:
        "Lese-Fehler in Zeile {line}, Spalte {column}: Unerwartes Wort '{value}', erwarte stattdessen {expected} .",
      nested_program_definition:
        "Lese-Fehler in Zeile {line}: Programm in verschachteltem Kontext nicht definierbar.",
      nested_routine_definition:
        "Lese-Fehler in Zeile {line}: Anweisung in verschachteltem Kontext nicht definierbar.",
    },
    runtime: {
      undefined: "Laufzeit-Fehler in Zeile {line}: {identifier} nicht definiert.",
      max_recursion_depth_exceeded:
        "Laufzeit-Fehler: Maximales Rekursionstiefe ({depth}) überschritten.",
      cannot_overwrite_function:
        "Laufzeit-Fehler: Die Anweisung {identifier} kann nicht überschrieben werden.",
      unimplemented_statement_type:
        "Laufzeit-Fehler: Nicht implementierter Anweisungstyp {type}.",
      unimplemented_expression_type:
        "Laufzeit-Fehler: Nicht implementierter Ausdrucksstyp {type}.",
    },
    world: {
      move_out_of_world: "Ungültige Bewegung: außerhalb der Welt",
      jump_too_high: "Ungültige Bewegung: jump too high",
      move_cuboid: "Ungültige Bewegung: cuboid",
      action_out_of_world: "Ungültige Aktion: außerhalb der Welt",
      action_cuboid: "Ungültige Aktion: Block auf Quader",
      action_too_high: "Ungültige Aktion: Baut zu hoch",
      action_no_blocks: "Ungültige Aktion: keine Blöcke",
      action_already_marked: "Ungültige Aktion: bereits markiert",
      action_no_mark: "Ungültige Aktion: nicht markiert",
    },
  },
})
