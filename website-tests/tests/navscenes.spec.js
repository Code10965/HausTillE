// ---------- navScenes.spec.js ----------
// Testet die reine Positions-/Sichtbarkeits-Logik der vier Nav-Kugeln
// (Events, Kontakt, Sprache, Menü) aus navScenes.js - ohne Browser-Seite,
// läuft direkt in Node, mit Playwrights test()/expect().
//
// Regressionstest gegen alle 31 Szenen aus der vom Website-Betreiber
// gelieferten Referenz-Tabelle (Scroll_logic_Nav_Kugeln.xlsx): kompletter
// Zyklus Hero -> Footer -> Hero, beide Scroll-Richtungen. Wichtigste
// Erkenntnis aus dieser Tabelle: Hero-Ende und Footer-Ende verhalten sich
// UNTERSCHIEDLICH beim Aufbauen/Abbauen des Stapels (siehe navScenes.js
// für die ausführliche Erklärung) - deshalb gibt es einen "variant"-
// Parameter ("hero" | "footer") bei buildRowToStackScenes/
// buildStackToRowScenes.
//
// WICHTIG: navScenes.js ist ein ES-Modul (export function ...), diese
// Datei ist CommonJS (require) wie der Rest von website-tests. Deshalb
// per dynamischem import() geladen (siehe beforeAll unten).

const { test, expect } = require("@playwright/test");
const path = require("path");
const { pathToFileURL } = require("url");

const NAV_SCENES_PATH = path.resolve(__dirname, "../../src/assets/media/js/navScenes.js");

let rowTarget, stackTarget, buildRowToStackScenes, buildStackToRowScenes, buildStepDurations, stackExtent;

test.beforeAll(async () => {
  const mod = await import(pathToFileURL(NAV_SCENES_PATH).href);
  ({ rowTarget, stackTarget, buildRowToStackScenes, buildStackToRowScenes, buildStepDurations, stackExtent } = mod);
});

const BALL = 44, ROW_GAP = 12, STACK_GAP = 6, SMALL_SCALE = 0.32;
const R = (slot) => rowTarget(slot, 20, 20, BALL, ROW_GAP);
const S = (slot) => stackTarget(slot, 20, 20, BALL, STACK_GAP);

// Slot-Zuordnung wie in nav.njk (data-nav-slot): Menü=0, Sprache=1, Kontakt=2, Events=3.
const SLOT = { M: 0, S: 1, C: 2, E: 3 };

// Positions-Label -> tatsächliche Position, wie in der Referenztabelle
// benannt (Reihe: links/2.links/2.rechts/rechts=Rand; Stapel:
// oben/2.oben/2.unten/unten).
const ROW_POS = { rand: R(0), zweiRechts: R(1), zweiLinks: R(2), links: R(3) };
const STACK_POS = { oben: S(0), zweiOben: S(1), zweiUnten: S(2), unten: S(3) };

/** Baut aus { E, K, S, M } (Label oder null) ein Szenen-Array (Index=Slot). */
function rowScene({ E, K, S: Sp, M }) {
  const arr = new Array(4).fill(null).map(() => ({ vis: 0 }));
  const set = (letter, label) => {
    if (label == null) return;
    arr[SLOT[letter]] = { vis: 1, pos: ROW_POS[label], scale: 1 };
  };
  set("E", E); set("C", K); set("S", Sp); set("M", M);
  return arr;
}
function stackScene({ E, K, S: Sp, M }) {
  const arr = new Array(4).fill(null).map(() => ({ vis: 0 }));
  const set = (letter, label) => {
    if (label == null) return;
    arr[SLOT[letter]] = { vis: 1, pos: STACK_POS[label], scale: SMALL_SCALE };
  };
  set("E", E); set("C", K); set("S", Sp); set("M", M);
  return arr;
}

function expectMatches(generated, expected, label) {
  expected.forEach((expScene, i) => {
    expScene.forEach((expItem, slot) => {
      const genItem = generated[i][slot];
      expect(genItem.vis, `${label} Szene ${i + 1}, Slot ${slot}: vis`).toBe(expItem.vis);
      if (expItem.vis) {
        expect(genItem.pos, `${label} Szene ${i + 1}, Slot ${slot}: pos`).toEqual(expItem.pos);
        expect(genItem.scale, `${label} Szene ${i + 1}, Slot ${slot}: scale`).toBe(expItem.scale);
      }
    });
  });
}

// ============================================================
// Referenz-Szenen 1-31 aus Scroll_logic_Nav_Kugeln.xlsx
// ============================================================

