// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * BASE_URL kommt aus einer Umgebungsvariable, damit du dasselbe Setup
 * lokal ("http://localhost:8080" beim `eleventy --serve`) UND gegen die
 * echte Live-Seite laufen lassen kannst, ohne Code zu ändern.
 *
 * Fallback zeigt jetzt auf die echte, eigene Domain (ohne Unterordner-
 * Präfix, da die Seite seit der Manitu-Umstellung im Root liegt). Ein
 * eventuell gesetztes BASE_URL-Secret in GitHub Actions hat weiterhin
 * Vorrang vor diesem Fallback.
 */
const BASE_URL = process.env.BASE_URL || "https://www.haus-till-e.com";

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 30_000,
  retries: 1, // ein Wiederholungsversuch, falls z.B. das Netz kurz hakt
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: BASE_URL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "Desktop Chrome",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 13"] },
    },
  ],
});