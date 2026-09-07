// ---------- Reine Positions-Logik für die Nav-Kugeln (kein DOM) ----------
// Ausgelagert aus navScrollTrack.js, nach demselben Prinzip wie
// EventsCarouselState in eventsCarousel.js: reine Berechnung (welche
// Position/Sichtbarkeit hat Slot X in Szene Y?) getrennt von der
// DOM-Anwendung. Dadurch lässt sich die Choreografie in
// navScenes.test.js ohne Browser/jsdom testen.
//
// Diese Formel wurde aus einer vollständigen, Szene-für-Szene
// durchnummerierten Tabelle (31 Szenen: Hero runter -> Footer -> Hero
// wieder rauf) nachgebaut - siehe navScenes.test.js für den
// vollständigen Regressionstest gegen diese Referenz-Szenen.
//
// WICHTIGE ERKENNTNIS aus der Tabelle: Reihe<->Stapel verhält sich am
// HERO-Ende der Seite ANDERS als am FOOTER-Ende - es gibt nicht nur
// "eine" Reihe->Stapel- und "eine" Stapel->Reihe-Choreografie, sondern
// VIER eigenständige Varianten:
//
//   1. Hero  -> Stapel (nach unten aus dem Hero herausscrollen):
//      Menü bleibt fest OBEN im Stapel stehen; Events, Kontakt, Sprache
//      kommen NACHEINANDER dazu (absteigende Slot-Reihenfolge: zuerst
//      die vorher äußerste), jede neue Kugel legt sich OBEN direkt unter
//      Menü und schiebt die schon vorhandenen eine Position nach unten.
//
//   2. Footer -> Stapel (nach oben aus dem Footer herausscrollen):
//      Menü schrumpft zuerst allein nach UNTEN in den Stapel. Sprache,
//      Kontakt, Events kommen NACHEINANDER dazu (aufsteigende
//      Slot-Reihenfolge), jede neue Kugel legt sich UNTEN an und schiebt
//      alle bereits vorhandenen (auch Menü selbst!) eine Position nach
//      OBEN - bis Menü ganz oben ankommt.
//
//   3. Stapel -> Footer (nach unten in den Footer hineinscrollen):
//      Die jeweils UNTERSTE sichtbare Kugel verschwindet zuerst, der
//      Rest rutscht gemeinsam nach unten nach (die oberste Position wird
//      frei) - bis nur noch Menü übrig ist (unten im Stapel). Menü
//      wächst dann allein zur Reihe; die anderen kommen absteigend
//      wieder dazu.
//
//   4. Stapel -> Hero (nach oben in den Hero hineinscrollen):
//      Menü bleibt fest OBEN stehen; die Kugel direkt darunter
//      verschwindet zuerst (aufsteigende Slot-Reihenfolge: erst Sprache,
//      dann Kontakt, dann Events), die verbleibenden rutschen dabei
//      unter Menü nach oben nach. Menü wächst dann allein zur Reihe; die
//      anderen kommen absteigend wieder dazu (identisch zu Variante 3).
//
// Der Reihe-Auflösungs-Teil (welche Kugel im Reihenmodus zuerst
// verschwindet: Slot 1 zuerst, dann 2, dann 3 - Menü/Slot 0 bleibt immer
// am Rand sichtbar) ist dagegen bei Hero UND Footer IDENTISCH - nur der
// anschließende Stapel-Aufbau unterscheidet sich.

/** Position einer Kugel in der REIHE (groß), Slot 0 = am Rand. */
export function rowTarget(slot, baseTop, edge, ball, rowGap) {
  return { top: baseTop, right: edge + slot * (ball + rowGap) };
}

/** Position einer Kugel im STAPEL (klein), Slot 0 = oben. */
export function stackTarget(slot, baseTop, smallEdge, ball, stackGap) {
  return { top: baseTop + slot * (ball + stackGap), right: smallEdge };
}

/** Gesamthöhe des Stapels bei N Kugeln. */
export function stackExtent(n, ball, stackGap) {
  return (n - 1) * (ball + stackGap) + ball;
}

/**
 * Übergangsdauern zwischen den 2N Szenen (2N-1 Übergänge). Die mittlere,
 * "einzelne" Übergangs-Szene (der Moment, in dem eine einzelne Kugel
 * zwischen groß/Reihe und klein/Stapel wechselt) ist bewusst etwas
 * länger (280ms) als die übrigen (220ms).
 */
export function buildStepDurations(n) {
  const durations = [];
  for (let i = 0; i < n - 1; i++) durations.push(140);
  durations.push(190);
  for (let i = 0; i < n - 1; i++) durations.push(140);
  return durations;
}

