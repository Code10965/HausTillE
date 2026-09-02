// ---------- contact.spec.js ----------
// E-Mail und Telefonnummer werden bei dir bewusst NICHT als Text im HTML
// ausgeliefert (Schutz vor Spam-Bots), sondern als Canvas-Grafik gezeichnet.
// Genau das macht sie testenswert: ein kleiner Fehler im JS, und der Nutzer
// sieht eine leere Box statt der Kontaktdaten.

const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("de/");
  await page.locator("#nav-toggle").click();
  await page.locator('#nav-dropdown a[href="#section-contact"]').click();
});

test("E-Mail-Canvas wird sichtbar gezeichnet (nicht leer)", async ({ page }) => {
  const canvas = page.locator("canvas.email-canvas").first();
  await expect(canvas).toBeVisible();

  const width = await canvas.evaluate((el) => el.width);
  expect(width, "E-Mail-Canvas hat keine Breite - vermutlich nicht gezeichnet").toBeGreaterThan(0);
});

test("Telefon-Canvas wird sichtbar gezeichnet (nicht leer)", async ({ page }) => {
  const canvas = page.locator("canvas.phone-canvas").first();
  await expect(canvas).toBeVisible();

  const width = await canvas.evaluate((el) => el.width);
  expect(width, "Telefon-Canvas hat keine Breite - vermutlich nicht gezeichnet").toBeGreaterThan(0);
});

test("Kopieren-Button für E-Mail funktioniert und zeigt Bestätigung", async ({ page, context, browserName }) => {
  // Clipboard-Zugriff braucht in Chromium eine explizite Berechtigung;
  // in Safari/WebKit wird das im Test übersprungen (dort nicht steuerbar).
  test.skip(browserName !== "chromium", "Clipboard-Permissions nur zuverlässig in Chromium testbar");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);

  const emailBox = page.locator("[data-email-contact-theme]").first();
  const copyButton = emailBox.locator(".copy-btn");
  const originalLabel = await copyButton.textContent();

  await copyButton.click();
  await expect(copyButton).not.toHaveText(originalLabel);

  const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
  expect(clipboardText).toContain("@");
});

test("Beide Telefonnummern-Boxen sind vorhanden", async ({ page }) => {
  await expect(page.locator("canvas.phone-canvas")).toHaveCount(1);
  await expect(page.locator("canvas.phone-2-canvas")).toHaveCount(1);
});
