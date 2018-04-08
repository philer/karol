/**
 * German localization variables.
 * Enable by setting locale: "de" in config.js.
 */
config({
  program: {
    code: "Programm",
    save: "Speichern",
    load: "Öffnen",
    run: "Ausführen",
    message: {
      running: "GESTARTET...",
      paused: "PAUSIERT",
      canceled: "ABGEBROCHEN",
      finished: "FERTIG",
    },
    default_filename: "program.kdp",
  },
  world: {
    world: "Welt",
    new: "Neu",
    save: "Speichern",
    load: "Öffnen",
    speed: "Geschwindigkeit",
    length: "Länge",
    width: "Breite",
    height: "Höhe",
    flat: "Flache Welt",
    show_player: "Figur anzeigen",
    default_filename: "welt.kdw",
  },
  error: {
    browser_feature_not_available: "Der Browser ist veraltet und unterstützt diese Funktionalität nicht.",
    invalid_world_file: "Das ist keine valide *.kdw Datei.",
    parser: {
      token_read:
        "Syntax-Fehler in Zeile {line}, Spalte {column}: Nächstes Wort nicht lesbar.",
      unexpected_token:
        "Lese-Fehler in Zeile {line}, Spalte {column}: Unerwartes Wort {token}.",
      unexpected_token_instead:
        "Lese-Fehler in Zeile {line}, Spalte {column}: Unerwartes Wort {token}, erwarte stattdessen {expected} .",
      nested_program_definition:
        "Lese-Fehler in Zeile {}: Programm in verschachteltem Kontext nicht definierbar.",
      nested_routine_definition:
        "Lese-Fehler in Zeile {}: Anweisung in verschachteltem Kontext nicht definierbar.",
    },
    runtime: {
      undefined: "Laufzeit-Fehler in Zeile {line}: {identifier} nicht definiert.",
      max_recursion_depth_exceeded:
        "Laufzeit-Fehler: Maximales Rekursionstiefe ({}) überschritten.",
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
});
