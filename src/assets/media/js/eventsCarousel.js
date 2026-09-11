// eventsCarousel.js
//
// Vier Teile:
//   1. EventsCarouselState        - reine Zustandsverwaltung (welcher
//      Index ist aktiv?), kennt weder DOM noch Timer.
//   2. createCarouselController   - verbindet EventsCarouselState mit
//      dem tatsächlichen HTML (Pfeile, Punkte, optionaler
//      Play/Pause-Button, optionaler Autoplay-Timer, echtes
//      Fingerwischen). Wird sowohl für das horizontale
//      Zukunfts-Karussell ALS AUCH für den mobilen Klon des
//      Erinnerungen-Karussells verwendet (siehe events.njk,
//      data-events-scope="past-mobile") - dadurch verhalten sich beide
//      strukturell identisch (Pfeile, Punkte, Wischen), nur der
//      Play/Pause-Button/Autoplay ist beim Erinnerungen-Klon bewusst
//      deaktiviert (siehe setupEventsCarousel() weiter unten).
//   3. partitionEventsByDate       - entscheidet beim Laden der Seite
//      im Browser (nicht beim Bauen der Seite!), welche Events
//      "Zukunft" (inkl. heute) und welche "Vergangenheit" sind, und
//      entfernt die jeweils falsche Hälfte aus JEDEM der drei
//      Karussells (Zukunft, Erinnerungen-Desktop-Flip,
//      Erinnerungen-Mobile-Klon).
//   4. createPastCarouselController - das Desktop-Flip-Kalender-
//      Karussell für vergangene Events (ab 900px sichtbar, siehe CSS
//      .past-flip-desktop). Unter 900px wird stattdessen der mobile
//      Klon aus Teil 2 gezeigt (siehe .past-mobile-carousel in CSS).

/**
 * Reine Index-Verwaltung für ein Karussell mit `count` Folien (die
 * Klasse selbst kennt keine Obergrenze - sie funktioniert für jede
 * Anzahl >= 1). next()/prev() springen am Rand jeweils zum anderen Ende
 * ("Endlos-Schleife"), goTo() prüft den übergebenen Index und wirft
 * einen Fehler bei ungültigen Werten, statt sich stillschweigend falsch
 * zu verhalten.
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
// Ab wie viel Pixeln horizontaler Fingerbewegung ein Wisch als
// "gemeint" zählt, statt als zufälliges Zittern/Antippen gewertet zu
// werden.
const SWIPE_THRESHOLD_PX = 40;

/**
 * Verbindet EventsCarouselState mit einem einzelnen
 * [data-events-carousel] Container. Wird von setupEventsCarousel() pro
 * gefundenem Karussell aufgerufen (Muster wie heroAmbient.js: mehrere
 * Instanzen auf einer Seite sollen unabhängig voneinander laufen
 * können) - trifft sowohl auf das echte Zukunfts-Karussell als auch auf
 * den mobilen Erinnerungen-Klon zu (siehe Dateikopf-Kommentar).
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

  // Pfeiltasten navigieren, sobald der Fokus irgendwo im Karussell
  // liegt (auf einem der Buttons oder Punkte) - Leertaste auf dem
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
  // automatischen Ablauf - "entspannt" heißt auch: nicht weiterlaufen,
  // während jemand gerade eine Beschreibung liest.
  container.addEventListener("mouseenter", () => {
    hovering = true;
    restartTimer();
  });
  container.addEventListener("mouseleave", () => {
    hovering = false;
    restartTimer();
  });
  container.addEventListener("focusin", () => {
    hovering = true;
    restartTimer();
  });
  container.addEventListener("focusout", () => {
    hovering = false;
    restartTimer();
  });

  // ---------- Echtes Fingerwischen (Pointer-Events) ----------
  // Pointer-Events decken Maus UND Touch einheitlich mit derselben API
  // ab. Ein Schwellenwert für die HORIZONTALE Bewegung verhindert, dass
  // normales vertikales Scrollen der Seite versehentlich als
  // Wisch-Navigation missverstanden wird - erst wenn die horizontale
  // Bewegung klar überwiegt, zählt der Ausschlag als Wisch-Kandidat.
  // Gilt für JEDES Karussell, das createCarouselController nutzt -
  // also sowohl das Zukunfts-Karussell als auch den mobilen
  // Erinnerungen-Klon (siehe events.njk).
  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let isSwiping = false;

  track.addEventListener("pointerdown", (event) => {
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    isSwiping = false;
  });

  track.addEventListener("pointermove", (event) => {
    if (event.pointerId !== pointerId) return;
    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    if (!isSwiping && Math.abs(deltaX) > 10 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = true;
    }
  });

  track.addEventListener("pointerup", (event) => {
    if (event.pointerId !== pointerId) return;
    if (isSwiping) {
      const deltaX = event.clientX - startX;
      if (deltaX <= -SWIPE_THRESHOLD_PX) {
        next();
      } else if (deltaX >= SWIPE_THRESHOLD_PX) {
        prev();
      }
    }
    pointerId = null;
    isSwiping = false;
  });

  track.addEventListener("pointercancel", () => {
    pointerId = null;
    isSwiping = false;
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

// ---------- Einstiegspunkt: Zukunfts-Karussell UND mobiler Erinnerungen-Klon ----------
// Wird aus main.js aufgerufen. Sucht ALLE [data-events-carousel] auf
// der aktuellen Seite - das trifft sowohl auf das echte
// Zukunfts-Karussell (data-events-scope="future") als auch auf den
// mobilen Erinnerungen-Klon (data-events-scope="past-mobile") zu, da
// createCarouselController generisch über data-events-*-Attribute
// arbeitet, unabhängig vom Scope-Wert. WICHTIG: partitionEventsByDate()
// muss VORHER gelaufen sein (siehe setupAllEventCarousels() weiter
// unten), sonst zählt dieser Aufruf noch die ungefilterten,
// kompletten Events.
export function setupEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-events-carousel]"));
  return containers
    .map((container) => {
      const controller = createCarouselController(container);
      // Der mobile Erinnerungen-Klon soll - wie sein
      // Desktop-Flip-Pendant - KEIN automatisches Weiterlaufen haben:
      // Erinnerungen sollen bewusst durchgeblättert werden. Da dieser
      // Klon (anders als das echte Zukunfts-Karussell) keinen
      // Play/Pause-Button im Markup hat, würde createCarouselController
      // sonst standardmäßig trotzdem automatisch starten (siehe
      // "userPlaying"-Startwert dort) - hier explizit abgeschaltet.
      if (controller && container.dataset.eventsScope === "past-mobile") {
        controller.setPlaying(false);
      }
      return controller;
    })
    .filter(Boolean);
}

// =========================================================================
// Datums-Aufteilung: Zukunft (inkl. heute) vs. Vergangenheit
// =========================================================================

/** Lokales Datum (nicht UTC!) als "YYYY-MM-DD"-String. */
function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Das für den Datumsvergleich relevante Ende eines Events. */
function slideEndDate(slide) {
  return slide.dataset.dateEnd || slide.dataset.dateStart || null;
}

