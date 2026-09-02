// ---------- legal-pages.spec.js ----------
// Impressum/Datenschutz haben keine große Navigation, nur Logo + Zurück-Link.
// Rechtlich sind diese Seiten wichtig genug, dass sich ein eigener,
// kleiner Test lohnt (kaputter "Zurück"-Link ist ein häufiger Praxisfehler).

const { test, expect } = require("@playwright/test");
const { LEGAL_PAGES } = require("./pages");

for (const page of LEGAL_PAGES) {
  test(`${page.path}: Zurück-Link führt zur passenden Startseite`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);

    const backLink = browserPage.locator(".legal-back");
    await expect(backLink).toBeVisible();

    await backLink.click();
    await browserPage.waitForURL(`**/${page.lang}/**`);
    expect(browserPage.url()).toContain(`/${page.lang}/`);
  });

  test(`${page.path}: Logo oben ist sichtbar und verlinkt zur Startseite`, async ({ page: browserPage }) => {
    await browserPage.goto(page.path);
    const logoLink = browserPage.locator("a.legal-logo-peek");
    await expect(logoLink).toBeVisible();
    await expect(logoLink.locator("img")).toBeVisible();
  });
}
