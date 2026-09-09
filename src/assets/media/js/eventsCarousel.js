// eventsCarousel.js
//
// Vier Teile:
//   1. EventsCarouselState        - reine Zustandsverwaltung für das
//      horizontale Zukunfts-Karussell (welcher Index ist aktiv?), kennt
//      weder DOM noch Timer. Wird direkt in eventsCarousel.test.js
//      getestet.
//   2. createCarouselController   - verbindet EventsCarouselState mit
//      dem tatsächlichen HTML (Pfeile, Punkte, Pause-Button,
//      Autoplay-Timer) genau wie die anderen setup*()-Funktionen in
//      diesem Projekt (siehe nav.js, gallery.js): sucht sich seine
//      Elemente selbst, läuft ins Leere, wenn keine da sind.
//   3. partitionEventsByDate       - NEU: entscheidet beim Laden der
//      Seite im Browser (nicht beim Bauen der Seite!), welche Events
//      "Zukunft" (inkl. heute) und welche "Vergangenheit" sind, und
//      entfernt die jeweils falsche Hälfte aus jedem Karussell.
//   4. createPastCarouselController - NEU: das vertikale
//      "Erinnerungen"-Karussell (Flip-Kalender-Optik) für vergangene
//      Events - anders als Teil 2 OHNE Endlos-Schleife (ein endlicher
//      Stapel Erinnerungen, kein Kreis) und ohne Autoplay.

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

/**
 * Verbindet EventsCarouselState mit einem einzelnen
 * [data-events-carousel] Container. Wird von setupEventsCarousel() pro
 * gefundenem Karussell aufgerufen (Muster wie heroAmbient.js: mehrere
 * Instanzen auf einer Seite sollen unabhängig voneinander laufen
 * können).
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

// ---------- Einstiegspunkt: horizontales Zukunfts-Karussell ----------
// Wird aus main.js aufgerufen. Sucht alle [data-events-carousel] auf
// der aktuellen Seite - auf den meisten Seiten gibt es keins, dann
// passiert einfach nichts. WICHTIG: partitionEventsByDate() muss VORHER
// gelaufen sein (siehe setupAllEventCarousels() weiter unten), sonst
// zählt dieser Aufruf noch die ungefilterten, kompletten 3-10 Events.
export function setupEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-events-carousel]"));
  return containers
    .map((container) => createCarouselController(container))
    .filter(Boolean);
}

// =========================================================================
// Datums-Aufteilung: Zukunft (inkl. heute) vs. Vergangenheit
// =========================================================================
// events.njk rendert ALLE Events aus t.events.items in BEIDE Karussells
// (das horizontale für "zukünftig" und das vertikale "Erinnerungen" für
// "vergangen") - jede Folie trägt data-date-start/data-date-end als
// ISO-Datum (z.B. "2026-10-11"). Ein beim Bauen der Seite statisch
// erzeugtes "heute" würde an dem Tag einfrieren, an dem die Seite
// zuletzt deployed wurde - "in drei Monaten noch zukünftig aussehende
// Events" wären dann plötzlich falsch einsortiert. Deshalb entscheidet
// erst der Browser BEIM LADEN der Seite, welche Folie in welches
// Karussell gehört, und entfernt die jeweils falsche Hälfte aus dem DOM,
// bevor die eigentlichen Karussell-Regler (Pfeile, Punkte, Autoplay)
// initialisiert werden.

/** Lokales Datum (nicht UTC!) als "YYYY-MM-DD"-String - Tagesgenauigkeit
 * reicht hier, echte Uhrzeiten spielen für "vergangen/zukünftig" keine
 * Rolle. toISOString() würde bei Zeitzonen abweichend vom lokalen
 * Kalendertag runden können, daher hier bewusst aus den lokalen
 * Datumsteilen zusammengesetzt statt über toISOString(). */