// Szenen 1-8: HERO, runter (Reihe -> Stapel, variant "hero")
const scenes1to8 = [
  rowScene({ E: "links", K: "zweiLinks", S: "zweiRechts", M: "rand" }),
  rowScene({ E: "zweiLinks", K: "zweiRechts", M: "rand" }),
  rowScene({ E: "zweiRechts", M: "rand" }),
  rowScene({ M: "rand" }),
  stackScene({ M: "oben" }),
  stackScene({ E: "zweiOben", M: "oben" }),
  stackScene({ E: "zweiUnten", K: "zweiOben", M: "oben" }),
  stackScene({ E: "unten", K: "zweiUnten", S: "zweiOben", M: "oben" }),
];

// Szenen 8-15: FOOTER, runter (Stapel -> Reihe, variant "footer") - Szene 8 = scenes1to8[7]
const scenes9to15 = [
  stackScene({ K: "unten", S: "zweiUnten", M: "zweiOben" }),
  stackScene({ S: "unten", M: "zweiUnten" }),
  stackScene({ M: "unten" }),
  rowScene({ M: "rand" }),
  rowScene({ E: "zweiRechts", M: "rand" }),
  rowScene({ E: "zweiLinks", K: "zweiRechts", M: "rand" }),
  rowScene({ E: "links", K: "zweiLinks", S: "zweiRechts", M: "rand" }),
];

// Szenen 16-23: FOOTER, hoch (Reihe -> Stapel, variant "footer")
const scenes16to23 = [
  rowScene({ E: "links", K: "zweiLinks", S: "zweiRechts", M: "rand" }),
  rowScene({ E: "zweiLinks", K: "zweiRechts", M: "rand" }),
  rowScene({ E: "zweiRechts", M: "rand" }),
  rowScene({ M: "rand" }),
  stackScene({ M: "unten" }),
  stackScene({ S: "unten", M: "zweiUnten" }),
  stackScene({ S: "zweiUnten", K: "unten", M: "zweiOben" }),
  stackScene({ S: "zweiOben", K: "zweiUnten", E: "unten", M: "oben" }),
];

// Szenen 23-31: HERO, hoch (Stapel -> Reihe, variant "hero") - Szene 23 = scenes16to23[7]
const scenes25to31 = [
  stackScene({ K: "zweiOben", E: "zweiUnten", M: "oben" }),
  stackScene({ E: "zweiOben", M: "oben" }),
  stackScene({ M: "oben" }),
  rowScene({ M: "rand" }),
  rowScene({ E: "zweiRechts", M: "rand" }),
  rowScene({ E: "zweiLinks", K: "zweiRechts", M: "rand" }),
  rowScene({ E: "links", K: "zweiLinks", S: "zweiRechts", M: "rand" }),
];

test("HERO -> STAPEL (Szenen 1-8, variant='hero')", async () => {
  const generated = buildRowToStackScenes(4, R, S, SMALL_SCALE, "hero");
  expect(generated).toHaveLength(8);
  expectMatches(generated, scenes1to8, "Hero->Stapel");
});

test("STAPEL -> FOOTER (Szenen 8-15, variant='footer')", async () => {
  const generated = buildStackToRowScenes(4, R, S, SMALL_SCALE, "footer");
  expect(generated).toHaveLength(8);
  expectMatches(generated, [scenes1to8[7], ...scenes9to15], "Stapel->Footer");
});

test("FOOTER -> STAPEL (Szenen 16-23, variant='footer')", async () => {
  const generated = buildRowToStackScenes(4, R, S, SMALL_SCALE, "footer");
  expect(generated).toHaveLength(8);
  expectMatches(generated, scenes16to23, "Footer->Stapel");
});

test("STAPEL -> HERO (Szenen 23-31, variant='hero')", async () => {
  const generated = buildStackToRowScenes(4, R, S, SMALL_SCALE, "hero");
  expect(generated).toHaveLength(8);
  expectMatches(generated, [scenes16to23[7], ...scenes25to31], "Stapel->Hero");
});

test("der komplette Zyklus schließt sich: Szene 31 entspricht wieder Szene 1", async () => {
  const heroDown = buildRowToStackScenes(4, R, S, SMALL_SCALE, "hero");
  const heroUp = buildStackToRowScenes(4, R, S, SMALL_SCALE, "hero");
  expect(heroUp[heroUp.length - 1]).toEqual(heroDown[0]);
});

test("Hero- und Footer-Variante unterscheiden sich tatsächlich (kein Kopierfehler)", async () => {
  const heroBuild = buildRowToStackScenes(4, R, S, SMALL_SCALE, "hero");
  const footerBuild = buildRowToStackScenes(4, R, S, SMALL_SCALE, "footer");
  // Die Aufbau-Phase (letzte Szene, Index 7) muss sich unterscheiden -
  // Menü landet in beiden Varianten zwar am selben Endpunkt (oben), aber
  // der WEG dorthin (mittlere Szenen) unterscheidet sich.
  expect(heroBuild[5]).not.toEqual(footerBuild[5]);
});

