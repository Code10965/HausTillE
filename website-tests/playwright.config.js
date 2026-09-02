// @ts-check
const { defineConfig, devices } = require("@playwright/test");

/**
 * BASE_URL kommt aus einer Umgebungsvariable, damit du dasselbe Setup
 * lokal ("http://localhost:8080" beim `eleventy --serve`) UND gegen die
 * echte Live-Seite laufen lassen kannst, ohne Code zu ändern.
 *
 * Aktuell zeigt die URL auf die GitHub-Pages-Projekt-Site (mit dem
 * Unterordner "/HausTillE/"). Sobald www.haus-till-e.com als eigene
 * Domain verknüpft ist, hier auf "https://www.haus-till-e.com" umstellen
 * (dann OHNE "/HausTillE/" am Ende) - oder einfach das BASE_URL-Secret
 * in GitHub Actions ändern, dann muss diese Datei gar nicht angefasst werden.
 */
const BASE_URL = process.env.BASE_URL || "https://code10965.github.io/HausTillE/";

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
