// ---------- events-carousel.spec.js ----------
// Testet das Events-Karussell auf der echten Seite (/de/veranstaltungen/)
// im echten Browser - Klicks, Tastatur, Hover, wie ein Nutzer sie machen
// würde. Ersetzt die frühere eventsCarousel.test.js (Vitest + jsdom), die
// in diesem Playwright-Projekt nicht lauffähig war.
//
// Für Autoplay wird Playwrights virtuelle Uhr (page.clock, ab Playwright
// 1.45) verwendet: page.clock.install() MUSS vor page.goto() aufgerufen
// werden, damit sie den vom Karussell beim Laden gestarteten setInterval
// von Anfang an abfängt. page.clock.fastForward(ms) spult danach die
// Zeit vor und lässt fällige Timer sofort feuern - dadurch dauern die
// Autoplay-Tests Millisekunden statt echte 6,5 Sekunden.

const { test, expect } = require("@playwright/test");

const EVENTS_PATH = "de/veranstaltungen/";
const AUTOPLAY_MS = 6500; // muss zu data-autoplay-ms in events.njk passen

/** Installiert die virtuelle Uhr, navigiert zur Events-Seite, wartet auf das Karussell. */
async function gotoEventsWithClock(page) {
  await page.clock.install();
  await page.goto(EVENTS_PATH);
  await expect(page.locator("[data-events-slide]").first()).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await gotoEventsWithClock(page);
});

test("zeigt beim Start nur das erste Event, restliche sind versteckt", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");
  const count = await slides.count();
  expect(count).toBeGreaterThanOrEqual(3); // laut Vorgabe: 3 bis 10 Events

  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");
  for (let i = 1; i < count; i++) {
    await expect(slides.nth(i)).toHaveAttribute("aria-hidden", "true");
  }

  const dots = page.locator("[data-events-dot]");
  await expect(dots.nth(0)).toHaveClass(/is-active/);
});

test("Klick auf 'Weiter' zeigt das nächste Event und aktualisiert die Screenreader-Ansage", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");

  await page.locator("[data-events-next]").click();

  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "true");
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");

  const expectedLabel = await slides.nth(1).getAttribute("aria-label");
  await expect(page.locator("[data-events-live]")).toHaveText(expectedLabel);
});

test("Klick auf 'Zurück' bei Event 1 springt zum letzten Event (Endlos-Schleife)", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");
  const count = await slides.count();

  await page.locator("[data-events-prev]").click();

  await expect(slides.nth(count - 1)).toHaveAttribute("aria-hidden", "false");
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "true");
});

test("Klick auf einen Punkt springt direkt zu diesem Event", async ({ page }) => {
  const dots = page.locator("[data-events-dot]");
  const slides = page.locator("[data-events-slide]");
  const count = await slides.count();
  const targetIndex = Math.min(2, count - 1); // dritter Punkt, oder letzter bei nur 3 Events

  await dots.nth(targetIndex).click();

  await expect(slides.nth(targetIndex)).toHaveAttribute("aria-hidden", "false");
  await expect(dots.nth(targetIndex)).toHaveClass(/is-active/);
  await expect(dots.nth(targetIndex)).toHaveAttribute("aria-selected", "true");
});

test("Pfeiltasten navigieren, wenn der Fokus im Karussell liegt", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");

  await page.locator("[data-events-next]").focus();
  await page.keyboard.press("ArrowRight");
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");

  await page.keyboard.press("ArrowLeft");
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");
});

test("wechselt automatisch weiter (Autoplay), ohne dass jemand klickt", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");

  await page.clock.fastForward(AUTOPLAY_MS);
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");

  await page.clock.fastForward(AUTOPLAY_MS);
  await expect(slides.nth(2)).toHaveAttribute("aria-hidden", "false");
});

test("Pause-Button stoppt den automatischen Ablauf, erneutes Klicken setzt ihn fort", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");
  const playPause = page.locator("[data-events-playpause]");

  await playPause.click(); // pausieren
  await expect(playPause).toHaveAttribute("aria-pressed", "true");

  await page.clock.fastForward(AUTOPLAY_MS * 2);
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false"); // trotz Zeitablauf keine Bewegung

  await playPause.click(); // fortsetzen
  await expect(playPause).toHaveAttribute("aria-pressed", "false");

  await page.clock.fastForward(AUTOPLAY_MS);
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");
});

