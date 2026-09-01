// ---------- Einstiegspunkt ----------
// Bindet die einzelnen, fachlich getrennten Module ein und startet sie.
// Jedes Modul prüft selbst, ob seine Elemente auf der aktuellen Seite
// überhaupt existieren - daher kann diese Datei unverändert auf allen
// drei Seiten (Startseite, Impressum, Datenschutz) eingebunden werden.
import { setupCrossfadeGroups } from "./crossfade.js";
import { setupScrollReveal } from "./scrollReveal.js";
import { setupHeroReveal } from "./heroReveal.js";
import { renderEmailContacts } from "./emailContact.js";
import { renderPhoneContacts } from "./phoneContact.js";
import { alignContactBoxWidths } from "./contactUtils.js";
import { setupGallery } from "./gallery.js";
import { setupNav } from "./nav.js";

document.addEventListener("DOMContentLoaded", () => {
  setupCrossfadeGroups();
  setupScrollReveal();
  setupHeroReveal();
  renderEmailContacts();
  renderPhoneContacts();
  alignContactBoxWidths(); 
  alignContactBoxWidths(".copy-btn");
  setupGallery();
  setupNav();
});