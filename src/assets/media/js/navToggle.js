// ---------- Öffnen/Schließen: immer nur EIN Dropdown gleichzeitig ----------
// Klick auf eine Kugel öffnet ihr Dropdown und schließt automatisch die
// beiden anderen. Klick außerhalb, Escape-Taste oder Klick auf einen Link
// im Dropdown schließen es wieder. Dieses Verhalten ist komplett
// unabhängig davon, WO die Kugeln gerade positioniert sind (das regelt
// navScrollTrack.js) - daher als eigenes Modul.
//
// ---------- Hover-Konflikt (WICHTIG) ----------
// Bei einer echten Maus feuert "mouseenter" IMMER kurz VOR dem eigentlichen
// Klick, weil die Maus sich erst über das Element bewegen muss, bevor
// geklickt werden kann. Ohne die Absicherung unten würde das zu diesem
// Ablauf führen:
//   1. Maus bewegt sich auf die Kugel -> mouseenter -> öffnet das Dropdown
//   2. Klick kommt hinterher -> Code sieht "ist schon offen" -> SCHLIESST
//      es sofort wieder
// Ergebnis: ein Klick öffnet das Menü kurz und klappt es im selben Moment
// wieder zu - bei einer echten Maus kaum sichtbar (wirkt wie "hat
// funktioniert"), aber bei automatisierten Tests (die exakt denselben
// Bewegen-dann-Klicken-Ablauf nachstellen) IMMER reproduzierbar fehlerhaft.
//
// Die Lösung: jedes Item merkt sich den Zeitpunkt seines letzten
// mouseenter. Kommt ein Klick sehr kurz danach (< 400ms), war das Öffnen
// bereits durch den Hover ausgelöst - der Klick lässt das Dropdown dann
// einfach offen, statt es zuzuklappen.
const HOVER_CLICK_GRACE_MS = 400;

export function setupOpenClose(nav, items) {
  items.forEach((item) => {
    item.lastMouseEnterAt = 0;
  });

  const openItem = (item) => {
    items.forEach((other) => {
      if (other !== item) closeItem(other);
    });
    item.wrapper.classList.add("open");
    item.toggle.setAttribute("aria-expanded", "true");
  };

  const closeItem = (item) => {
    item.wrapper.classList.remove("open");
    item.toggle.setAttribute("aria-expanded", "false");
    item.toggle.blur();
  };

  const closeAll = () => items.forEach(closeItem);

  items.forEach((item) => {
    item.toggle.addEventListener("click", () => {
      const openedByHoverJustNow =
        Date.now() - item.lastMouseEnterAt < HOVER_CLICK_GRACE_MS;

      if (item.wrapper.classList.contains("open")) {
        // Schon offen, aber NICHT durch diesen Klick selbst (sondern durch
        // den kurz vorher gefeuerten Hover) - dann lassen wir es offen,
        // statt es sofort wieder zuzuklappen. Ein bewusster zweiter Klick
        // (außerhalb des kurzen Zeitfensters) klappt weiterhin normal zu.
        if (!openedByHoverJustNow) {
          closeItem(item);
        }
      } else {
        openItem(item);
      }
    });

    item.wrapper.addEventListener("mouseenter", () => {
      item.lastMouseEnterAt = Date.now();
      openItem(item);
    });
    item.wrapper.addEventListener("mouseleave", () => closeItem(item));

    item.dropdown.querySelectorAll(".nav-link").forEach((link) => {
      link.addEventListener("click", () => closeItem(item));
    });
  });

  document.addEventListener("click", (e) => {
    const insideAny = items.some((item) => item.wrapper.contains(e.target));
    if (!insideAny) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });
}