test("Hover pausiert den Ablauf, ohne den Pause-Button umzuschalten", async ({ page }) => {
  const slides = page.locator("[data-events-slide]");
  const playPause = page.locator("[data-events-playpause]");
  const carousel = page.locator("[data-events-carousel]");

  await carousel.hover();
  await expect(playPause).toHaveAttribute("aria-pressed", "false"); // Button-Zustand bleibt "spielt"

  await page.clock.fastForward(AUTOPLAY_MS * 2);
  await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false"); // keine Bewegung während des Hovers

  // Maus weit weg bewegen, damit "mouseleave" sicher feuert.
  await page.mouse.move(0, 0);
  await page.clock.fastForward(AUTOPLAY_MS);
  await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false"); // läuft nach dem Verlassen wieder
});

test.describe("mit aktivierter Systemeinstellung 'Bewegung reduzieren'", () => {
  test("kein automatischer Wechsel, aber die Pfeile funktionieren weiterhin", async ({ page }) => {
    // Statt Playwrights context-weiter reducedMotion-Emulation (die sich
    // als timing-abhängig erwiesen hat - siehe die frühere, flackernde
    // Version dieses Tests) patchen wir window.matchMedia DIREKT in der
    // echten Seite. addInitScript() garantiert, dass dieser Code vor JEDEM
    // Skript der Seite läuft, bei jeder Navigation ab jetzt - kein
    // Emulations-Timing-Risiko mehr, aber weiterhin dieselbe echte Seite
    // mit demselben echten eventsCarousel.js wie im echten Betrieb.
    await page.addInitScript(() => {
      const originalMatchMedia = window.matchMedia.bind(window);
      window.matchMedia = (query) => {
        if (query === "(prefers-reduced-motion: reduce)") {
          return {
            matches: true,
            media: query,
            addListener() {},
            removeListener() {},
            addEventListener() {},
            removeEventListener() {},
            dispatchEvent() { return true; },
          };
        }
        return originalMatchMedia(query);
      };
    });

    // Erneut navigieren: die Navigation aus dem äußeren beforeEach lief VOR
    // diesem addInitScript und zählt daher nicht (der Patch war zu dem
    // Zeitpunkt noch nicht registriert). Diesmal ist er von Anfang an aktiv.
    await gotoEventsWithClock(page);

    const slides = page.locator("[data-events-slide]");

    await page.clock.fastForward(AUTOPLAY_MS * 2);
    await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false"); // keine automatische Bewegung

    await page.locator("[data-events-next]").click();
    await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false"); // manuell geht trotzdem
  });
});

