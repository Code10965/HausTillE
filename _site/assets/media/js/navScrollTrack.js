// ---------- Position aller drei Kugeln + ihrer Panels beim Scrollen ----------
//
// Layout-Prinzip:
// - Ganz oben (Hero) ODER ganz unten (Kontakt-Sektion), "groß": alle drei
//   Kugeln nebeneinander in einer Reihe, rechtsbündig. Von rechts nach
//   links: Menü (Slot 0, am Rand) -> Sprache (Slot 1) -> Kontakt (Slot 2).
// - Dazwischen gescrollt, "klein": senkrecht gestapelt - Menü oben, Sprache
//   darunter, Kontakt ganz unten.
//
// WICHTIG: Die beiden Richtungen sind NICHT spiegelbildlich zueinander,
// sondern zwei eigenständige, unterschiedlich choreografierte Abläufe
// (nach zwei getrennten Vorlagen):
//
// REIHE -> STAPEL (rowToStackScenes):
//   0: alle drei groß in der Reihe.
//   1: Menü unsichtbar. Sprache UND Kontakt rücken sichtbar nach (Sprache
//      übernimmt Menüs Randposition, Kontakt übernimmt Spraches alte
//      Position) - noch alle groß.
//   2: Sprache zusätzlich unsichtbar. Kontakt rückt weiter vor auf die
//      Randposition - immer noch groß, jetzt allein sichtbar.
//   3: Kontakt wandert (allein) zu ihrer EIGENEN Stapel-Position und
//      schrumpft dabei.
//   4: Sprache erscheint (schon klein) an ihrer Stapel-Position.
//   5: Menü erscheint (schon klein) an seiner Stapel-Position - fertig.
//
// STAPEL -> REIHE (stackToRowScenes) - andere Reihenfolge:
//   0: alle drei klein im Stapel.
//   1: Kontakt (unterste) wird unsichtbar. Menü, Sprache bleiben unverändert.
//   2: Sprache zusätzlich unsichtbar. Nur noch Menü sichtbar (klein, oben).
//   3: Menü wächst (allein) zu ihrer EIGENEN Reihen-Position (Rand).
//   4: Kontakt erscheint groß, aber zunächst auf dem NÄCHSTEN freien Platz
//      (nicht ihrer finalen Position) direkt neben Menü.
//   5: Sprache erscheint groß auf demselben Platz - Kontakt rückt dabei
//      weiter auf ihre finale (äußerste) Position - fertig.
//
// Beide laufen komplett über Inline-Styles (nicht CSS-Variablen), weil
// sonst jeder Scroll-Frame die laufende Animation überschreiben würde. Aus
// demselben Grund wird auch die Größe (normalerweise per CSS-Klasse groß/
// klein geschaltet) während der Choreografie explizit pro Szene gesteuert.

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
const DRIFT_MAX = 14; // muss zum größten möglichen driftAmplitude-Wert unten passen (6 + 8)

const STEP_DURATIONS = [220, 220, 280, 220, 220]; // Dauer je Übergang zwischen zwei Szenen
const START_SETTLE = 150; // sanfter (nicht instantaner) Start in Szene 0, fängt
                            // eventuelle Drift-Bewegung sauber ab statt hart
                            // "einzurasten" (das sah wie ein Überschießen aus)
const OVERLAP = 0.55; // wie stark aufeinanderfolgende Schritte sich zeitlich
                       // überlappen, für einen fließenderen statt abgehackten
                       // Eindruck

