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
  test.use({ reducedMotion: "reduce" });

  test("kein automatischer Wechsel, aber die Pfeile funktionieren weiterhin", async ({ page }) => {
    // Kein erneutes gotoEventsWithClock(page) hier - test.beforeEach hat
    // die Seite bereits geladen, und zwar schon MIT der reducedMotion-
    // Emulation aus test.use() (die gilt für den ganzen Test, inklusive
    // beforeEach). Ein zweiter Aufruf würde nur unnötig ein zweites Mal
    // navigieren und die virtuelle Uhr neu installieren.
    const slides = page.locator("[data-events-slide]");

    await page.clock.fastForward(AUTOPLAY_MS * 2);
    await expect(slides.nth(0)).toHaveAttribute("aria-hidden", "false"); // keine automatische Bewegung

    await page.locator("[data-events-next]").click();
    await expect(slides.nth(1)).toHaveAttribute("aria-hidden", "false"); // manuell geht trotzdem
  });
});

test("mehrsprachig: Events-Seite ist auch auf Englisch und Niederländisch erreichbar", async ({ page }) => {
  await page.goto("en/events/");
  await expect(page.locator("[data-events-slide]").first()).toBeVisible();

  await page.goto("nl/evenementen/");
  await expect(page.locator("[data-events-slide]").first()).toBeVisible();
});