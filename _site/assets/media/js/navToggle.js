// ---------- Öffnen/Schließen: immer nur EIN Dropdown gleichzeitig ----------
// Klick auf eine Kugel öffnet ihr Dropdown und schließt automatisch die
// beiden anderen. Klick außerhalb, Escape-Taste oder Klick auf einen Link
// im Dropdown schließen es wieder. Dieses Verhalten ist komplett
// unabhängig davon, WO die Kugeln gerade positioniert sind (das regelt
// navScrollTrack.js) - daher als eigenes Modul.
export function setupOpenClose(nav, items) {
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
      if (item.wrapper.classList.contains("open")) {
        closeItem(item);
      } else {
        openItem(item);
      }
    });

    item.wrapper.addEventListener("mouseenter", () => openItem(item));
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