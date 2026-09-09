// Jedes Modul prüft selbst, ob seine Elemente auf der aktuellen Seite
// überhaupt existieren - daher kann diese Datei unverändert auf allen
// Seiten (Startseite, Impressum, Datenschutz, Events, ...) eingebunden
// werden.
import { setupCrossfadeGroups } from "./crossfade.js";
import { setupScrollReveal } from "./scrollReveal.js";
import { setupHeroReveal } from "./heroReveal.js";
import { renderEmailContacts } from "./emailContact.js";
import { renderPhoneContacts } from "./phoneContact.js";
import { alignContactBoxWidths } from "./contactUtils.js";
import { setupGallery } from "./gallery.js";
import { setupNav } from "./nav.js";
import { setupAllEventCarousels } from "./eventsCarousel.js";

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
  // WICHTIG: setupAllEventCarousels() statt einzeln setupEventsCarousel() -
  // erst diese Funktion teilt die Events per partitionEventsByDate() nach
  // "heute" in Zukunft/Vergangenheit auf, BEVOR beide Karussells (das
  // horizontale links und das vertikale "Erinnerungen"-Karussell rechts)
  // initialisiert werden. Ruft man stattdessen weiterhin nur
  // setupEventsCarousel() auf, bleiben im linken Karussell auch
  // vergangene Events sichtbar, und die Punkte-Navigation darunter
  // bleibt leer (siehe eventsCarousel.js für Details).
  // Läuft auf Seiten ohne [data-events-carousel]/[data-past-carousel]
  // einfach ins Leere.
  setupAllEventCarousels();
});