/**
 * accordion.js: steuert das Öffnen/Schließen der .accordion-item Elemente.
 *
 * Die eigentliche Höhen-Animation (ruhig, geschmeidig) übernimmt CSS
 * über grid-template-rows (siehe styles.css, .accordion-panel) - JS
 * setzt hier nur zwei Dinge:
 *   1. die Klasse "is-open" am .accordion-item (steuert die CSS-Höhe)
 *   2. aria-expanded am Trigger-Button (steuert Wine-Hintergrund + für
 *      Screenreader, ob der Bereich aktuell offen ist)
 *
 * Verhalten: immer nur EIN Element gleichzeitig offen - ein Klick auf
 * ein geschlossenes Element schließt automatisch das vorher offene.
 * Ein Klick auf das bereits offene Element schließt es wieder.
 */
(function () {
  "use strict";

  document.querySelectorAll(".accordion").forEach(function (accordion) {
    var items = Array.prototype.slice.call(
      accordion.querySelectorAll(".accordion-item")
    );

    items.forEach(function (item) {
      var trigger = item.querySelector(".accordion-trigger");
      var panel = item.querySelector(".accordion-panel");
      if (!trigger || !panel) return;

      trigger.addEventListener("click", function () {
        var wasOpen = item.classList.contains("is-open");

        items.forEach(function (other) {
          var otherTrigger = other.querySelector(".accordion-trigger");
          var otherPanel = other.querySelector(".accordion-panel");
          other.classList.remove("is-open");
          if (otherTrigger) otherTrigger.setAttribute("aria-expanded", "false");
          if (otherPanel) otherPanel.setAttribute("aria-hidden", "true");
        });

        if (!wasOpen) {
          item.classList.add("is-open");
          trigger.setAttribute("aria-expanded", "true");
          panel.setAttribute("aria-hidden", "false");
        }
      });
    });
  });
})();