export function setupScrollTrack(nav, items) {
  let ticking = false;
  let isTransitioning = false;
  let currentIsLarge = null;
  const timers = [];

  const [menu, globe, contact] = items; // sortiert nach Slot: 0, 1, 2

  const currentEdge = () =>
    window.innerWidth < MOBILE_BREAKPOINT ? EDGE_MOBILE : EDGE_DESKTOP;

  const rowTarget = (slot, baseTop, edge) => ({
    top: baseTop,
    right: edge + slot * (BALL + ROW_GAP)
  });
  const stackTarget = (slot, baseTop, smallEdge) => ({
    top: baseTop + slot * (BALL + STACK_GAP),
    right: smallEdge
  });

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

  // ---- Szenen Reihe -> Stapel ----
  const buildRowToStackScenes = (baseTopRow, baseTopStack, edge, smallEdge) => {
    const R = (slot) => rowTarget(slot, baseTopRow, edge);
    const S = (slot) => stackTarget(slot, baseTopStack, smallEdge);
    return [
      { menu: { vis: 1, pos: R(0), scale: 1 }, globe: { vis: 1, pos: R(1), scale: 1 }, contact: { vis: 1, pos: R(2), scale: 1 } },
      { menu: { vis: 0, pos: R(0), scale: 1 }, globe: { vis: 1, pos: R(0), scale: 1 }, contact: { vis: 1, pos: R(1), scale: 1 } },
      { menu: { vis: 0, pos: R(0), scale: 1 }, globe: { vis: 0, pos: R(0), scale: 1 }, contact: { vis: 1, pos: R(0), scale: 1 } },
      // Kontakt wandert zunächst nur auf die MITTLERE Stapel-Position (Slot 1),
      // nicht direkt auf ihre eigene (unterste) - Globe/Menü bleiben unsichtbar.
      { menu: { vis: 0, pos: R(0), scale: 1 }, globe: { vis: 0, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 1, pos: S(1), scale: SMALL_SCALE } },
      // Kontakt zieht GLEICHZEITIG weiter auf ihre eigene (unterste) Position,
      // während Globe genau an der nun frei werdenden mittleren Position erscheint.
      { menu: { vis: 0, pos: R(0), scale: 1 }, globe: { vis: 1, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 1, pos: S(2), scale: SMALL_SCALE } },
      { menu: { vis: 1, pos: S(0), scale: SMALL_SCALE }, globe: { vis: 1, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 1, pos: S(2), scale: SMALL_SCALE } }
    ];
  };

  // ---- Szenen Stapel -> Reihe (eigenständig, NICHT die Umkehrung oben) ----
  // Kontakt verschwindet zuerst (unterste im Stapel), Menü bleibt als
  // einzige übrig und wächst zuerst; Kontakt erscheint danach zunächst auf
  // dem Zwischenplatz direkt neben Menü, bevor Sprache erscheint und
  // Kontakt auf ihre finale, äußerste Position weiterschiebt.
  const buildStackToRowScenes = (baseTopRow, baseTopStack, edge, smallEdge) => {
    const R = (slot) => rowTarget(slot, baseTopRow, edge);
    const S = (slot) => stackTarget(slot, baseTopStack, smallEdge);
    return [
      { menu: { vis: 1, pos: S(0), scale: SMALL_SCALE }, globe: { vis: 1, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 1, pos: S(2), scale: SMALL_SCALE } },
      { menu: { vis: 1, pos: S(0), scale: SMALL_SCALE }, globe: { vis: 1, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 0, pos: S(2), scale: SMALL_SCALE } },
      { menu: { vis: 1, pos: S(0), scale: SMALL_SCALE }, globe: { vis: 0, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 0, pos: S(2), scale: SMALL_SCALE } },
      { menu: { vis: 1, pos: R(0), scale: 1 }, globe: { vis: 0, pos: S(1), scale: SMALL_SCALE }, contact: { vis: 0, pos: S(2), scale: SMALL_SCALE } },
      { menu: { vis: 1, pos: R(0), scale: 1 }, globe: { vis: 0, pos: R(1), scale: 1 }, contact: { vis: 1, pos: R(1), scale: 1 } },
      { menu: { vis: 1, pos: R(0), scale: 1 }, globe: { vis: 1, pos: R(1), scale: 1 }, contact: { vis: 1, pos: R(2), scale: 1 } }
    ];
  };

  const applyItemState = (item, state, duration) => {
    item.toggle.style.transition = duration
      ? `opacity ${duration}ms ease, top ${duration}ms cubic-bezier(0.16,1,0.3,1), right ${duration}ms cubic-bezier(0.16,1,0.3,1)`
      : "none";
    item.visual.style.transition = duration
      ? `transform ${duration}ms cubic-bezier(0.16,1,0.3,1)`
      : "none";
    void item.toggle.offsetWidth; // Reflow, damit die neue Transition sicher greift

    item.toggle.style.opacity = state.vis ? "1" : "0";
    item.toggle.style.pointerEvents = state.vis ? "" : "none";
    item.toggle.style.top = `${state.pos.top}px`;
    item.toggle.style.right = `${state.pos.right}px`;
    item.visual.style.transform = `scale(${state.scale})`;
    positionDropdown(item, state.pos.top, state.pos.right);
  };

  const applyScene = (scene, duration) => {
    applyItemState(menu, scene.menu, duration);
    applyItemState(globe, scene.globe, duration);
    applyItemState(contact, scene.contact, duration);
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

  const playSequence = (toLarge, baseTopRow, baseTopStack, edge, smallEdge) => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    isTransitioning = true;

    const scenes = toLarge
      ? buildStackToRowScenes(baseTopRow, baseTopStack, edge, smallEdge)
      : buildRowToStackScenes(baseTopRow, baseTopStack, edge, smallEdge);

    // Sanft (nicht instantan) in Szene 0 "einschwingen" - fängt eventuelle
    // Restbewegung (Drift) der letzten kontinuierlichen Position ab, statt
    // hart einzurasten (das sah wie ein Überschießen über das Ziel aus).
    applyScene(scenes[0], START_SETTLE);

    let startAt = START_SETTLE;
    let finishAt = startAt;
    for (let i = 1; i < scenes.length; i++) {
      const dur = STEP_DURATIONS[i - 1];
      after(startAt, () => applyScene(scenes[i], dur));
      finishAt = startAt + dur;
      startAt += dur * OVERLAP;
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
    // drei übereinander. Würde man für beide denselben Basiswert verwenden,
    // reicht der Stapel bei gleicher Basis immer ~100px weiter nach unten
    // als die Reihe (genau der Bug aus den Screenshots). Deshalb zwei
    // getrennte Obergrenzen: rowMax ist großzügiger (fast bis zum Rand),
    // stackMax ist so viel kleiner, dass der Stapel an SEINER Obergrenze
    // exakt genauso tief reicht wie die Reihe an IHRER (siehe Rechnung
    // unten) - plus Puffer für die maximale Drift-Auslenkung.
    const stackExtent = 2 * (BALL + STACK_GAP) + BALL; // Gesamthöhe des Stapels
    const rowMax = window.innerHeight - BALL - EDGE_MARGIN;
    const stackMax = rowMax - (stackExtent - BALL) - DRIFT_MAX;

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
          ? rowTarget(item.slot, baseTopRow, edge)
          : stackTarget(item.slot, baseTopStack, smallEdge);
        item.toggle.style.top = `${pos.top}px`;
        item.toggle.style.right = `${pos.right}px`;
        positionDropdown(item, pos.top, pos.right);
      });
      return;
    }

    if (isLarge !== currentIsLarge) {
      currentIsLarge = isLarge;
      playSequence(isLarge, baseTopRow, baseTopStack, edge, smallEdge);
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