function localISODate(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Das für den Datumsvergleich relevante Ende eines Events - bei
 * mehrtägigen Events (data-date-end gesetzt) das Enddatum, sonst
 * einfach der Starttermin selbst. */
function slideEndDate(slide) {
  return slide.dataset.dateEnd || slide.dataset.dateStart || null;
}

/** Baut die Punkte-Navigation (die kleinen Kreise unter dem
 * horizontalen Karussell) dynamisch aus der tatsächlichen Anzahl
 * übrig gebliebener zukünftiger Folien - im Template werden bewusst
 * KEINE Punkte mehr vorgerendert, weil deren Anzahl erst nach der
 * Datumsaufteilung feststeht. */
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
 * (oder umgekehrt), je nachdem, ob nach der Datumsaufteilung noch
 * Folien übrig sind - funktioniert für beide Karussell-Typen, da beide
 * dieselben zwei data-Attribut-Paare verwenden (nur mit "events-" bzw.
 * "past-" Präfix).
 *
 * Nutzt bewusst eine eigene .is-hidden-Klasse (siehe styles.css,
 * "display: none !important") statt des nativen hidden-Attributs:
 * Elemente, die zusätzlich eine eigene "display"-CSS-Regel bekommen
 * (wie .past-controls mit "display: flex"), würden das hidden-Attribut
 * sonst stillschweigend überschreiben - Autoren-Stylesheets gewinnen in
 * der CSS-Kaskade grundsätzlich gegen die unsichtbar-machende
 * Browser-Standardregel für [hidden], unabhängig von der Spezifität.
 * Die !important-Klasse kann dagegen nichts überschreiben. */
function toggleEmptyState(container, isEmpty) {
  const empty = container.querySelector("[data-events-empty], [data-past-empty]");
  const controls = container.querySelector("[data-events-controls], [data-past-controls]");
  const viewport = container.querySelector("[data-events-viewport], [data-past-viewport]");
  if (empty) empty.classList.toggle("is-hidden", !isEmpty);
  if (controls) controls.classList.toggle("is-hidden", isEmpty);
  if (viewport) viewport.classList.toggle("is-hidden", isEmpty);
}

/**
 * Teilt bei jedem [data-events-carousel][data-events-scope="future"]
 * und jedem [data-past-carousel] auf der Seite die vorgerenderten
 * Folien nach Datum auf: zukünftige (inkl. heute) bleiben im
 * horizontalen Karussell, alles vor heute wandert (neuestes zuerst)
 * ins vertikale "Erinnerungen"-Karussell.
 *
 * Muss VOR createCarouselController()/createPastCarouselController()
 * aufgerufen werden, weil beide Funktionen die zu diesem Zeitpunkt noch
 * im DOM vorhandenen Folien zählen und darauf ihre Zustandsverwaltung
 * aufbauen.
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
      // Der aria-label-Text kommt ursprünglich statisch aus dem Template
      // und zählt dort immer "von 11" (der Gesamtzahl ALLER Events,
      // unabhängig vom Datum) - nach dem Entfernen der vergangenen
      // Folien wäre das falsch (z.B. "1 von 11" statt korrekt "1 von 8").
      // data-title enthält den reinen Titel ohne die Zähl-Klammer, damit
      // hier sauber neu zusammengesetzt werden kann, statt den
      // bestehenden aria-label-String zu zerlegen.
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

    // Neueste Erinnerung zuerst - fühlt sich beim Umblättern an, als
    // würde man sich Schritt für Schritt weiter in die Vergangenheit
    // zurückblättern, statt bei der ältesten zu beginnen.
    const remaining = Array.prototype.slice.call(track.querySelectorAll("[data-past-slide]"));
    remaining
      .sort((a, b) => slideEndDate(b).localeCompare(slideEndDate(a)))
      .forEach((slide) => track.appendChild(slide));

    toggleEmptyState(container, remaining.length === 0);
  });
}

// =========================================================================
// Vertikales "Erinnerungen"-Karussell (Flip-Kalender-Optik)
// =========================================================================

const DEFAULT_PAST_OF_LABEL = "von";

/**
 * Verbindet ein einzelnes [data-past-carousel] mit seinem HTML. Anders
 * als das horizontale Zukunfts-Karussell:
 *   - KEINE Endlos-Schleife: Erinnerungen sind ein endlicher, geordneter
 *     Stapel - am Anfang/Ende angekommen, deaktiviert sich der jeweilige
 *     Pfeil, statt am anderen Ende weiterzuspringen.
 *   - KEIN Autoplay: Erinnerungen sollen bewusst durchgeblättert werden.
 *   - Der Wechsel ist ein Flip statt eines seitlichen Gleitens: alle
 *     Karten liegen übereinandergestapelt in .past-viewport (mit
 *     CSS-perspective), nur .is-current liegt flach/sichtbar oben. Die
 *     CSS-Klassen is-before/is-current/is-after (siehe styles.css)
 *     erzeugen allein durch eine CSS-Transition auf transform/opacity
 *     den Umblätter-Eindruck - hier im JS wird nur die Klasse pro
 *     Render-Durchlauf neu vergeben.
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

    // Kompaktes "1/5" statt "1 von 5" - die Steuerungs-Spalte ist jetzt
    // schmal und liegt neben der Karte statt darunter (siehe
    // .past-controls in styles.css), da wäre der ausgeschriebene Text
    // zu breit und würde umbrechen. ofLabel bleibt trotzdem als Prop
    // erhalten (z.B. für eine spätere ausführlichere Anzeige oder
    // andere Sprachen mit anderer Zahlwort-Konvention).
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

  // "prev" = eine Erinnerung nach vorne (näher an heute, kleinerer
  // Index, da neueste zuerst sortiert - siehe partitionEventsByDate()).
  // "next" = eine Erinnerung weiter zurück in die Vergangenheit.
  function prev() {
    goTo(index - 1);
  }

  function next() {
    goTo(index + 1);
  }

  if (prevBtn) prevBtn.addEventListener("click", prev);
  if (nextBtn) nextBtn.addEventListener("click", next);

  // Pfeiltasten hoch/runter navigieren, sobald der Fokus im Karussell
  // liegt - Pendant zu Pfeiltasten links/rechts beim horizontalen
  // Karussell, nur eben für die vertikale Blätterrichtung.
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

// ---------- Einstiegspunkt: vertikales Erinnerungen-Karussell ----------
export function setupPastEventsCarousel(root = document) {
  const containers = Array.prototype.slice.call(root.querySelectorAll("[data-past-carousel]"));
  return containers
    .map((container) => createPastCarouselController(container))
    .filter(Boolean);
}

// ---------- Kombinierter Einstiegspunkt ----------
// Das ist die Funktion, die main.js aufrufen sollte (statt einzeln
// setupEventsCarousel()): sie sorgt zuerst per partitionEventsByDate()
// dafür, dass jedes Karussell nur noch die zu ihm passenden Folien
// enthält, und initialisiert danach beide Karussell-Typen. Läuft auf
// Seiten ohne Events-Karussells einfach ins Leere.
export function setupAllEventCarousels(root = document) {
  partitionEventsByDate(root);
  return {
    future: setupEventsCarousel(root),
    past: setupPastEventsCarousel(root),
  };
}