// swipeGesture.js
//
// Allgemeiner Touch-Wisch-Helfer, unabhängig von Events/Karussell-
// Details - kennt weder EventsCarouselState noch data-events-*-
// Attribute, sondern nimmt nur ein beliebiges DOM-Element und ein paar
// Callbacks entgegen. Dadurch überall wiederverwendbar, wo etwas per
// Finger-Wisch gesteuert werden soll (aktuell: das horizontale
// Zukunfts-Karussell und das vertikale Erinnerungen-Karussell in
// eventsCarousel.js; die Lightbox in gallery.js wäre ein plausibler
// dritter Anwendungsfall). Folgt damit demselben Muster wie die
// anderen fokussierten Dateien in diesem Projekt (heroAmbient.js,
// phoneContact.js, nav.js, ...).

/**
 * Verbindet ein Element mit Touch-Wisch-Erkennung (horizontal ODER
 * vertikal, je nach `axis`).
 *
 * Funktionsweise: touchstart merkt sich die Startposition. touchmove
 * "sperrt" nach den ersten ~10px Bewegung die Wisch-Richtung
 * (horizontal ODER vertikal, je nachdem was überwiegt) - erst danach
 * wird per preventDefault() verhindert, dass der Browser gleichzeitig
 * die Seite scrollt, und zwar NUR wenn die gesperrte Richtung zur
 * `axis` dieses Elements passt (ein vertikaler Wisch auf einem
 * horizontal ausgerichteten Element blockiert also z.B. nicht das
 * normale Scrollen der Seite). touchend vergleicht Start- und
 * Endposition; ist der Unterschied größer als `threshold` (in Pixeln),
 * wird onNext()/onPrev() ausgelöst.
 *
 * @param {Element} element - Das Element, auf dem gewischt werden soll.
 * @param {Object} options
 * @param {"horizontal"|"vertical"} options.axis - Welche Wisch-Richtung
 *   ausgewertet wird (die jeweils andere Richtung wird ignoriert, damit
 *   z.B. normales Scrollen der Seite bei einem horizontalen Karussell
 *   nicht blockiert wird).
 * @param {number} [options.threshold=40] - Mindest-Wegstrecke in Pixeln,
 *   ab der eine Bewegung als Wisch (statt als Tippen/Zittern) zählt.
 * @param {Function} [options.onNext] - Wird bei Wisch nach links (axis:
 *   horizontal) bzw. nach oben (axis: vertical) aufgerufen.
 * @param {Function} [options.onPrev] - Wird bei Wisch nach rechts (axis:
 *   horizontal) bzw. nach unten (axis: vertical) aufgerufen.
 * @param {Function} [options.onDragStart] - Wird bei touchstart
 *   aufgerufen (z.B. um währenddessen einen Autoplay-Timer zu
 *   pausieren).
 * @param {Function} [options.onDragEnd] - Wird bei touchend/touchcancel
 *   aufgerufen (z.B. um einen Autoplay-Timer wieder zu starten).
 * @param {string} [options.ignoreSelector] - Startet die Geste
 *   innerhalb eines Elements, das diesem CSS-Selector entspricht (z.B.
 *   ein Textblock, der selbst per overflow-y: auto scrollt), wird die
 *   gesamte Geste ignoriert - der Finger soll dort ganz normal den
 *   Inhalt scrollen können, statt versehentlich die Wisch-Aktion
 *   auszulösen.
 */
export function attachSwipeGesture(
  element,
  { axis, threshold = 40, onPrev, onNext, onDragStart, onDragEnd, ignoreSelector } = {}
) {
  if (!element) return;

  let startX = 0;
  let startY = 0;
  let tracking = false;
  let lockedAxis = null; // "horizontal" | "vertical" | null (noch nicht entschieden)
  let ignoring = false;

  element.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) return; // Pinch-Zoom o.ä. nicht als Wisch werten
      ignoring = Boolean(ignoreSelector && event.target.closest(ignoreSelector));
      if (ignoring) return; // Finger startet z.B. im scrollbaren Text - normal scrollen lassen
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      lockedAxis = null;
      if (onDragStart) onDragStart();
    },
    { passive: true }
  );

  element.addEventListener(
    "touchmove",
    (event) => {
      if (!tracking) return;
      const touch = event.touches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = touch.clientY - startY;

      if (lockedAxis === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        lockedAxis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      if (lockedAxis === axis) {
        // Passt zur Wisch-Achse dieses Elements - verhindert, dass der
        // Browser währenddessen die Seite mitscrollt/mitzieht.
        event.preventDefault();
      }
    },
    { passive: false }
  );

  function finishGesture(touch) {
    tracking = false;
    if (onDragEnd) onDragEnd();
    if (lockedAxis !== axis) return;

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const delta = axis === "horizontal" ? deltaX : deltaY;
    if (Math.abs(delta) < threshold) return;

    if (delta < 0) {
      if (onNext) onNext();
    } else {
      if (onPrev) onPrev();
    }
  }

  element.addEventListener(
    "touchend",
    (event) => {
      if (ignoring) {
        ignoring = false;
        return;
      }
      if (!tracking) return;
      finishGesture(event.changedTouches[0]);
    },
    { passive: true }
  );

  element.addEventListener(
    "touchcancel",
    () => {
      ignoring = false;
      if (!tracking) return;
      tracking = false;
      if (onDragEnd) onDragEnd();
    },
    { passive: true }
  );
}
