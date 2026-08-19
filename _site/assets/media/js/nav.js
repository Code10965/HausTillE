// ---------- Menü, Sprache, Kontakt: drei goldene Kugeln ----------
// Aktiv nur auf Seiten mit [data-nav-item] (aktuell nur die Startseite) -
// setupNav() bricht sonst früh ab, kein Fehler auf Impressum/Datenschutz.
//
// Diese Datei ist nur noch der Einstiegspunkt: sie sammelt die drei
// Kugeln als "Item"-Objekte ein und startet zwei unabhängige Verhalten,
// die jetzt in eigenen Dateien leben:
// - navToggle.js       -> Öffnen/Schließen der Dropdowns per Klick/Hover
// - navScrollTrack.js  -> Positionierung + Reihe<->Stapel-Choreografie
//   beim Scrollen (der aufwendige Teil - ausführlicher Kommentar zur
//   genauen Szenen-Abfolge in beide Richtungen steht dort)
//
// Die Menü-Links selbst kommen bereits übersetzt aus nav.njk (siehe
// [data-nav-links] im HTML) - diese Datei rendert sie nicht, sie bedient
// nur das Verhalten der schon vorhandenen DOM-Elemente.

import { buildItem } from "./navItems.js";
import { setupOpenClose } from "./navToggle.js";
import { setupScrollTrack } from "./navScrollTrack.js";

export function setupNav() {
  const nav = document.getElementById("site-nav");
  const linkContainer = document.querySelector("[data-nav-links]");
  const itemEls = document.querySelectorAll("[data-nav-item]");
  if (!nav || !linkContainer || itemEls.length === 0) return; // Seite ohne Menü

  const items = Array.from(itemEls)
    .map((wrapper) => buildItem(wrapper))
    .filter(Boolean)
    .sort((a, b) => a.slot - b.slot); // [Menü(0), Sprache(1), Kontakt(2)]
  if (items.length !== 3) return;

  setupOpenClose(nav, items);
  setupScrollTrack(nav, items);
}