test.describe("Datumsgrenze: 'heute' zählt noch als zukünftig, der Folgetag nicht mehr", () => {
  test("ein Event wandert am Tag nach seinem Enddatum vom Zukunfts- ins Vergangenheits-Karussell", async ({ page }) => {
    // Das nächste bevorstehende Event ganz normal (mit echtem heutigen
    // Datum) ermitteln und sein relevantes Enddatum auslesen - dieselbe
    // Regel wie slideEndDate() in eventsCarousel.js: data-date-end, sonst
    // data-date-start. Dadurch ist der Test unabhängig von den konkreten
    // Testdaten und funktioniert auch bei mehrtägigen Events korrekt.
    const nextEventSlide = page.locator("[data-events-slide]").first();
    const nextEventStart = await nextEventSlide.getAttribute("data-date-start");
    const nextEventEnd = await nextEventSlide.evaluate(
      (el) => el.dataset.dateEnd || el.dataset.dateStart
    );
    expect(
      nextEventEnd,
      "Kein bevorstehendes Event gefunden, anhand dessen die Datumsgrenze getestet werden könnte"
    ).toBeTruthy();
 
    // Virtuelle Uhr GENAU auf Mitternacht des Endtages stellen und neu
    // laden, damit partitionEventsByDate() mit dem neuen "heute" erneut
    // läuft (siehe setupAllEventCarousels() in eventsCarousel.js).
    await page.clock.setSystemTime(new Date(`${nextEventEnd}T00:00:00`));
    await page.reload();
    await expect(page.locator("[data-events-slide]").first()).toBeVisible();
 
    // Am Endtag selbst MUSS das Event noch im Zukunfts-Karussell stehen -
    // partitionEventsByDate() entfernt dort nur Folien mit end < today,
    // "heute" (end === today) bleibt also zukünftig.
    await expect(
      page.locator(`[data-events-slide][data-date-start="${nextEventStart}"]`)
    ).toHaveCount(1);
 
    // Einen Tag weiterspulen: Das Enddatum liegt jetzt "gestern".
    const dayAfter = new Date(`${nextEventEnd}T00:00:00`);
    dayAfter.setDate(dayAfter.getDate() + 1);
    await page.clock.setSystemTime(dayAfter);
    await page.reload();
 
    // Ab dem Folgetag darf es NICHT mehr im Zukunfts-Karussell stehen
    // (partitionEventsByDate() entfernt es dort per slide.remove()) ...
    await expect(
      page.locator(`[data-events-slide][data-date-start="${nextEventStart}"]`)
    ).toHaveCount(0);
 
    // ... sondern muss stattdessen im Vergangenheits-Karussell auftauchen.
    await expect(
      page.locator(`[data-past-slide][data-date-start="${nextEventStart}"]`)
    ).toHaveCount(1);
  });
});
 
 
test.describe("Vergangenheits-Karussell ('Schöne Erinnerungen')", () => {
  test("zeigt beim Start nur die neueste Erinnerung, restliche sind versteckt", async ({ page }) => {
    const slides = page.locator("[data-past-slide]");
    const count = await slides.count();
    test.skip(count === 0, "Keine vergangenen Events in den aktuellen Testdaten vorhanden");
 
    await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");
    for (let i = 1; i < count; i++) {
      await expect(slides.nth(i)).toHaveAttribute("aria-hidden", "true");
    }
  });
 
  test("Klick auf 'weiter' zeigt die nächstältere Erinnerung und aktualisiert den Zähler", async ({ page }) => {
    const slides = page.locator("[data-past-slide]");
    const count = await slides.count();
    test.skip(count < 2, "Zu wenige vergangene Events zum Navigieren");
 
    // Format laut render() in eventsCarousel.js: z.B. "1/5" (kein
    // Leerzeichen, kein "von"-Wort - bewusst kompakt für die schmale
    // Steuerungsspalte).
    await expect(page.locator("[data-past-counter]")).toHaveText("1/" + count);
 
    await page.locator("[data-past-next]").click();
 
    await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "true");
    await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");
    await expect(page.locator("[data-past-counter]")).toHaveText("2/" + count);
  });
 
  test("Pfeil 'zurück' ist bei der neuesten Erinnerung deaktiviert (kein Endlos-Wechsel)", async ({ page }) => {
    const count = await page.locator("[data-past-slide]").count();
    test.skip(count === 0, "Keine vergangenen Events vorhanden");
 
    // Anders als beim Zukunfts-Karussell: laut Code-Kommentar in
    // createPastCarouselController() gibt es HIER keine Endlos-Schleife -
    // am jeweiligen Ende deaktiviert sich der Pfeil, statt umzuspringen.
    await expect(page.locator("[data-past-prev]")).toBeDisabled();
  });
 
  test("Pfeil 'weiter' ist bei der ältesten Erinnerung deaktiviert", async ({ page }) => {
    const count = await page.locator("[data-past-slide]").count();
    test.skip(count < 2, "Zu wenige vergangene Events zum Durchklicken");
 
    const nextBtn = page.locator("[data-past-next]");
    for (let i = 0; i < count - 1; i++) {
      await nextBtn.click();
    }
    await expect(nextBtn).toBeDisabled();
    await expect(page.locator("[data-past-prev]")).toBeEnabled();
  });
 
  test("Pfeiltasten hoch/runter navigieren, wenn der Fokus im Karussell liegt", async ({ page }) => {
    const slides = page.locator("[data-past-slide]");
    const count = await slides.count();
    test.skip(count < 2, "Zu wenige vergangene Events zum Navigieren");
 
    await page.locator("[data-past-next]").focus();
    await page.keyboard.press("ArrowDown");
    await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false");
 
    await page.keyboard.press("ArrowUp");
    await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false");
  });
 
  test("Leer-Zustand erscheint, wenn keine vergangenen Events existieren", async ({ page }) => {
    const count = await page.locator("[data-past-slide]").count();
    // Greift nur, wenn die aktuellen Testdaten (noch) keine vergangenen
    // Events enthalten - siehe Hinweis am Dateiende für den Fall, dass
    // ihr das gezielt erzwingen wollt.
    test.skip(count > 0, "Es gibt aktuell vergangene Events - Leer-Zustand kann so nicht ausgelöst werden");
 
    await expect(page.locator("[data-past-empty]")).toBeVisible();
  });
 
  test("WhatsApp-Kontakt-Widget rendert das Telefonnummer-Canvas", async ({ page }) => {
    // Struktur laut contact-utils.js (renderContacts()): das Wrapper-Div
    // bekommt die Klassen "contact-phone contact-value-box", DARIN liegt
    // ein <canvas class="phone-canvas">. Das aria-label sitzt direkt auf
    // dem <canvas>, nicht auf dem Wrapper-Div.
    const widget = page.locator("[data-phone-contact-theme='dark']");
    await expect(widget).toBeVisible();
 
    const canvas = widget.locator("canvas.phone-canvas");
    await expect(canvas).toHaveAttribute(
      "aria-label",
      "Telefonnummer als Bild, gegen automatisiertes Auslesen geschützt"
    );
 
    // drawCanvases() setzt canvas.width erst NACH dem Zeichnen (basierend
    // auf der gemessenen Textbreite) - width > 0 heißt also: es wurde
    // wirklich etwas gezeichnet, nicht nur ein leeres <canvas> eingefügt.
    const canvasWidth = await canvas.evaluate((el) => el.width);
    expect(canvasWidth, "Canvas wurde nicht mit Inhalt gezeichnet").toBeGreaterThan(0);
 
    // Kopieren-Button ist vorhanden und zeigt anfangs sein normales
    // Label (noch nicht "Kopiert ✓").
    const copyBtn = widget.locator(".copy-btn");
    await expect(copyBtn).toBeVisible();
    await expect(copyBtn).not.toHaveText(/Kopiert/);
  });
});
 
