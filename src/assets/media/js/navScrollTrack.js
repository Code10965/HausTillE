// ---------- Position aller Kugeln + ihrer Panels beim Scrollen ----------
//
// Layout-Prinzip:
// - Ganz oben (Hero) ODER ganz unten (Kontakt-Sektion), "groß": alle
//   Kugeln nebeneinander in einer Reihe, rechtsbündig. Von rechts nach
//   links: Menü (Slot 0, am Rand) -> Sprache (Slot 1) -> Kontakt (Slot 2)
//   -> Events (Slot 3) -> ... (höhere Slots weiter außen/links).
// - Dazwischen gescrollt, "klein": senkrecht gestapelt - Menü oben,
//   darunter in Slot-Reihenfolge alle weiteren Kugeln.
//
// WICHTIG: die eigentliche Szenen-Choreografie (welche Kugel wann
// sichtbar wird/verschwindet, wohin sie sich bewegt) steckt komplett in
// navScenes.js, nicht hier - diese Datei kümmert sich nur noch ums
// Anwenden (Inline-Styles setzen, Timing, Scroll-Events). Ausführliche
// Erklärung der vier Choreografie-Varianten (Hero verhält sich anders
// als Footer!) direkt am Kopf von navScenes.js.
//
// Beide Richtungen laufen komplett über Inline-Styles (nicht
// CSS-Variablen), weil sonst jeder Scroll-Frame die laufende Animation
// überschreiben würde. Aus demselben Grund wird auch die Größe
// (normalerweise per CSS-Klasse groß/klein geschaltet) während der
// Choreografie explizit pro Szene gesteuert.

import {
  rowTarget,
  stackTarget,
  buildRowToStackScenes,
  buildStackToRowScenes,
  buildStepDurations,
  stackExtent
} from "./navScenes.js";

const BALL = 44; // muss zu Breite/Höhe von .nav-ball in styles.css passen
const ROW_GAP = 12;
const STACK_GAP = 6;
const EDGE_DESKTOP = 20; // muss zu --nav-edge in styles.css passen (ab 640px)
const EDGE_MOBILE = 24; // muss zu --nav-edge in styles.css passen (unter 640px)
const MOBILE_BREAKPOINT = 640;
const DROPDOWN_GAP = 14;
const EDGE_MARGIN = 20;
const TOP_THRESHOLD = 80;
const BOTTOM_THRESHOLD = 40;
const SMALL_SCALE = 0.32; // muss zum scale()-Wert der CSS-Schrumpf-Regel passen
const DRIFT_MAX = 14; // muss zum größten möglichen driftAmplitude-Wert in navItems.js passen (6 + 8)

const START_SETTLE = 150; // sanfter (nicht instantaner) Start in Szene 0, fängt
                            // eventuelle Drift-Bewegung sauber ab statt hart
                            // "einzurasten" (das sah wie ein Überschießen aus)
// War früher 0.55 (nächste Szene startet schon bei 55% der laufenden
// Übergangsdauer) - das ließ zwei Positionswechsel überlappen: eine
// Kugel bekam mitten in ihrer Bewegung (z.B. von rechts nach links) ein
// neues Ziel und wechselte die Richtung, wodurch ein diagonaler
// "Sprung" statt eines sauberen, geraden Wegs entstand. Jetzt läuft
// jede Szene vollständig zu Ende, BEVOR die nächste beginnt.
const OVERLAP = 1;

// Kleiner zeitlicher Versatz zwischen den Kugeln INNERHALB derselben
// Szene: statt dass alle vier exakt im selben Frame lossausen und exakt
// im selben Frame stehenbleiben (wirkte wie ein starrer Marschtakt),
// startet jede Kugel ein kleines Stück später als die vorherige - wie
// eine sanfte Welle. Bleibt trotzdem strikt sequenziell: die nächste
// Szene wartet, bis auch die ZULETZT gestartete (also am stärksten
// verzögerte) Kugel ihre Bewegung komplett beendet hat - der
// "Sprung/Verwisch"-Effekt von vorher kann dadurch nicht zurückkommen.
const STAGGER_MS = 16;

// Zwei Übergangskurven statt einer einzigen für alle Schritte: eine
// starke Ease-Out-Kurve bremst am ENDE ihrer Dauer bis zum Stillstand ab
// - bei 7 Schritten hintereinander macht das 7 kleine "Vollbremsungen",
// die das Auge als einzelne, hölzerne Bewegungen statt einer
// durchgehenden Bewegung wahrnimmt (unabhängig von der Dauer der
// einzelnen Schritte). Deshalb: alle ZWISCHENschritte laufen linear
// (konstante Geschwindigkeit, kein Abbremsen) durch - nur der ALLERLETZTE
// Schritt der gesamten Kette bekommt noch die sanft ausbremsende Kurve,
// damit die Kugel am Ende ihrer Reise nicht hart einrastet.
const EASE_CONTINUOUS = "linear";
const EASE_SETTLE = "cubic-bezier(0.16,1,0.3,1)";

