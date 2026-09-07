// ---------- Events-Karussell ----------
// Zwei Teile bewusst getrennt, damit sich die eigentliche Logik ohne
// echten Browser (also auch in automatisierten Tests mit jsdom/Vitest)
// prüfen lässt:
//
//   1. EventsCarouselState  - reine Zustandsverwaltung (welcher Index
//      ist gerade aktiv?), kennt weder DOM noch Timer. Wird direkt in
//      eventsCarousel.test.js getestet.
//   2. setupEventsCarousel  - verbindet EventsCarouselState mit dem
//      tatsächlichen HTML (Pfeile, Punkte, Pause-Button, Autoplay-Timer)
//      genau wie die anderen setup*()-Funktionen in diesem Projekt
//      (siehe nav.js, gallery.js): sucht sich seine Elemente selbst,
//      läuft ins Leere, wenn keine da sind.

/**
 * Reine Index-Verwaltung für ein Karussell mit `count` Folien (3 bis 10
 * Events, aber die Klasse selbst kennt dieses Limit nicht - sie
 * funktioniert für jede Anzahl >= 1). next()/prev() springen am Rand
 * jeweils zum anderen Ende ("Endlos-Schleife"), goTo() prüft den
 * übergebenen Index und wirft einen Fehler bei ungültigen Werten,
 * statt sich stillschweigend falsch zu verhalten.
 */
export class EventsCarouselState {
  constructor(count, startIndex = 0) {
    if (!Number.isInteger(count) || count < 1) {
      throw new RangeError("EventsCarouselState braucht mindestens 1 Folie.");
    }
    this.count = count;
    this.index = EventsCarouselState.wrap(startIndex, count);
  }

  static wrap(index, count) {
    return ((index % count) + count) % count;
  }

  next() {
    this.index = EventsCarouselState.wrap(this.index + 1, this.count);
    return this.index;
  }

  prev() {
    this.index = EventsCarouselState.wrap(this.index - 1, this.count);
    return this.index;
  }

  goTo(index) {
    if (!Number.isInteger(index) || index < 0 || index >= this.count) {
      throw new RangeError(
        `Index ${index} liegt außerhalb des gültigen Bereichs 0..${this.count - 1}.`
      );
    }
    this.index = index;
    return this.index;
  }
}

const DEFAULT_AUTOPLAY_MS = 6000;

/**
 * Verbindet EventsCarouselState mit einem einzelnen [data-events-carousel]
 * Container. Wird von setupEventsCarousel() pro gefundenem Karussell
 * aufgerufen (Muster wie heroAmbient.js: mehrere Instanzen auf einer
 * Seite sollen unabhängig voneinander laufen können).
 *
 * Gibt ein kleines Steuer-Objekt zurück (u.a. für Tests), das die Seite
 * selbst nicht braucht, aber die Testsuite nutzt, um ohne echte
 * Nutzerklicks Zustände zu prüfen.
 */
