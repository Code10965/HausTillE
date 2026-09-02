// ---------- smoke.spec.js ----------
// "Smoke Test" = der einfachste, schnellste Test: lädt die Seite überhaupt,
// kommt kein Server-Fehler, ist ein Titel da, laden die wichtigsten Bilder?
// Wenn hier schon etwas rot ist, ist die Seite kaputt - alles Weitere
// (Navigation, Kontakt) macht dann keinen Sinn mehr zu prüfen.

const { test, expect } = require("@playwright/test");
const { PAGES } = require("./pages");

for (const page of PAGES) {
  test(`${page.path} lädt fehlerfrei (${page.lang}/${page.key})`, async ({ page: browserPage }) => {
    const response = await browserPage.goto(page.path);

    // 1. Kam überhaupt eine gültige Antwort zurück? (kein 404, kein 500)
    expect(response, `Keine Antwort von ${page.path}`).not.toBeNull();
    expect(response.status(), `${page.path} antwortete nicht mit 200`).toBe(200);

    // 2. Hat die Seite einen Titel? (leere <title> ist ein Warnsignal)
    await expect(browserPage).toHaveTitle(/.+/);

    if (page.expectedTitleIncludes) {
      await expect(browserPage).toHaveTitle(new RegExp(page.expectedTitleIncludes));
    }

    // 3. Gibt es offensichtliche Fehlertexte im HTML? (z.B. Eleventy-Build-Fehler,
    // die manchmal als Text statt als Server-Fehler ausgeliefert werden)
    const bodyText = await browserPage.locator("body").innerText();
    expect(bodyText.toLowerCase()).not.toContain("error");
    expect(bodyText.toLowerCase()).not.toContain("undefined");
  });
}

test("Logo-Bild lädt auf der deutschen Startseite", async ({ page }) => {
  await page.goto("de/");
  const logo = page.locator("img[src*='Logo_Till_E']").first();
  await expect(logo).toBeVisible();

  // Prüft, dass die Bilddatei wirklich geladen wurde (naturalWidth > 0),
  // nicht nur, dass ein <img>-Tag im HTML steht - ein kaputter Bildpfad
  // würde vom bloßen "ist im DOM"-Check nicht erkannt.
  const naturalWidth = await logo.evaluate((img) => img.naturalWidth);
  expect(naturalWidth, "Logo-Bild konnte nicht geladen werden").toBeGreaterThan(0);
});

test("Keine kaputten Bilder auf der Startseite (alle Sprachen)", async ({ page }) => {
  await page.goto("de/");

  const images = await page.locator("img").all();
  for (const img of images) {
    const naturalWidth = await img.evaluate((el) => el.naturalWidth);
    const src = await img.getAttribute("src");
    expect(naturalWidth, `Bild konnte nicht geladen werden: ${src}`).toBeGreaterThan(0);
  }
});

test("Root-Redirect leitet zur deutschen Startseite weiter", async ({ page }) => {
  // "" statt "/" - "/" würde bei einer Projekt-Site (github.io/HausTillE/)
  // an die Wurzel der github.io-Domain springen statt an den Unterordner.
  // Sobald die eigene Domain ohne Unterordner läuft, funktioniert "" weiterhin.
  await page.goto("");
  await page.waitForURL("**/de/**", { timeout: 5000 });
  expect(page.url()).toContain("/de/");
});
