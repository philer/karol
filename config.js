config({
  // Must be available as a localization/*.js file.
  // Use an array to specify fallback options, e.g. ["de", "en"]
  // Use "auto" to detect browser locale.
  locale: ["auto-informal", "auto", "en"],

  // graphics sprite themes
  tile_theme: "themes/neoz7",
  player_theme: "themes/botty",

  // options: "bright", "monokai"
  editor_theme: "monokai",

  // programming language configuration
  code: {
    // translations for keywords and builtins
    // unlike for UI locales, all listed languages are added
    locales: ["en", "de"],
    caseSensitiveKeywords: false,
    caseSensitiveIdentifiers: false,
  },
})