/**
 * Rückwärts-Durchlauf: jede UNSICHTBARE Position wird auf die Position der
 * JEWEILS NÄCHSTEN Szene gesetzt - ABER NUR, wenn diese nächste Szene
 * tatsächlich sichtbar ist (also der Moment des Einblendens unmittelbar
 * bevorsteht). Dadurch "wandert" ein Element GENAU EINE Szene vor seinem
 * Erscheinen schon lautlos (bei opacity 0) an seine Zielposition - im
 * Moment des Einblendens ändert sich dann nur noch die Opacity, nie
 * gleichzeitig auch die Position (kein sichtbarer Sprung).
 *
 * WICHTIG: Absichtlich KEINE Kette über mehrere unsichtbare Szenen
 * hinweg (frühere Version tat das versehentlich) - sonst "weiß" ein
 * Element schon mehrere Szenen im Voraus, wohin es später soll, und
 * bewegt sich dorthin, WÄHREND es gerade erst ausblendet. Sichtbar wurde
 * das z.B. beim Abbauen des Stapels im Footer-Bereich: eine kleine
 * Kugel schien schon leicht nach links wegzudriften, bevor sie an ihrer
 * tiefsten Stapel-Position eigentlich verschwinden sollte. Jetzt bleibt
 * ein Element in JEDER unsichtbaren Szene, die nicht unmittelbar vor
 * seinem Erscheinen liegt, einfach an seinem eigenen (im Builder
 * gesetzten) Platzhalter stehen.
 */
function fillHiddenPositions(scenes) {
  const n = scenes[0].length;
  for (let s = scenes.length - 2; s >= 0; s--) {
    for (let i = 0; i < n; i++) {
      if (!scenes[s][i].vis && scenes[s + 1][i].vis) {
        scenes[s][i] = { ...scenes[s][i], pos: scenes[s + 1][i].pos, scale: scenes[s + 1][i].scale };
      }
    }
  }
  return scenes;
}

// ---------- Geteilte Teil-Phasen ----------

/**
 * REIHE ausblenden (identisch für Hero- und Footer-Ende): Menü (Slot 0)
 * bleibt die ganze Zeit sichtbar am Rand. Slot 1, dann 2, dann 3, ...
 * werden nacheinander unsichtbar; die noch sichtbaren rücken dabei
 * (weiterhin groß) Richtung Rand nach. Gibt N Szenen zurück (h = 0..N-1).
 */
function rowHidePhase(n, R) {
  const scenes = [];
  for (let h = 0; h <= n - 1; h++) {
    scenes.push(
      Array.from({ length: n }, (_, i) => {
        if (i === 0) return { vis: 1, pos: R(0), scale: 1 };
        // Platzhalter für ausgeblendete Kugeln: R(1), NICHT R(0). Jede
        // Kugel ist unmittelbar bevor sie verschwindet an Position R(1)
        // (direkt neben Menü) - das lässt sich nachrechnen: Kugel i wird
        // bei h=i unsichtbar, ihre letzte sichtbare Position bei h=i-1
        // war R(i-(i-1))=R(1), für JEDE Kugel gleich. Mit R(0) (Rand)
        // als Platzhalter würde die Kugel beim Ausblenden sichtbar einen
        // Schritt Richtung Rand "zurückspringen", bevor sie verblasst.
        return i > h ? { vis: 1, pos: R(i - h), scale: 1 } : { vis: 0, pos: R(1), scale: 1 };
      })
    );
  }
  return scenes;
}

/**
 * Stapel-Aufbau am HERO-Ende: Menü bleibt fest OBEN (Stapel-Slot 0). Die
 * übrigen Kugeln kommen in ABSTEIGENDER Slot-Reihenfolge dazu (zuerst die
 * vorher äußerste), jede neue legt sich direkt UNTER Menü (Stapel-Slot 1)
 * und schiebt die bereits vorhandenen eine Position weiter nach unten.
 * Gibt N Szenen zurück (b = 0..N-1, b=N-1 ist der fertige Stapel).
 */
function heroStackBuildPhase(n, S, smallScale) {
  const scenes = [];
  for (let b = 0; b <= n - 1; b++) {
    scenes.push(
      Array.from({ length: n }, (_, k) => {
        if (k === 0) return { vis: 1, pos: S(0), scale: smallScale };
        return k >= n - b
          ? { vis: 1, pos: S(1 + b - n + k), scale: smallScale }
          : { vis: 0, pos: S(0), scale: smallScale };
      })
    );
  }
  return scenes;
}

/**
 * Stapel-Aufbau am FOOTER-Ende: Menü schrumpft zuerst ALLEIN nach UNTEN
 * (Stapel-Slot N-1). Die übrigen Kugeln kommen in AUFSTEIGENDER
 * Slot-Reihenfolge dazu (zuerst Sprache/Slot 1), jede neue legt sich
 * UNTEN an und schiebt ALLE bereits vorhandenen (auch Menü selbst) eine
 * Position nach OBEN - bis Menü ganz oben ankommt. Gibt N Szenen zurück
 * (b = 0..N-1).
 */
function footerStackBuildPhase(n, S, smallScale) {
  const scenes = [];
  for (let b = 0; b <= n - 1; b++) {
    scenes.push(
      Array.from({ length: n }, (_, k) => {
        if (k === 0) return { vis: 1, pos: S(n - 1 - b), scale: smallScale };
        return b >= k
          ? { vis: 1, pos: S(n - 1 - b + k), scale: smallScale }
          : { vis: 0, pos: S(n - 1), scale: smallScale };
      })
    );
  }
  return scenes;
}

