// sortedEvents.js
//
// Eleventy-Global-Data-Datei: liest die Event-Listen aus de.json/en.json/
// nl.json (dieselben Dateien, die als "de"/"en"/"nl" bereits global in
// allen Templates verfügbar sind) und sortiert sie EINMAL beim Bauen der
// Seite chronologisch nach Startdatum (date_iso).
//
// WARUM HIER UND NICHT IM BROWSER SORTIEREN?
// Das eigentliche Sortieren ist der teure Teil (O(n log n) - siehe
// sortEventsByDate() unten). Wenn jeder Website-Besucher das bei jedem
// Seitenaufruf im Browser neu sortieren müsste, würde diese Arbeit
// tausendfach wiederholt, obwohl sich an der Reihenfolge der Events
// zwischen zwei Deploys nichts ändert. Hier läuft die Sortierung dagegen
// nur EINMAL beim Bauen der Seite (`npm run build`).
//
// Was NICHT hier passieren darf: die Aufteilung in "zukünftig" und
// "vergangen". Das hängt vom tatsächlichen "heute" ab, und ein
// statischer Build weiß nur, welcher Tag beim letzten Deploy gerade war
// - das würde einfrieren (siehe die ausführliche Erklärung dazu in
// events.njk). Die Aufteilung bleibt deshalb weiterhin Aufgabe von
// partitionEventsByDate() im Browser (eventsCarousel.js) - dort ist sie
// aber jetzt trivial günstig: nur noch ein einziger Filter-Durchlauf
// (O(n)) statt eines erneuten Sortierens, weil die Liste hier schon in
// der richtigen Reihenfolge ankommt (siehe dort für Details).

const de = require("./de.json");
const en = require("./en.json");
const nl = require("./nl.json");

/**
 * Sortiert eine Liste von Events aufsteigend nach Startdatum
 * (date_iso, Format "YYYY-JJ-TT" - als String direkt vergleichbar,
 * kein Date-Parsing nötig).
 *
 * Big-O: O(n log n) - das ist für einen allgemeinen, vergleichsbasierten
 * Sortieralgorithmus die bestmögliche Komplexität (informationstheoretische
 * untere Schranke: um n Elemente in eine von n! möglichen Reihenfolgen zu
 * bringen, braucht man mindestens log2(n!) ≈ n·log2(n) Vergleiche). Ein
 * noch schnelleres O(n) wäre nur mit einem nicht-vergleichsbasierten
 * Verfahren wie Counting-/Radix-Sort auf den Datums-Strings möglich -
 * für die überschaubare Anzahl an Events (aktuell < 20) lohnt sich diese
 * zusätzliche Komplexität nicht, und Node/V8s eingebauter Array.sort()
 * (TimSort) ist für diese Größenordnung ohnehin schneller in der Praxis.
 *
 * .slice() vor .sort(), damit das Original-Array (und damit die
 * ursprüngliche de.json/en.json/nl.json-Reihenfolge) unangetastet
 * bleibt - reine Funktion ohne Seiteneffekte, leicht einzeln testbar.
 */
function sortEventsByDate(events) {
  return events.slice().sort((a, b) => {
    const dateA = a.date_iso || "";
    const dateB = b.date_iso || "";
    if (dateA < dateB) return -1;
    if (dateA > dateB) return 1;
    return 0;
  });
}

module.exports = {
  de: sortEventsByDate(de.events.items),
  en: sortEventsByDate(en.events.items),
  nl: sortEventsByDate(nl.events.items),
};