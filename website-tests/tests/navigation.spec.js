// ---------- navigation.spec.js ----------
// Testet die interaktive Navigation auf der Startseite: die drei runden
// Buttons (Menü / Sprache / Kontakt), die jeweils ein Dropdown aufklappen.
// Diese Tests simulieren einen echten Klick, wie ein Nutzer ihn machen würde.

const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("de/");
});

test("Menü-Button öffnet das Dropdown mit allen Sections", async ({ page }) => {
  const toggle = page.locator("#nav-toggle");
  const dropdown = page.locator("#nav-dropdown");

  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-expanded", "true");
  await expect(dropdown).toBeVisible();

  // Alle fünf erwarteten Menüpunkte müssen vorhanden sein
  const expectedTargets = [
    "#section-home-details",
    "#section-rooms",
    "#section-hosts",
    "#section-area",
    "#section-contact",
  ];
  for (const target of expectedTargets) {
    await expect(dropdown.locator(`a[href="${target}"]`)).toHaveCount(1);
  }
});

test("Sprach-Button zeigt DE/EN/NL und aktive Sprache ist nicht verlinkt", async ({ page }) => {
  const toggle = page.locator("#globe-toggle");
  const dropdown = page.locator("#globe-dropdown");

  await toggle.click();
  await expect(dropdown).toBeVisible();

  // Aktuell aktive Sprache (DE) erscheint als <span>, nicht als klickbarer Link
  await expect(dropdown.locator("span.nav-link-active")).toHaveCount(1);

  // Die beiden anderen Sprachen müssen als echte, klickbare Links da sein
  const links = dropdown.locator("a.nav-link");
  await expect(links).toHaveCount(2);
});

test("Klick auf Sprachlink wechselt tatsächlich die Sprache", async ({ page }) => {
  await page.locator("#globe-toggle").click();
  const englishLink = page.locator("#globe-dropdown a.nav-link").first();
  await englishLink.click();
  await page.waitForURL("**/en/**");
  expect(page.url()).toContain("/en/");
});

test("Kontakt-Button öffnet Dropdown mit E-Mail- und Telefon-Link", async ({ page }) => {
  const toggle = page.locator("#contact-toggle");
  const dropdown = page.locator("#contact-dropdown");

  await toggle.click();
  await expect(dropdown).toBeVisible();
  await expect(dropdown.locator("a.nav-link")).toHaveCount(2);
});

test("Menüpunkt scrollt zur richtigen Section", async ({ page }) => {
  await page.locator("#nav-toggle").click();
  await page.locator('#nav-dropdown a[href="#section-contact"]').click();

  // Nach dem Klick sollte die Kontakt-Section im sichtbaren Bereich sein
  await expect(page.locator("#section-contact")).toBeInViewport({ timeout: 5000 });
});
