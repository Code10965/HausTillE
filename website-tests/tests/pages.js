// Diese Liste bildet 1:1 deine pages.json ab. An EINER Stelle gepflegt,
// damit alle Testdateien dieselben URLs verwenden und du bei einer neuen
// Sprache/Seite nur hier etwas ergänzen musst.

// WICHTIG: Pfade bewusst OHNE führenden "/" - Playwright hängt sie sonst
// direkt an die Domain (github.io) statt an den Unterordner (/HausTillE/)
// aus der BASE_URL. Sobald die eigene Domain (ohne Unterordner) läuft,
// funktioniert diese Schreibweise weiterhin unverändert.
const PAGES = [
  { key: "home", lang: "de", path: "de/", expectedTitleIncludes: "Mosel" },
  { key: "home", lang: "en", path: "en/", expectedTitleIncludes: null },
  { key: "home", lang: "nl", path: "nl/", expectedTitleIncludes: null },
  { key: "imprint", lang: "de", path: "de/impressum/", expectedTitleIncludes: null },
  { key: "imprint", lang: "en", path: "en/imprint/", expectedTitleIncludes: null },
  { key: "imprint", lang: "nl", path: "nl/colofon/", expectedTitleIncludes: null },
  { key: "privacy", lang: "de", path: "de/datenschutz/", expectedTitleIncludes: null },
  { key: "privacy", lang: "en", path: "en/privacypolicy/", expectedTitleIncludes: null },
  { key: "privacy", lang: "nl", path: "nl/privacybeleid/", expectedTitleIncludes: null },
];

const HOME_PAGES = PAGES.filter((p) => p.key === "home");
const LEGAL_PAGES = PAGES.filter((p) => p.key !== "home");

module.exports = { PAGES, HOME_PAGES, LEGAL_PAGES };
