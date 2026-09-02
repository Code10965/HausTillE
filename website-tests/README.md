# Website-Tests für Zuhause an der Mosel

Automatisierte Tests, die täglich prüfen, ob deine Website lädt und für
Besucher problemlos nutzbar ist. Stell es dir wie einen Kontrollgang vor,
den jemand jeden Morgen für dich macht: Tür auf? Licht an? Klingel okay?

## Was wird getestet?

| Datei | Prüft |
|---|---|
| `tests/smoke.spec.js` | Lädt jede der 9 Seiten (3 Sprachen × 3 Seiten) fehlerfrei? Titel vorhanden? Bilder geladen? |
| `tests/navigation.spec.js` | Öffnen sich Menü/Sprache/Kontakt-Dropdown per Klick? Springt der Menüpunkt zur richtigen Section? |
| `tests/contact.spec.js` | Werden E-Mail/Telefon (als Canvas-Bild) korrekt gezeichnet? Funktioniert der Kopieren-Button? |
| `tests/legal-pages.spec.js` | Funktioniert der "Zurück"-Link auf Impressum/Datenschutz? |

## Einmaliges Setup (lokal)

```bash
# 1. Diesen Ordner in dein Projekt kopieren (oder als eigenes Repo anlegen)
npm install

# 2. Playwright-Browser herunterladen (einmalig)
npx playwright install --with-deps
```

## Tests lokal ausführen

Gegen deine lokale Eleventy-Vorschau:
```bash
# Terminal 1: deine Seite lokal starten
npm run start   # in deinem Website-Projekt (eleventy --serve)

# Terminal 2: Tests laufen lassen
BASE_URL=http://localhost:8080 npx playwright test
```

Gegen die echte, live Website:
```bash
BASE_URL=https://deine-domain.de npx playwright test
```

Ergebnis ansehen (öffnet einen HTML-Bericht im Browser):
```bash
npm run report
```

## Automatisch täglich laufen lassen (GitHub Actions)

Die Datei `.github/workflows/daily-tests.yml` ist bereits fertig
eingerichtet und läuft jeden Tag um 6:00 UTC (ca. 7-8 Uhr deutscher Zeit).

**Einmalig einrichten:**
1. Diesen Ordner in ein GitHub-Repository pushen (kann dasselbe Repo wie
   deine Website sein, oder ein eigenes Test-Repo).
2. Im Repo unter **Settings → Secrets and variables → Actions → New
   repository secret** ein Secret namens `BASE_URL` anlegen, Wert z.B.
   `https://deine-domain.de`.
3. Fertig. Unter dem **Actions**-Tab kannst du die Läufe verfolgen und
   auch manuell per Knopfdruck starten ("Run workflow").

**Bei einem Fehler:** GitHub schickt dir automatisch eine E-Mail, wenn ein
geplanter Workflow fehlschlägt (sofern in deinen GitHub-Benachrichtigungs-
einstellungen aktiviert). Zusätzlich kannst du dir im fehlgeschlagenen Lauf
unter "Artifacts" den `playwright-report` herunterladen - der zeigt dir
sogar einen Screenshot vom Moment des Fehlers.

## Eine neue Seite/Sprache hinzufügen

Nur eine Stelle pflegen: `tests/pages.js`. Dort einen neuen Eintrag in das
`PAGES`-Array ergänzen - alle Testdateien (smoke, legal-pages) nutzen diese
Liste automatisch mit.

## Nächste sinnvolle Ausbaustufen (optional)

- **Performance:** Lighthouse-CI ergänzen, um Ladezeit/Barrierefreiheit zu messen
- **Visuelle Regression:** Screenshot-Vergleich, um unbeabsichtigte Layout-Änderungen zu erkennen
- **Slack/Discord-Benachrichtigung:** statt nur E-Mail bei Fehlern