/** Baut die Punkte-Navigation dynamisch aus der tatsächlichen Anzahl
 * übrig gebliebener Folien - für Zukunfts-Karussell UND mobilen
 * Erinnerungen-Klon gleichermaßen nutzbar. */
function buildDots(container, count) {
  const dotsWrap = container.querySelector("[data-events-dots]");
  if (!dotsWrap) return;
  dotsWrap.innerHTML = "";
  const gotoLabel = container.dataset.gotoAria || "";
  for (let i = 0; i < count; i++) {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = "events-dot" + (i === 0 ? " is-active" : "");
    dot.dataset.eventsDot = String(i);
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-selected", i === 0 ? "true" : "false");
    dot.setAttribute("aria-label", gotoLabel ? `${gotoLabel} ${i + 1}` : String(i + 1));
    dotsWrap.appendChild(dot);
  }
}

/** Blendet Viewport + Regler aus und die "keine Events"-Meldung ein
 * (oder umgekehrt) - funktioniert für alle drei Karussell-Varianten. */
function toggleEmptyState(container, isEmpty) {
  const empty = container.querySelector("[data-events-empty], [data-past-empty]");
  const controls = container.querySelector("[data-events-controls], [data-past-controls]");
  const viewport = container.querySelector("[data-events-viewport], [data-past-viewport]");
  if (empty) empty.classList.toggle("is-hidden", !isEmpty);
  if (controls) controls.classList.toggle("is-hidden", isEmpty);
  if (viewport) viewport.classList.toggle("is-hidden", isEmpty);
}

/**
 * Teilt die vorgerenderten Folien in allen drei Karussell-Varianten
 * nach Datum auf:
 *   - [data-events-scope="future"]: nur zukünftige (inkl. heute)
 *     bleiben, aufsteigend sortiert (Reihenfolge kommt schon so aus
 *     sortedEvents[lang]).
 *   - [data-events-scope="past-mobile"]: nur vergangene bleiben,
 *     UMGEKEHRT sortiert (neuestes zuerst) - der mobile Klon des
 *     Erinnerungen-Karussells.
 *   - [data-past-carousel]: dieselbe Vergangenheits-Filterung wie
 *     oben, aber für den Desktop-Flip-Effekt mit seinen eigenen
 *     data-past-*-Attributen.
 *
 * Muss VOR createCarouselController()/createPastCarouselController()
 * aufgerufen werden.
 */