// Hinweis zum Leer-Zustand-Test oben: Falls eure Testdaten immer sowohl
// zukünftige als auch vergangene Events enthalten, greift dieser Test nie
// wirklich (er wird via test.skip übersprungen). Um ihn zuverlässig
// auszulösen, bräuchtet ihr eine Möglichkeit, die Events-Daten für einen
// einzelnen Testlauf zu mocken (z.B. über page.route() auf die JSON-Quelle
// der Events, falls es eine gibt, oder eine dedizierte Test-Fixture-Seite).
//
// Zur Telefonnummer in phoneContact.js: die vorherige Vermutung, dass
// ["+49 176 ", "2536160"].join("6") ein Fehler sei, war FALSCH - das
// Ergebnis ist "+49 176 62536160", eine gültige deutsche Mobilnummer.
// Der Trick fügt bewusst die fehlende erste Ziffer als Trennzeichen von
// join() ein, damit die vollständige Nummer nirgends als zusammen-
// hängender String im Quellcode steht (Schutz vor simplen Scrapern).
// Kein Handlungsbedarf hier.

test("mehrsprachig: Events-Seite ist auch auf Englisch und Niederländisch erreichbar", async ({ page }) => {
  await page.goto("en/events/");
  await expect(page.locator("[data-events-slide]").first()).toBeVisible();

  await page.goto("nl/evenementen/");
  await expect(page.locator("[data-events-slide]").first()).toBeVisible();
});