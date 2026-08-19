# Zuhause. Ankommen. — mehrsprachig mit 11ty

## 1. Installieren

```bash
npm install
```

## 2. Lokale Vorschau (alle drei Sprachen gleichzeitig)

```bash
npm start
```

Öffnet einen lokalen Server (meist http://localhost:8080). Erreichbar sind
u. a.:
- http://localhost:8080/de/
- http://localhost:8080/en/
- http://localhost:8080/nl/
- http://localhost:8080/de/impressum/
- http://localhost:8080/en/imprint/
- http://localhost:8080/nl/colofon/

Änderungen an `layout.njk`, `nav.njk` oder den JSON-Dateien lösen automatisch
einen Neu-Build aus (Live-Reload).

## 3. Produktions-Build

```bash
npm run build
```

Baut die fertige Seite nach `_site/`. Das ist der Ordner, den du am Ende
hochlädst (z. B. zu GitHub Pages).

## 4. Noch zu ergänzen (fehlt hier, da nicht Teil der hochgeladenen Dateien)

Lege diese Ordner unter `src/assets/` an und fülle sie mit deinen echten
Dateien (sie werden 1:1 mit nach `_site/assets/...` kopiert):

- `src/assets/fonts/` — die drei Schriftdateien (Fraunces, Space Grotesk, JetBrains Mono)
- `src/assets/favicon/` — deine Favicon-Dateien
- `src/assets/logo/Logo_NeuesZuhause.png`
- `src/assets/media/Hero/...`, `.../Garten/`, `.../Vorne/`, `.../Hinten/`,
  `.../Bad/`, `.../Grundriss/`, `.../Video vorne/`, `.../Video hinten/`
  (siehe `src/assets/js/gallery.js` für die genauen Dateinamen)

## 5. Bekannte Vereinfachungen / offene Punkte

- Die Favicon-Verlinkung im Layout ist auf die wichtigsten Größen reduziert
  (statt aller Varianten aus dem Original). Bei Bedarf in `layout.njk`
  ergänzen — Muster ist erkennbar.
- Die Bildunterschriften/Labels in der Foto-Galerie ("Foto — Garten" usw.)
  kommen weiterhin fest aus `gallery.js` und sind noch nicht mehrsprachig.
  Um sie zu übersetzen, müsste man sie z. B. per `data-`-Attribut aus dem
  jeweiligen `.njk`-Template übergeben — analog zu dem Muster, das ich bei
  `emailContact.js` (Copy-Button-Text) schon verwendet habe.
- Die Domain in `layout.njk`/`sitemap.njk`
  (`https://www.zuhause-ankommen.example`) ist ein Platzhalter — durch deine
  echte Domain ersetzen.
- Rechtstexte (Impressum/Datenschutz) wurden inhaltlich ins Englische/
  Niederländische übersetzt, sind aber keine Rechtsberatung — bei echtem
  Einsatz für internationale Mieter:innen von einer fachkundigen Person
  gegenprüfen lassen.