export function partitionEventsByDate(root = document, today = localISODate()) {
  root.querySelectorAll('[data-events-carousel][data-events-scope="future"]').forEach((container) => {
    const track = container.querySelector("[data-events-track]");
    if (!track) return;

    Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]")).forEach((slide) => {
      const end = slideEndDate(slide);
      if (end && end < today) slide.remove();
    });

    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]"));
    const ofLabel = container.dataset.ofLabel || "";
    remaining.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      const title = slide.dataset.title;
      if (title) {
        slide.setAttribute("aria-label", `${title} (${i + 1} ${ofLabel} ${remaining.length})`.trim());
      }
    });
    buildDots(container, remaining.length);
    toggleEmptyState(container, remaining.length === 0);
  });

  // Mobiler Klon des Erinnerungen-Karussells (siehe events.njk) -
  // "spiegelverkehrt" zum future-Zweig oben gefiltert (nur VERGANGENE
  // Events bleiben, neuestes zuerst), ansonsten identisch verarbeitet
  // (Punkte-Navigation, nummeriertes aria-label).
  root.querySelectorAll('[data-events-carousel][data-events-scope="past-mobile"]').forEach((container) => {
    const track = container.querySelector("[data-events-track]");
    if (!track) return;

    Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]")).forEach((slide) => {
      const end = slideEndDate(slide);
      if (!end || end >= today) slide.remove();
    });

    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-events-slide]")).reverse();
    remaining.forEach((slide) => track.appendChild(slide));

    const ofLabel = container.dataset.ofLabel || "";
    remaining.forEach((slide, i) => {
      slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
      const title = slide.dataset.title;
      if (title) {
        slide.setAttribute("aria-label", `${title} (${i + 1} ${ofLabel} ${remaining.length})`.trim());
      }
    });
    buildDots(container, remaining.length);
    toggleEmptyState(container, remaining.length === 0);
  });

  root.querySelectorAll("[data-past-carousel]").forEach((container) => {
    const track = container.querySelector("[data-past-track]");
    if (!track) return;

    Array.prototype.slice.call(track.querySelectorAll("[data-past-slide]")).forEach((slide) => {
      const end = slideEndDate(slide);
      if (!end || end >= today) slide.remove();
    });

    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-past-slide]")).reverse();
    remaining.forEach((slide) => track.appendChild(slide));

    toggleEmptyState(container, remaining.length === 0);
  });
}

// =========================================================================
// Desktop: vertikales "Erinnerungen"-Karussell (Flip-Kalender-Optik)
// =========================================================================
// Nur noch für die Desktop-Darstellung (ab 900px, siehe
// .past-flip-desktop in styles.css) - die mobile Darstellung nutzt
// stattdessen createCarouselController() weiter oben (identisch zum
// Zukunfts-Karussell).

const DEFAULT_PAST_OF_LABEL = "von";

/**
 * Verbindet ein einzelnes [data-past-carousel] mit seinem HTML:
 *   - KEINE Endlos-Schleife: Erinnerungen sind ein endlicher, geordneter
 *     Stapel - am Anfang/Ende angekommen, deaktiviert sich der jeweilige
 *     Pfeil, statt am anderen Ende weiterzuspringen.
 *   - KEIN Autoplay.
 *   - Flip-Effekt: alle Karten liegen übereinandergestapelt in
 *     .past-viewport (mit CSS-perspective), nur .is-current liegt
 *     flach/sichtbar oben. Die CSS-Klassen is-before/is-current/
 *     is-after erzeugen den Umblätter-Eindruck allein durch eine
 *     CSS-Transition auf transform/opacity.
 */
export function createPastCarouselController(container) {
  const track = container.querySelector("[data-past-track]");
  const slides = Array.prototype.slice.call(container.querySelectorAll("[data-past-slide]"));
  if (!track || slides.length === 0) return null;

  const prevBtn = container.querySelector("[data-past-prev]");
  const nextBtn = container.querySelector("[data-past-next]");
  const counter = container.querySelector("[data-past-counter]");
  const liveRegion = container.querySelector("[data-past-live]");
  const ofLabel = container.dataset.ofLabel || DEFAULT_PAST_OF_LABEL;

  let index = 0;

  function render() {
    slides.forEach((slide, i) => {
      slide.classList.toggle("is-current", i === index);
      slide.classList.toggle("is-before", i < index);
      slide.classList.toggle("is-after", i > index);
      slide.setAttribute("aria-hidden", i === index ? "false" : "true");
    });

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;

    if (counter) counter.textContent = `${index + 1}/${slides.length}`;

    if (liveRegion) {
      const label = slides[index].getAttribute("aria-label") || "";
      liveRegion.textContent = label;
    }
  }

  function goTo(i) {
    if (i < 0 || i >= slides.length) return;
    index = i;
    render();
  }

  function prev() {
    goTo(index - 1);
  }

  function next() {
    goTo(index + 1);
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);

  container.addEventListener("keydown", (event) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      prev();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      next();
    }
  });

  render();

  return {
    goTo,
    next,
    prev,
    get index() {
      return index;
    },
    get count() {
      return slides.length;
    },
  };
}

// ---------- Einstiegspunkt: Desktop-Erinnerungen-Karussell ----------
export function setupPastEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-past-carousel]"));
  return containers
    .map((container) => createPastCarouselController(container))
    .filter(Boolean);
}

// ---------- Kombinierter Einstiegspunkt ----------
export function setupAllEventCarousels(root = document) {
  partitionEventsByDate(root);
  return {
    future: setupEventsCarousel(root),
    past: setupPastEventsCarousel(root),
  };
}