export function createCarouselController(container, { setIntervalFn, clearIntervalFn } = {}) {
  const track = container.querySelector("[data-events-track]");
  const slides = Array.prototype.slice.call(container.querySelectorAll("[data-events-slide]"));
  if (!track || slides.length === 0) return null;

  const prevBtn = container.querySelector("[data-events-prev]");
  const nextBtn = container.querySelector("[data-events-next]");
  const playPauseBtn = container.querySelector("[data-events-playpause]");
  const dots = Array.prototype.slice.call(container.querySelectorAll("[data-events-dot]"));
  const liveRegion = container.querySelector("[data-events-live]");
  const iconPause = playPauseBtn ? playPauseBtn.querySelector("[data-icon-pause]") : null;
  const iconPlay = playPauseBtn ? playPauseBtn.querySelector("[data-icon-play]") : null;

  const pauseLabel = playPauseBtn ? playPauseBtn.getAttribute("aria-label") : "";
  const playLabel = playPauseBtn ? playPauseBtn.dataset.playLabel || pauseLabel : "";

  const win = container.ownerDocument.defaultView || window;
  const setTimer = setIntervalFn || win.setInterval.bind(win);
  const clearTimer = clearIntervalFn || win.clearInterval.bind(win);

  const prefersReducedMotion =
    "matchMedia" in win && win.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const autoplayMs = parseInt(container.dataset.autoplayMs, 10) || DEFAULT_AUTOPLAY_MS;
  const state = new EventsCarouselState(slides.length, 0);

  // "userPlaying": will die Person Autoplay (Play/Pause-Button)?
  // "hovering"/"focused": ist die Maus/Tastatur gerade im Karussell?
  // Nur wenn BEIDES stimmt (Person will Autoplay UND schaut/klickt
  // gerade nicht hinein), läuft der Timer wirklich - reines Hovern
  // pausiert also automatisch mit, ohne den eigentlichen Pause-Knopf
  // umzuschalten (der behält seinen eigenen Zustand).
  let userPlaying = !prefersReducedMotion && slides.length > 1;
  let hovering = false;
  let timerId = null;

  function isEffectivelyPlaying() {
    return userPlaying && !hovering;
  }

  function render() {
    track.style.transform = `translateX(-${state.index * 100}%)`;

    slides.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === state.index ? "false" : "true");
    });

    dots.forEach((dot, i) => {
      const active = i === state.index;
      dot.classList.toggle("is-active", active);
      dot.setAttribute("aria-selected", active ? "true" : "false");
    });

    if (liveRegion) {
      const label = slides[state.index].getAttribute("aria-label") || "";
      liveRegion.textContent = label;
    }
  }

  function renderPlayState() {
    if (!playPauseBtn) return;
    const playing = userPlaying;
    playPauseBtn.setAttribute("aria-pressed", playing ? "false" : "true");
    if (playLabel && pauseLabel) {
      playPauseBtn.setAttribute("aria-label", playing ? pauseLabel : playLabel);
    }
    if (iconPause) iconPause.hidden = !playing;
    if (iconPlay) iconPlay.hidden = playing;
  }

  function stopTimer() {
    if (timerId !== null) {
      clearTimer(timerId);
      timerId = null;
    }
  }

  function startTimer() {
    stopTimer();
    if (!isEffectivelyPlaying()) return;
    timerId = setTimer(() => {
      state.next();
      render();
    }, autoplayMs);
  }

  function restartTimer() {
    stopTimer();
    startTimer();
  }

  function goTo(index) {
    state.goTo(index);
    render();
    restartTimer();
  }

  function next() {
    state.next();
    render();
    restartTimer();
  }

  function prev() {
    state.prev();
    render();
    restartTimer();
  }

  function setPlaying(playing) {
    userPlaying = playing;
    renderPlayState();
    restartTimer();
  }

  function togglePlaying() {
    setPlaying(!userPlaying);
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);
  if (playPauseBtn) playPauseBtn.addEventListener("click", togglePlaying);
  dots.forEach((dot, i) => dot.addEventListener("click", () => goTo(i)));

  // Pfeiltasten navigieren, sobald der Fokus irgendwo im Karussell liegt
  // (auf einem der Buttons oder Punkte) - Leertaste auf dem
  // Play/Pause-Button schaltet zusätzlich um (Standardverhalten von
  // <button> macht das ohnehin, hier nur zur Robustheit explizit).
  container.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      next();
    }
  });

  // Maus ODER Tastaturfokus irgendwo im Karussell pausiert den
  // automatischen Ablauf - AUSSER der Fokus liegt auf dem Play/Pause-
  // Button selbst. Sonst könnte man den Timer nie per Klick wieder
  // starten: ein Klick auf den Button gibt ihm zuerst den Fokus
  // (focusin feuert VOR dem eigentlichen click-Event), was "hovering"
  // sofort wieder auf true setzen und den gerade erst gestarteten
  // Timer sofort wieder stoppen würde - der Button würde sich also
  // selbst dauerhaft in Pause "einfrieren".
  container.addEventListener("mouseenter", () => {
    hovering = true;
    restartTimer();
  });
  container.addEventListener("mouseleave", () => {
    hovering = false;
    restartTimer();
  });
  container.addEventListener("focusin", (event) => {
    if (playPauseBtn && event.target === playPauseBtn) return;
    hovering = true;
    restartTimer();
  });
  container.addEventListener("focusout", (event) => {
    if (playPauseBtn && event.target === playPauseBtn) return;
    // Kleiner Timeout wäre "sauberer" bei schnellem Fokuswechsel
    // zwischen zwei Kindern, ist hier aber nicht nötig: focusin auf dem
    // nächsten Kind feuert vor focusout auf dem alten Browser-Verhalten
    // in modernen Browsern zuverlässig genug für diesen Anwendungsfall.
    hovering = false;
    restartTimer();
  });

  render();
  renderPlayState();
  startTimer();

  return {
    state,
    next,
    prev,
    goTo,
    setPlaying,
    togglePlaying,
    isPlaying: () => userPlaying,
    isEffectivelyPlaying,
    destroy: stopTimer,
  };
}

// ---------- Einstiegspunkt ----------
// Wird aus main.js aufgerufen (siehe dortige Ergänzung). Sucht alle
// Karussells auf der aktuellen Seite - auf den meisten Seiten gibt es
// keins, dann passiert einfach nichts.
export function setupEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-events-carousel]"));
  return containers
    .map((container) => createCarouselController(container))
    .filter(Boolean);
}