test("funktioniert auch mit einer anderen Anzahl Kugeln - liefert 2N Szenen in jeder Variante", async () => {
  for (const n of [2, 3, 5, 6]) {
    for (const variant of ["hero", "footer"]) {
      expect(buildRowToStackScenes(n, R, S, SMALL_SCALE, variant)).toHaveLength(2 * n);
      expect(buildStackToRowScenes(n, R, S, SMALL_SCALE, variant)).toHaveLength(2 * n);
    }
  }
});

test("kein Element springt beim Einblenden, in keiner der vier Varianten (N=4)", async () => {
  function expectNoJump(scenes, label) {
    for (let s = 1; s < scenes.length; s++) {
      for (let i = 0; i < 4; i++) {
        const prev = scenes[s - 1][i];
        const cur = scenes[s][i];
        if (!prev.vis && cur.vis) {
          expect(prev.pos, `${label} Szene ${s}, Slot ${i}`).toEqual(cur.pos);
          expect(prev.scale, `${label} Szene ${s}, Slot ${i}`).toBe(cur.scale);
        }
      }
    }
  }
  expectNoJump(buildRowToStackScenes(4, R, S, SMALL_SCALE, "hero"), "Hero-Aufbau");
  expectNoJump(buildRowToStackScenes(4, R, S, SMALL_SCALE, "footer"), "Footer-Aufbau");
  expectNoJump(buildStackToRowScenes(4, R, S, SMALL_SCALE, "hero"), "Hero-Abbau");
  expectNoJump(buildStackToRowScenes(4, R, S, SMALL_SCALE, "footer"), "Footer-Abbau");
});

test("keine Kugel driftet bereits beim Ausblenden - sie friert an ihrer letzten sichtbaren Position ein (N=2..6, alle Varianten)", async () => {
  // Regressionstest für einen konkret gemeldeten Bug: Kugeln schienen
  // beim Ausblenden schon Richtung ihrer künftigen Position zu "driften"
  // (sichtbar z.B. beim Abbauen des Stapels im Footer-Bereich), weil ihr
  // unsichtbarer Platzhalter nicht mit ihrer tatsächlich letzten
  // sichtbaren Position übereinstimmte.
  function expectNoDriftOnFadeOut(scenes, label) {
    for (let s = 1; s < scenes.length; s++) {
      for (let i = 0; i < scenes[s].length; i++) {
        const prev = scenes[s - 1][i];
        const cur = scenes[s][i];
        if (prev.vis && !cur.vis) {
          expect(cur.pos, `${label} Szene ${s}, Slot ${i}: Drift beim Ausblenden`).toEqual(prev.pos);
          expect(cur.scale, `${label} Szene ${s}, Slot ${i}: Skalierungs-Drift beim Ausblenden`).toBe(prev.scale);
        }
      }
    }
  }
  for (const n of [2, 3, 4, 5, 6]) {
    for (const variant of ["hero", "footer"]) {
      expectNoDriftOnFadeOut(buildRowToStackScenes(n, R, S, SMALL_SCALE, variant), `RowToStack/${variant}/N=${n}`);
      expectNoDriftOnFadeOut(buildStackToRowScenes(n, R, S, SMALL_SCALE, variant), `StackToRow/${variant}/N=${n}`);
    }
  }
});

test("rowTarget: Slot 0 liegt am Rand, höhere Slots weiter innen", async () => {
  const a = rowTarget(0, 20, 20, BALL, ROW_GAP);
  const b = rowTarget(1, 20, 20, BALL, ROW_GAP);
  expect(a.right).toBeLessThan(b.right);
  expect(a.top).toBe(b.top);
});

test("stackTarget: Slot 0 liegt oben, höhere Slots weiter unten", async () => {
  const a = stackTarget(0, 20, 20, BALL, STACK_GAP);
  const b = stackTarget(1, 20, 20, BALL, STACK_GAP);
  expect(a.top).toBeLessThan(b.top);
  expect(a.right).toBe(b.right);
});

test("stackExtent wächst linear mit der Anzahl Kugeln", async () => {
  expect(stackExtent(1, BALL, STACK_GAP)).toBe(BALL);
  expect(stackExtent(4, BALL, STACK_GAP)).toBe(3 * (BALL + STACK_GAP) + BALL);
});

test("buildStepDurations liefert 2N-1 Übergänge mit einer längeren Szene in der Mitte", async () => {
  const durations = buildStepDurations(4);
  expect(durations).toHaveLength(7);
  expect(durations[3]).toBe(190);
  expect(durations.filter((d) => d === 140)).toHaveLength(6);
});