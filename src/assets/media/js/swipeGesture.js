// swipeGesture.js
//
// TEMPORÄR MIT DEBUG-LOGS - siehe "console.log('[swipe] ...')"-Zeilen.
// Diese Zeilen sind NUR zur Fehlersuche gedacht und sollten wieder
// entfernt werden, sobald das Wisch-Problem gefunden ist (siehe
// Originalversion ohne Logs).
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
 */
export function attachSwipeGesture(
  element,
  { axis, threshold = 40, onPrev, onNext, onDragStart, onDragEnd, ignoreSelector } = {}
) {
  if (!element) {
    console.log("[swipe] KEIN element übergeben - attachSwipeGesture bricht sofort ab.");
    return;
  }

  console.log("[swipe] attachSwipeGesture verbunden mit Element:", element, "axis:", axis);

  let startX = 0;
  let startY = 0;
  let tracking = false;
  let lockedAxis = null; // "horizontal" | "vertical" | null (noch nicht entschieden)
  let ignoring = false;

  element.addEventListener(
    "touchstart",
    (event) => {
      console.log("[swipe] touchstart erkannt. touches:", event.touches.length, "target:", event.target);
      if (event.touches.length !== 1) return; // Pinch-Zoom o.ä. nicht als Wisch werten
      ignoring = Boolean(ignoreSelector && event.target.closest(ignoreSelector));
      if (ignoring) {
        console.log("[swipe] wird ignoriert (ignoreSelector getroffen).");
        return;
      }
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
        console.log("[swipe] Achse gesperrt auf:", lockedAxis, "(deltaX:", deltaX, "deltaY:", deltaY, ")");
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

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    console.log("[swipe] touchend. lockedAxis:", lockedAxis, "erwartete axis:", axis, "deltaX:", deltaX, "deltaY:", deltaY);

    if (lockedAxis !== axis) {
      console.log("[swipe] ABBRUCH: gesperrte Achse passt nicht zur erwarteten Achse.");
      return;
    }

    const delta = axis === "horizontal" ? deltaX : deltaY;
    if (Math.abs(delta) < threshold) {
      console.log("[swipe] ABBRUCH: Bewegung", delta, "px unter Schwellenwert", threshold, "px.");
      return;
    }

    if (delta < 0) {
      console.log("[swipe] -> onNext() wird aufgerufen.");
      if (onNext) onNext();
    } else {
      console.log("[swipe] -> onPrev() wird aufgerufen.");
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
      console.log("[swipe] touchcancel ausgelöst (Geste abgebrochen, z.B. durch System-Geste).");
      ignoring = false;
      if (!tracking) return;
      tracking = false;
      if (onDragEnd) onDragEnd();
    },
    { passive: true }
  );
}