export function setupScrollTrack(nav, items) {
  let ticking = false;
  let isTransitioning = false;
  let currentIsLarge = null;
  const timers = [];

  const N = items.length; // Anzahl Kugeln - austauschbar, nicht mehr fest 3

  const currentEdge = () =>
    window.innerWidth < MOBILE_BREAKPOINT ? EDGE_MOBILE : EDGE_DESKTOP;

  const R = (slot, baseTop, edge) => rowTarget(slot, baseTop, edge, BALL, ROW_GAP);
  const S = (slot, baseTop, smallEdge) => stackTarget(slot, baseTop, smallEdge, BALL, STACK_GAP);

  const positionDropdown = (item, ballTop, ballRight) => {
    const ballCenterY = ballTop + BALL / 2;
    const dropdownHeight = item.dropdown.offsetHeight;
    const spaceBelow = window.innerHeight - (ballCenterY + DROPDOWN_GAP) - EDGE_MARGIN;
    const opensUp = spaceBelow < dropdownHeight;

    item.dropdown.style.right = `${ballRight}px`;
    if (opensUp) {
      item.dropdown.style.top = "auto";
      item.dropdown.style.bottom = `${window.innerHeight - ballCenterY + DROPDOWN_GAP}px`;
      item.dropdown.style.transformOrigin = "bottom right";
    } else {
      item.dropdown.style.bottom = "auto";
      item.dropdown.style.top = `${ballCenterY + DROPDOWN_GAP}px`;
      item.dropdown.style.transformOrigin = "top right";
    }
  };

  const applyItemState = (item, state, duration, delay = 0, easing = "cubic-bezier(0.16,1,0.3,1)") => {
    item.toggle.style.transition = duration
      ? `opacity ${duration}ms ease ${delay}ms, top ${duration}ms ${easing} ${delay}ms, right ${duration}ms ${easing} ${delay}ms`
      : "none";
    item.visual.style.transition = duration
      ? `transform ${duration}ms ${easing} ${delay}ms`
      : "none";
    void item.toggle.offsetWidth; // Reflow, damit die neue Transition sicher greift

    item.toggle.style.opacity = state.vis ? "1" : "0";
    item.toggle.style.pointerEvents = state.vis ? "" : "none";
    item.toggle.style.top = `${state.pos.top}px`;
    item.toggle.style.right = `${state.pos.right}px`;
    item.visual.style.transform = `scale(${state.scale})`;
    positionDropdown(item, state.pos.top, state.pos.right);
  };

  // scene ist jetzt ein Array (Index = Slot), statt der früheren festen
  // { menu, globe, contact }-Objektform - dadurch beliebig viele Kugeln.
  // `staggered`: bei true bekommt jede Kugel (nach ihrem Index in
  // `items`, also aufsteigend nach Slot) einen um STAGGER_MS längeren
  // Delay als die vorherige - die kleine "Welle" statt Gleichschritt.
  // `easing`: siehe EASE_CONTINUOUS/EASE_SETTLE unten - entscheidet, ob
  // dieser Schritt sanft ausbremst (letzter Schritt der Kette) oder
  // linear durchläuft (alle Zwischenschritte, kein Zwischenstopp).
  const applyScene = (scene, duration, staggered = false, easing = EASE_SETTLE) => {
    items.forEach((item, i) => applyItemState(item, scene[i], duration, staggered ? i * STAGGER_MS : 0, easing));
  };

  const releaseOverrides = () => {
    items.forEach((item) => {
      item.toggle.style.transition = "";
      item.toggle.style.opacity = "";
      item.toggle.style.pointerEvents = "";
      item.visual.style.transition = "";
      item.visual.style.transform = "";
    });
  };

  const after = (ms, fn) => timers.push(setTimeout(fn, ms));

  // Am HERO-Ende (obere Seitenhälfte) und am FOOTER-Ende (untere Hälfte)
  // läuft die Reihe<->Stapel-Choreografie unterschiedlich ab (siehe
  // ausführliche Erklärung in navScenes.js) - `fraction` (0 = ganz oben,
  // 1 = ganz unten) entscheidet, welche der beiden Varianten gerade
  // gilt. Wird im Moment der Auslösung ermittelt, nicht erst am Ende der
  // Animation, damit z.B. beim Herausscrollen aus dem Hero (fraction
  // noch klein) sicher die Hero-Variante läuft.
  const playSequence = (toLarge, baseTopRow, baseTopStack, edge, smallEdge, fraction) => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    isTransitioning = true;

    const variant = fraction < 0.5 ? "hero" : "footer";
    const rFn = (slot) => R(slot, baseTopRow, edge);
    const sFn = (slot) => S(slot, baseTopStack, smallEdge);
    const scenes = toLarge
      ? buildStackToRowScenes(N, rFn, sFn, SMALL_SCALE, variant)
      : buildRowToStackScenes(N, rFn, sFn, SMALL_SCALE, variant);
    const stepDurations = buildStepDurations(N);

    // Sanft (nicht instantan) in Szene 0 "einschwingen" - fängt eventuelle
    // Restbewegung (Drift) der letzten kontinuierlichen Position ab, statt
    // hart einzurasten (das sah wie ein Überschießen über das Ziel aus).
    // Kein Stagger hier - das Einschwingen betrifft alle Kugeln an ihrer
    // aktuellen (ggf. leicht drivenden) Position gleichermaßen.
    applyScene(scenes[0], START_SETTLE, false);

    // Effektive Dauer eines Schritts = Basisdauer + Versatz der zuletzt
    // (am stärksten verzögert) startenden Kugel - erst wenn DIE fertig
    // ist, darf die nächste Szene beginnen (siehe STAGGER_MS oben).
    const staggerSpan = (N - 1) * STAGGER_MS;

    let startAt = START_SETTLE;
    let finishAt = startAt;
    for (let i = 1; i < scenes.length; i++) {
      const dur = stepDurations[i - 1];
      const stepTime = dur + staggerSpan;
      const isLastStep = i === scenes.length - 1;
      const easing = isLastStep ? EASE_SETTLE : EASE_CONTINUOUS;
      after(startAt, () => applyScene(scenes[i], dur, true, easing));
      finishAt = startAt + stepTime;
      startAt += stepTime * OVERLAP;
    }

    after(finishAt + 40, () => {
      releaseOverrides();
      isTransitioning = false;
    });
  };

  const updateTrack = () => {
    const trackTopMin = 20;
    // Reihe und Stapel brauchen UNTERSCHIEDLICH viel Platz nach unten: die
    // Reihe nur die Höhe einer einzelnen Kugel, der Stapel die Höhe aller
    // N Kugeln übereinander. Würde man für beide denselben Basiswert
    // verwenden, reicht der Stapel bei gleicher Basis immer weiter nach
    // unten als die Reihe (genau der Bug aus den früheren Screenshots).
    // Deshalb zwei getrennte Obergrenzen: rowMax ist großzügiger (fast
    // bis zum Rand), stackMax ist so viel kleiner, dass der Stapel an
    // SEINER Obergrenze exakt genauso tief reicht wie die Reihe an IHRER -
    // plus Puffer für die maximale Drift-Auslenkung.
    const extent = stackExtent(N, BALL, STACK_GAP); // Gesamthöhe des Stapels
    const rowMax = window.innerHeight - BALL - EDGE_MARGIN;
    const stackMax = rowMax - (extent - BALL) - DRIFT_MAX;

    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const fraction = scrollable > 0 ? window.scrollY / scrollable : 0;
    const baseTopRow = trackTopMin + fraction * (rowMax - trackTopMin);
    const baseTopStack = trackTopMin + fraction * (stackMax - trackTopMin);

    // Fürs Logo (verhält sich wie die Reihe - eine einzelne Kugel).
    nav.style.setProperty("--nav-track-top", `${baseTopRow}px`);

    const atTop = window.scrollY < TOP_THRESHOLD;
    const distanceToBottom =
      document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
    const atBottom = distanceToBottom < BOTTOM_THRESHOLD;
    nav.classList.toggle("nav-at-top", atTop);
    nav.classList.toggle("nav-at-bottom", atBottom);

    const isLarge = atTop || atBottom;
    const edge = currentEdge();
    const smallEdge = window.innerWidth < MOBILE_BREAKPOINT ? edge - 22 : edge;

    if (currentIsLarge === null) {
      currentIsLarge = isLarge;
      items.forEach((item) => {
        const pos = isLarge
          ? R(item.slot, baseTopRow, edge)
          : S(item.slot, baseTopStack, smallEdge);
        item.toggle.style.top = `${pos.top}px`;
        item.toggle.style.right = `${pos.right}px`;
        positionDropdown(item, pos.top, pos.right);
      });
      return;
    }

    if (isLarge !== currentIsLarge) {
      currentIsLarge = isLarge;
      playSequence(isLarge, baseTopRow, baseTopStack, edge, smallEdge, fraction);
      return;
    }

    if (isTransitioning) return;

    items.forEach((item) => {
      let top, right;
      if (isLarge) {
        top = baseTopRow;
        right = edge + item.slot * (BALL + ROW_GAP);
      } else {
        const drift =
          item.driftAmplitude *
          Math.sin(fraction * Math.PI * 2 * item.driftSpeed + item.driftPhase);
        top = baseTopStack + drift + item.slot * (BALL + STACK_GAP);
        right = smallEdge;
      }
      item.toggle.style.top = `${top}px`;
      item.toggle.style.right = `${right}px`;
      positionDropdown(item, top, right);
    });
  };

  updateTrack();

  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateTrack();
        ticking = false;
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", updateTrack);
}