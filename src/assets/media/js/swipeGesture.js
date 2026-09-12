// swipeGesture.js
//
// Allgemeiner Touch-Wisch-Helfer, unabhängig von Events/Karussell-
// Details - kennt weder EventsCarouselState noch data-events-*-
// Attribute, sondern nimmt nur ein beliebiges DOM-Element und ein paar
// Callbacks entgegen. Dadurch überall wiederverwendbar, wo etwas per
// Finger-Wisch gesteuert werden soll.
//
// WICHTIG: Der Aufrufer sollte dieses Element an ein STABILES Element
// hängen, das sich selbst NICHT per CSS-Transform bewegt (z.B. den
// äußeren "Viewport"-Container mit overflow:hidden), NICHT an das sich
// bewegende Element selbst (z.B. den per translateX verschobenen
// "Track"). Grund: mobile Browser (v.a. iOS Safari) können die
// Touch-Erkennung an einem Element verlieren, das während der Geste
// per CSS-Transform bewegt wird - das äußerte sich als "nur der erste
// Wisch funktioniert, danach nie wieder". Die eigentliche visuelle
// Bewegung (z.B. des Tracks) kann der Aufrufer unabhängig davon in
// onDragMove/onNext/onPrev selbst umsetzen.
//
// Unterstützt "Live-Mitziehen": über onDragMove(delta) kann der
// Aufrufer die Karte/Karussell-Folie während des Wischens in Echtzeit
// dem Finger folgen lassen. onDragCancel() wird aufgerufen, wenn die
// Geste zwar erkannt, aber die Wegstrecke unter dem Schwellenwert
// bleibt - der Aufrufer soll dann sanft zur Ausgangsposition
// zurückspringen.

/**
 * Verbindet ein Element mit Touch-Wisch-Erkennung (horizontal ODER
 * vertikal, je nach `axis`).
 *
 * @param {Element} element - Das (idealerweise unbewegte) Element, auf
 *   dem gewischt werden soll.
 * @param {Object} options
 * @param {"horizontal"|"vertical"} options.axis
 * @param {number} [options.threshold=40] - Mindest-Wegstrecke in Pixeln,
 *   ab der eine Bewegung als Wisch (statt als Tippen/Zittern) zählt.
 * @param {Function} [options.onNext]
 * @param {Function} [options.onPrev]
 * @param {Function} [options.onDragStart] - Bei touchstart.
 * @param {Function} [options.onDragMove] - Bei jeder Bewegung NACH
 *   Achsen-Festlegung (nur wenn die Achse zu `axis` passt). Bekommt den
 *   aktuellen Versatz in Pixeln entlang dieser Achse übergeben.
 * @param {Function} [options.onDragEnd] - Immer am Ende einer Geste
 *   (Erfolg, Abbruch oder touchcancel).
 * @param {Function} [options.onDragCancel] - Wenn die Achse passte,
 *   aber die Wegstrecke unter dem Schwellenwert blieb.
 * @param {string} [options.ignoreSelector]
 */
export function attachSwipeGesture(
  element,
  {
    axis,
    threshold = 40,
    onPrev,
    onNext,
    onDragStart,
    onDragMove,
    onDragEnd,
    onDragCancel,
    ignoreSelector,
  } = {}
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

      // Schnelle, einfache Entscheidung bei den ersten ~10px Bewegung.
      if (lockedAxis === null && (Math.abs(deltaX) > 10 || Math.abs(deltaY) > 10)) {
        lockedAxis = Math.abs(deltaX) > Math.abs(deltaY) ? "horizontal" : "vertical";
      }

      if (lockedAxis === axis) {
        event.preventDefault();
        if (onDragMove) onDragMove(axis === "horizontal" ? deltaX : deltaY);
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

    if (Math.abs(delta) < threshold) {
      if (onDragCancel) onDragCancel();
      return;
    }

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
      if (lockedAxis === axis && onDragCancel) onDragCancel();
    },
    { passive: true }
  );
}