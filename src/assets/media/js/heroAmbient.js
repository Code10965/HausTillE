/**
 * heroAmbient.js: echte Zufallsbewegung statt fester CSS-@keyframes-Schleife.
 *
 * Prinzip: Für jede Ebene (.ambient-layer-1 bis -5) wird wiederholt ein
 * neues, zufälliges Ziel bestimmt (Position, Skalierung, Rotation,
 * Übergangsdauer) und über CSS-Variablen (--drift-x, --drift-y,
 * --drift-scale, --drift-rotate, --drift-duration) an das Element
 * übergeben. Das eigentliche "Hingleiten" übernimmt CSS per
 * `transition: transform ...` (siehe styles.css, .ambient-layer) -
 * JS setzt nur das Ziel, nie den Zwischenzustand. Nach dem Erreichen des
 * Ziels wartet die Ebene eine zufällige Pause, bevor das nächste Ziel
 * bestimmt wird ("pulsierend" statt durchgehend).
 *
 * WICHTIG: Der Effekt kommt inzwischen an MEHREREN Stellen auf der Seite
 * vor (Hero + zwei Content-Sections), jede mit eigenem ".ambient-bg"-
 * Container und eigenen fünf ".ambient-layer-*"-Kindern. Deshalb wird
 * hier zuerst über ALLE ".ambient-bg"-Container iteriert und die Suche
 * nach den Ebenen JEWEILS NUR INNERHALB des jeweiligen Containers
 * ausgeführt (container.querySelector(...), nicht document.querySelector(...)).
 * Würde stattdessen global gesucht, fände man nur die JEWEILS ERSTE
 * Ebene mit einem bestimmten Klassennamen auf der ganzen Seite - alle
 * weiteren Vorkommen (die Ebenen in den beiden Content-Sections) blieben
 * dann unbewegt stehen.
 *
 * Jede Ebenen-Konfiguration (Bewegungsradius, Tempo, Pausenlänge) wird
 * für jede Instanz erneut verwendet, aber jede Instanz würfelt ihre
 * eigenen Zufallswerte - dadurch laufen z.B. "Ebene 1 im Hero" und
 * "Ebene 1 in section-home-details" trotz gleicher Konfiguration nie im
 * gleichen Rhythmus.
 */
(function () {
  "use strict";

  var prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  if (prefersReducedMotion) return; // Ebenen bleiben an ihrem CSS-Ankerpunkt stehen.

  // Zufallszahl zwischen min und max (inklusive min, exklusive max).
  function randomBetween(min, max) {
    return min + Math.random() * (max - min);
  }

  // Konfiguration pro Ebenen-Position (1-5): eigener Bewegungsradius,
  // eigenes Tempo, eigene Pausenlänge - sorgt dafür, dass die Ebenen
  // sich nie synchron oder identisch anfühlen.
  var layerConfigs = [
    {
      className: "ambient-layer-1",
      xRange: [-32, 32],
      yRange: [-28, 28],
      scaleRange: [0.85, 1.2],
      rotateRange: [0, 0],
      durationRange: [7, 13],
      pauseRange: [1, 4],
    },
    {
      className: "ambient-layer-2",
      xRange: [-30, 30],
      yRange: [-32, 32],
      scaleRange: [0.9, 1.15],
      rotateRange: [0, 0],
      durationRange: [10, 18],
      pauseRange: [2, 6],
    },
    {
      className: "ambient-layer-3",
      xRange: [-26, 26],
      yRange: [-24, 24],
      scaleRange: [0.88, 1.12],
      rotateRange: [-12, 12],
      durationRange: [6, 11],
      pauseRange: [1.5, 5],
    },
    {
      className: "ambient-layer-4",
      xRange: [-28, 28],
      yRange: [-26, 26],
      scaleRange: [0.86, 1.14],
      rotateRange: [-10, 10],
      durationRange: [9, 15],
      pauseRange: [1, 5],
    },
    {
      className: "ambient-layer-5",
      xRange: [-24, 24],
      yRange: [-30, 30],
      scaleRange: [0.9, 1.18],
      rotateRange: [0, 0],
      durationRange: [12, 20],
      pauseRange: [2, 7],
    },
  ];

  function animateLayer(el, config) {
    function driftToNewTarget() {
      var duration = randomBetween(
        config.durationRange[0],
        config.durationRange[1]
      );

      el.style.setProperty("--drift-duration", duration.toFixed(2) + "s");
      el.style.setProperty(
        "--drift-x",
        randomBetween(config.xRange[0], config.xRange[1]).toFixed(1) + "%"
      );
      el.style.setProperty(
        "--drift-y",
        randomBetween(config.yRange[0], config.yRange[1]).toFixed(1) + "%"
      );
      el.style.setProperty(
        "--drift-scale",
        randomBetween(config.scaleRange[0], config.scaleRange[1]).toFixed(3)
      );
      el.style.setProperty(
        "--drift-rotate",
        randomBetween(config.rotateRange[0], config.rotateRange[1]).toFixed(
          1
        ) + "deg"
      );

      var pause = randomBetween(config.pauseRange[0], config.pauseRange[1]);
      // Nächstes Ziel erst nach Übergang + Pause bestimmen.
      window.setTimeout(driftToNewTarget, (duration + pause) * 1000);
    }

    // Leicht versetzter Start pro Ebene, damit nicht alle im selben
    // Moment ihr erstes Ziel anfahren.
    window.setTimeout(driftToNewTarget, randomBetween(0, 1500));
  }

  document.querySelectorAll(".ambient-bg").forEach(function (container) {
    layerConfigs.forEach(function (config) {
      var el = container.querySelector("." + config.className);
      if (!el) return; // Diese Ebene gibt es in diesem Container nicht.
      animateLayer(el, config);
    });
  });
})();

var heroVideo = document.getElementById("hero_Video_loop");
if (heroVideo) {
  heroVideo.playbackRate = 0.5; // 1 = normal
}