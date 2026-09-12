// swipeGesture.js
//
// TEMPORÄR MIT VOLLSTÄNDIGEM DEBUG-LOGGING (auch für fehlgeschlagene
// Versuche!) - zur letzten, endgültigen Fehlersuche. Nach Klärung
// wieder auf die logfreie Fassung zurückwechseln.

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
  if (!element) {
    console.log("[swipe] KEIN element übergeben.");
    return;
  }

  let startX = 0;
  let startY = 0;
  let tracking = false;
  let lockedAxis = null;
  let ignoring = false;
  let gestureCount = 0;

  element.addEventListener(
    "touchstart",
    (event) => {
      if (event.touches.length !== 1) {
        console.log("[swipe] touchstart ignoriert - Mehrfachberührung:", event.touches.length);
        return;
      }
      ignoring = Boolean(ignoreSelector && event.target.closest(ignoreSelector));
      if (ignoring) {
        console.log("[swipe] touchstart ignoriert - ignoreSelector getroffen.");
        return;
      }
      gestureCount++;
      const touch = event.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
      tracking = true;
      lockedAxis = null;
      console.log(`[swipe] === Geste #${gestureCount} gestartet === startX:`, startX, "startY:", startY);
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
        console.log(`[swipe] Geste #${gestureCount} - Achse gesperrt:`, lockedAxis, "(deltaX:", deltaX.toFixed(1), "deltaY:", deltaY.toFixed(1), ")");
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

    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    console.log(
      `[swipe] Geste #${gestureCount} beendet. lockedAxis:`, lockedAxis,
      "- erwartet:", axis,
      "- deltaX:", deltaX.toFixed(1),
      "- deltaY:", deltaY.toFixed(1)
    );

    if (lockedAxis !== axis) {
      console.log(`[swipe] Geste #${gestureCount} -> ABBRUCH: falsche/keine Achse.`);
      return;
    }

    const delta = axis === "horizontal" ? deltaX : deltaY;
    if (Math.abs(delta) < threshold) {
      console.log(`[swipe] Geste #${gestureCount} -> ABBRUCH: nur`, Math.abs(delta).toFixed(1), "px, Schwelle ist", threshold, "px.");
      if (onDragCancel) onDragCancel();
      return;
    }

    if (delta < 0) {
      console.log(`[swipe] Geste #${gestureCount} -> onNext() wird aufgerufen.`);
      if (onNext) onNext();
    } else {
      console.log(`[swipe] Geste #${gestureCount} -> onPrev() wird aufgerufen.`);
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
      console.log(`[swipe] Geste #${gestureCount} - touchcancel (System hat die Geste übernommen/abgebrochen).`);
      ignoring = false;
      if (!tracking) return;
      tracking = false;
      if (onDragEnd) onDragEnd();
      if (lockedAxis === axis && onDragCancel) onDragCancel();
    },
    { passive: true }
  );
}