/**
 * Stapel-Abbau Richtung FOOTER: die jeweils UNTERSTE sichtbare Kugel
 * verschwindet zuerst (Slot N-1, dann N-2, ...), der Rest (auch Menü)
 * rutscht dabei gemeinsam eine Position nach unten nach - die oberste
 * Position wird frei. Gibt N-1 Szenen zurück (u = 1..N-1; u=N-1 lässt
 * nur noch Menü übrig, unten im Stapel).
 */
function footerStackUnbuildPhase(n, S, smallScale) {
  const scenes = [];
  for (let u = 1; u <= n - 1; u++) {
    scenes.push(
      Array.from({ length: n }, (_, k) =>
        k < n - u ? { vis: 1, pos: S(k + u), scale: smallScale } : { vis: 0, pos: S(n - 1), scale: smallScale }
      )
    );
  }
  return scenes;
}

/**
 * Stapel-Abbau Richtung HERO: Menü bleibt fest OBEN. Die Kugel direkt
 * darunter (Stapel-Slot 1) verschwindet zuerst (aufsteigende
 * Slot-Reihenfolge: erst Sprache, dann Kontakt, dann Events), die
 * verbleibenden rutschen dabei unter Menü nach oben nach. Gibt N-1
 * Szenen zurück (u = 1..N-1).
 */
function heroStackUnbuildPhase(n, S, smallScale) {
  const scenes = [];
  for (let u = 1; u <= n - 1; u++) {
    scenes.push(
      Array.from({ length: n }, (_, k) => {
        if (k === 0) return { vis: 1, pos: S(0), scale: smallScale };
        // Platzhalter S(1), aus demselben Grund wie in rowHidePhase: die
        // letzte sichtbare Position jeder Kugel direkt bevor sie hier
        // verschwindet ist immer S(1) (direkt unter Menü).
        return u < k
          ? { vis: 1, pos: S(1 + (k - 1 - u)), scale: smallScale }
          : { vis: 0, pos: S(1), scale: smallScale };
      })
    );
  }
  return scenes;
}

/**
 * Menü wächst ALLEIN von seiner Stapel- zu seiner Reihen-Position
 * (1 Szene), danach kommen die übrigen Kugeln in ABSTEIGENDER
 * Slot-Reihenfolge zurück in die Reihe - jede zunächst auf dem nächsten
 * freien Platz direkt neben Menü, schiebt die bereits erschienenen
 * gemeinsam einen Platz weiter nach außen. Gibt N Szenen zurück
 * (identisch für Hero- und Footer-Ende).
 */
function pivotAndRevealPhase(n, R) {
  const scenes = [];
  scenes.push(
    Array.from({ length: n }, (_, i) => (i === 0 ? { vis: 1, pos: R(0), scale: 1 } : { vis: 0, pos: R(0), scale: 1 }))
  );
  for (let r = 1; r <= n - 1; r++) {
    scenes.push(
      Array.from({ length: n }, (_, i) => {
        if (i === 0) return { vis: 1, pos: R(0), scale: 1 };
        if (i >= n - r) return { vis: 1, pos: R(i + r - n + 1), scale: 1 };
        return { vis: 0, pos: R(0), scale: 1 };
      })
    );
  }
  return scenes;
}

// ---------- Öffentliche, zusammengesetzte Choreografien ----------

/**
 * REIHE -> STAPEL. `variant` bestimmt, an welchem Ende der Seite das
 * passiert: "hero" (Menü bleibt oben fest, Rest kommt absteigend dazu)
 * oder "footer" (Menü wandert von unten nach oben, Rest kommt
 * aufsteigend dazu). Gibt 2N Szenen zurück.
 */
export function buildRowToStackScenes(n, R, S, smallScale, variant = "hero") {
  const hide = rowHidePhase(n, R);
  const build = variant === "footer" ? footerStackBuildPhase(n, S, smallScale) : heroStackBuildPhase(n, S, smallScale);
  return fillHiddenPositions([...hide, ...build]);
}

/**
 * STAPEL -> REIHE. `variant` bestimmt, an welchem Ende der Seite das
 * passiert: "footer" (unterste Kugel verschwindet zuerst, Rest rutscht
 * nach unten nach) oder "hero" (Menü bleibt oben fest, Kugel direkt
 * darunter verschwindet zuerst). Gibt 2N Szenen zurück.
 */
export function buildStackToRowScenes(n, R, S, smallScale, variant = "footer") {
  const initial = [Array.from({ length: n }, (_, i) => ({ vis: 1, pos: S(i), scale: smallScale }))];
  const unbuild =
    variant === "hero" ? heroStackUnbuildPhase(n, S, smallScale) : footerStackUnbuildPhase(n, S, smallScale);
  const pivotReveal = pivotAndRevealPhase(n, R);
  return fillHiddenPositions([...initial, ...unbuild, ...pivotReveal]);
}