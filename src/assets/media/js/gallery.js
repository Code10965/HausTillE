// ---------- Foto-/Video-Galerie inklusive Lightbox ----------
// Aktiv nur auf Seiten, die tatsächlich [data-photo-grid]-Container und die
// Lightbox-Elemente enthalten (aktuell nur die Startseite) - setupGallery()
// bricht sonst früh ab, kein Fehler auf Impressum/Datenschutz.

// ---------- Medien (Name -> Bilder-Galerie ODER einzelnes Video) ----------
// Jeder Eintrag trägt seinen Typ selbst - eine einzige "Source of Truth"
// pro Name, statt getrennter Objekte für Bilder und Videos.
//
// Optionales Feld "info": Deutscher FALLBACK-Infotext für diesen Eintrag.
// Gibt es einen (nicht-leeren) Infotext, wird er beim Öffnen als
// ZUSÄTZLICHE, LETZTE SEITE im selben Karussell angehängt - erreichbar
// über dieselben Vor/Zurück-Pfeile wie die Fotos, nicht nur als
// Bildunterschrift. Wie bei "label" gilt: die tatsächlich angezeigte,
// übersetzte Version kommt aus dem data-photo-infos-Attribut (siehe
// renderPhotoGrids) - "info" hier greift nur als Fallback. Fehlt "info"
// komplett bzw. ist leer, hat die Galerie einfach keine Info-Seite - kein
// Pflichtfeld.
const media = {
  Haus: {
    type: "images",
    label: "Foto — Haus",
    items: [
      "/assets/media/Haus/Haus_1.jpg",
      "/assets/media/Haus/Haus_2.jpg",
      "/assets/media/Haus/Haus_3.jpg",
      "/assets/media/Haus/Haus_4.jpg",
      "/assets/media/Haus/Haus_5.jpg",
      "/assets/media/Haus/Haus_6.jpg",
      "/assets/media/Haus/Haus_7.jpg"
    ]
  },
  Garten: {
    type: "images",
    label: "Foto — Garten",
    items: [
      "/assets/media/Garten/Garten_1.jpg",
      "/assets/media/Garten/Garten_2.jpg",
      "/assets/media/Garten/Garten_3.jpg",
      "/assets/media/Garten/Garten_4.jpg",
      "/assets/media/Garten/Garten_5.jpg",
      "/assets/media/Garten/Garten_6.jpg",
      "/assets/media/Garten/Garten_7.jpg",
      "/assets/media/Garten/Garten_8.jpg"
    ]
  },
  Eingangsbereich: {
    type: "images",
    label: "Foto — Eingangsbereich",
    items: [
      "/assets/media/Eingangsbereich/Eingangsbereich_1.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_2.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_3.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_4.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_5.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_6.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_7.jpg"
    ]
  },
  Frühstücksraum: {
    type: "images",
    label: "Foto — Frühstücksraum",
    items: [
      "/assets/media/Frühstücksraum/Frühstücksraum_1.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_2.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_3.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_4.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_5.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_6.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_7.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_8.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_9.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_10.jpg",
    ]
  },
  Treppenhaus: {
    type: "images",
    label: "Foto — Treppenhaus",
    items: [
      "/assets/media/Treppenhaus/Treppenhaus_1.jpg",
      "/assets/media/Treppenhaus/Treppenhaus_2.jpg",
      "/assets/media/Treppenhaus/Treppenhaus_3.jpg",
      "/assets/media/Treppenhaus/Treppenhaus_4.jpg",
      "/assets/media/Treppenhaus/Treppenhaus_5.jpg",
      "/assets/media/Treppenhaus/Treppenhaus_6.jpg"
    ]
  },
  "Zimmer_1": {
    type: "images",
    label: "Foto — Zimmer 1",
    items: [
      "/assets/media/Zimmer_1/Zimmer_1_1.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_2.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_3.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_4.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_5.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_6.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_7.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_8.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_9.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_10.jpg"
    ]
  },
  "Zimmer_2": {
    type: "images",
    label: "Foto — Zimmer 2",
    items: [
      "/assets/media/Zimmer_2/Zimmer_2_1.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_2.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_3.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_4.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_5.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_6.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_7.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_8.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_9.jpg"
    ]
  },
  "Zimmer_3": {
    type: "images",
    label: "Foto — Zimmer 3",
    items: [
      "/assets/media/Zimmer_3/Zimmer_3_1.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_2.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_3.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_4.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_5.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_6.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_7.jpg",
    ]
  },
  "Zimmer_4": {
    type: "images",
    label: "Foto — Zimmer 4",
    items: [
      "/assets/media/Zimmer_4/Zimmer_4_1.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_2.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_3.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_4.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_5.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_6.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_7.jpg"
    ]
  },
  "Zimmer_5": {
    type: "images",
    label: "Foto — Zimmer 5",
    items: [
      "/assets/media/Zimmer_5/Zimmer_5_1.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_2.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_3.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_4.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_5.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_6.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_7.jpg"
    ]
  },
  Rosa: {
    type: "images",
    label: "we love Rosa",
    // textImages: Anzahl der GRAFIK-Bilder (Schriftzug "we love Name")
    // am ENDE von "items" (nicht mehr am Anfang!) - diese sollen NICHT
    // Teil der automatischen Dia-Show in der Kachel sein (siehe
    // renderPhotoGrids), tauchen aber in der vollständigen
    // Lightbox-Galerie ganz am Schluss auf (nach allen echten Fotos).
    textImages: 1,
    items: [
      "/assets/media/Rosa/Rosa_2.jpg",
      "/assets/media/Rosa/Rosa_3.jpg",
      "/assets/media/Rosa/Rosa_4.jpg",
      "/assets/media/Rosa/Rosa_5.jpg",
      "/assets/media/Rosa/Rosa_6.jpg",
      "/assets/media/Rosa/Rosa_7.jpg",
      "/assets/media/Rosa/Rosa_8.jpg",
      "/assets/media/Rosa/Rosa_9.jpg",
      "/assets/media/Rosa/Rosa_1.jpg"
    ]
  },
  Bjorn: {
    type: "images",
    label: "we love Bjørn",
    textImages: 1,
    items: [
      "/assets/media/Bjorn/Bjorn_2.jpg",
      "/assets/media/Bjorn/Bjorn_3.jpg",
      "/assets/media/Bjorn/Bjorn_4.jpg",
      "/assets/media/Bjorn/Bjorn_5.jpg",
      "/assets/media/Bjorn/Bjorn_6.jpg",
      "/assets/media/Bjorn/Bjorn_7.jpg",
      "/assets/media/Bjorn/Bjorn_8.jpg",
      "/assets/media/Bjorn/Bjorn_9.jpg",
      "/assets/media/Bjorn/Bjorn_1.jpg"
    ]
  },
  Romina: {
    type: "images",
    label: "we love Romina",
    textImages: 1,
    items: [
      "/assets/media/Romina/Romina_2.jpg",
      "/assets/media/Romina/Romina_3.jpg",
      "/assets/media/Romina/Romina_4.jpg",
      "/assets/media/Romina/Romina_5.jpg",
      "/assets/media/Romina/Romina_6.jpg",
      "/assets/media/Romina/Romina_7.jpg",
      "/assets/media/Romina/Romina_1.jpg"
    ]
  }
};

// Lightbox-Elemente werden erst beim Start gesetzt (nicht auf Modul-Ebene),
// damit dieses Modul auch dann sicher geladen werden kann, wenn es die
// Lightbox auf der jeweiligen Seite gar nicht gibt.
let lightboxEl, lightboxImg, lightboxVideo, lightboxInfoSlide, lightboxPrevBtn, lightboxNextBtn;

// Statt einer reinen Bilder-Liste (wie vorher "currentGallery") jetzt eine
// Folge von FOLIEN unterschiedlichen Typs, z.B.:
//   [{type:"image", src:"..."}, {type:"image", src:"..."}, {type:"info", text:"..."}]
// Vor/Zurück wandert einfach durch diese Liste, unabhängig vom Folientyp -
// die Info-Seite ist dadurch eine ganz normale, navigierbare Seite im
// selben Karussell, keine Extra-Bildunterschrift.
let currentSlides = [];
let currentIndex = 0;

export function setupGallery() {
  lightboxEl = document.getElementById("lightbox");
  if (!lightboxEl) return; // Seite ohne Galerie (Impressum/Datenschutz)

  lightboxImg = document.getElementById("lightbox-img");
  lightboxVideo = document.getElementById("lightbox-video");
  lightboxInfoSlide = document.getElementById("lightbox-info-slide");
  lightboxPrevBtn = document.querySelector(".lightbox-prev");
  lightboxNextBtn = document.querySelector(".lightbox-next");

  renderPhotoGrids();
  wireLightboxControls();
}

// ---------- Foto-Kacheln aus dem media-Objekt erzeugen ----------
// Im HTML steht nur ein leerer Container mit einem data-photo-grid-Attribut
// ("welche Namen, in welcher Reihenfolge"), diese Funktion baut daraus die
// komplette Kachel: Markup, Label, Vorschaubild und Klick-Handler.
//
// Mehrsprachigkeit: media[name].label/info sind IMMER Deutsch (dienen nur
// als Fallback, z.B. falls eine Seite die data-photo-labels/-infos-Attribute
// mal nicht mitgibt). Die tatsächlich angezeigten, übersetzten Texte kommen
// aus data-photo-labels bzw. data-photo-infos - JSON-Objekten
// {name: übersetzter Text}, die home.njk aus der jeweiligen Sprachdatei
// (de.json/en.json/nl.json) erzeugt. Die "name"-Werte selbst (z.B.
// "Garten") bleiben unübersetzt - sie sind nur interne IDs, um
// Bilder/Videos im media-Objekt wiederzufinden, und werden nirgends direkt
// angezeigt.
// Einfaches HTML-Escaping für die Info-Kachel-Texte, die per JSON aus
// de.json/en.json/nl.json kommen und z.B. "&", "<" oder Anführungszeichen
// enthalten könnten - ohne das würde so ein Zeichen das Markup zerreißen.
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPhotoGrids() {
  document.querySelectorAll("[data-photo-grid]").forEach((container) => {
    const names = container.dataset.photoGrid.split(",").map((n) => n.trim());

    // "photo-grid-plain" markiert Grids, deren Kacheln keinen dunklen
    // Fog-Abdunkler haben (siehe styles.css) - z.B. die Gastgeber-Kacheln
    // "we love Rosa/Bjørn/Romina". NUR dort bauen wir eine Dia-Show aus
    // mehreren <img>-Ebenen statt eines einzelnen statischen
    // Hintergrundbilds - andere Galerien (Haus, Zimmer, Garten ...)
    // zeigen weiterhin unverändert nur ihr erstes Bild als Vorschau.
    const isPlainGrid = container.classList.contains("photo-grid-plain");

    let labelOverrides = {};
    if (container.dataset.photoLabels) {
      try {
        labelOverrides = JSON.parse(container.dataset.photoLabels);
      } catch (err) {
        // Ungültiges/fehlendes JSON - dann greift einfach der deutsche Fallback.
      }
    }

    let infoOverrides = {};
    if (container.dataset.photoInfos) {
      try {
        infoOverrides = JSON.parse(container.dataset.photoInfos);
      } catch (err) {
        // Ungültiges/fehlendes JSON - dann greift einfach der deutsche Fallback.
      }
    }

    // Info-KACHELN (nicht zu verwechseln mit den Info-SEITEN oben!): eigene
    // Kacheln direkt im Grid, gleichwertig neben den Fotos, mit fest
    // hinterlegtem Text statt eines Bildes - z.B. "Info" als Name in
    // data-photo-grid, der in "media" keinen Eintrag hat. Kommt aus einem
    // separaten Attribut (data-photo-info-tiles), weil diese Texte anders
    // funktionieren als die Lightbox-Infoseiten: direkt sichtbar im Grid,
    // kein Klick nötig.
    let infoTiles = {};
    if (container.dataset.photoInfoTiles) {
      try {
        infoTiles = JSON.parse(container.dataset.photoInfoTiles);
      } catch (err) {
        // Ungültiges/fehlendes JSON - dann bleibt die Info-Kachel einfach weg.
      }
    }

    container.innerHTML = names
      .map((name) => {
        const entry = media[name];
        if (entry) {
          const label = labelOverrides[name] || entry.label;
          const videoClass = entry.type === "video" ? " video-frame" : "";

          // Bildunterschrift liegt IMMER als echte Unterschrift UNTER der
          // Kachel (heller Seitenhintergrund, Farbe var(--slate) - siehe
          // .tile-caption in styles.css), genau wie bei den Gastgeber-
          // Kacheln "we love Rosa/Bjørn/Romina" - kein Text-Overlay mehr
          // auf dem Foto selbst. ".photo-frame" bleibt reine Bildfläche
          // (Foto + Schleier-::before), ".photo-tile" umschließt Bild und
          // Unterschrift zusammen (übernimmt die Flex-Breite im Grid,
          // siehe @media-Regel in styles.css).
          //
          // Dia-Show-Variante (mehrere übereinanderliegende <img>, nur
          // "we love"-Kacheln): der Wechsel passiert per JS in
          // startTileSlideshow() weiter unten, das Überblenden selbst per
          // CSS-transition (siehe .tile-slideshow-img in styles.css).
          // "textImages" vorne im items-Array wird dabei übersprungen
          // (siehe media-Objekt oben) - diese Grafiken sind weiterhin über
          // Klick in der vollständigen Lightbox-Galerie erreichbar,
          // tauchen aber nicht in der automatischen Dia-Show auf.
          // data-full-index merkt sich pro Bild seine Position im
          // KOMPLETTEN items-Array (inkl. übersprungener Textgrafiken) -
          // dadurch weiß der Klick-Handler weiter unten genau, welches
          // Bild in der Lightbox zuerst gezeigt werden soll.
          if (isPlainGrid && entry.type === "images") {
            const textImageCount = entry.textImages || 0;
            const slideshowItems = textImageCount > 0
              ? entry.items.slice(0, entry.items.length - textImageCount)
              : entry.items;
            const hasSlideshow = slideshowItems.length > 1;
            const slideshowClass = hasSlideshow ? " tile-slideshow" : "";
            const imgsMarkup = hasSlideshow
              ? slideshowItems
                  .map((src, i) => `<img class="tile-slideshow-img${i === 0 ? " active" : ""}" src="${src}" data-full-index="${i}" alt="" />`)
                  .join("")
              : "";

            return `<div class="photo-tile">
              <div class="photo-frame${slideshowClass}" data-gallery="${name}">
                ${imgsMarkup}
              </div>
              <p class="mono-label tile-caption">${escapeHtml(label)}</p>
            </div>`;
          }

          // Alle anderen Galerien (Haus, Zimmer, ...): einzelnes statisches
          // Vorschaubild (siehe frame.style.backgroundImage weiter unten),
          // aber ebenfalls mit Unterschrift UNTER der Kachel statt als
          // Text-Overlay.
          return `<div class="photo-tile">
            <div class="photo-frame${videoClass}" data-gallery="${name}"></div>
            <p class="mono-label tile-caption">${escapeHtml(label)}</p>
          </div>`;
        }

        // Kein Bild-Eintrag gefunden - prüfen, ob es stattdessen eine
        // Info-Kachel mit diesem Namen gibt.
        const infoText = infoTiles[name];
        if (infoText) {
          return `<div class="photo-frame info-frame">
            <div class="info-frame-inner">
              <span class="mono-label wine-label">Info</span>
              <p class="info-frame-text">${escapeHtml(infoText)}</p>
            </div>
          </div>`;
        }

        return "";
      })
      .join("");

    container.querySelectorAll(".photo-frame[data-gallery]").forEach((frame, index) => {
      const name = frame.dataset.gallery;
      const entry = media[name];
      if (entry.type === "images" && entry.items.length > 0) {
        if (frame.classList.contains("tile-slideshow")) {
          startTileSlideshow(frame, index);
        } else {
          // "textImages" (siehe media-Objekt) vorne im items-Array
          // überspringen, falls vorhanden - sonst würde bei einem
          // Gastgeber mit nur EINEM echten Foto die alte Textgrafik als
          // statisches Vorschaubild landen statt des echten Fotos.
          // Textgrafik steht jetzt am ENDE von items (siehe media-Objekt
          // oben) - items[0] ist dadurch immer schon ein echtes Foto,
          // kein Offset mehr nötig wie zuvor.
          frame.style.backgroundImage = `url('${entry.items[0]}')`;
        }
      }
      let info = infoOverrides[name] || entry.info || "";
      // Für die Gastgeber-Galerie soll der Info-Text IMMER als aller-
      // erste Folie im Karussell stehen (Reihenfolge beim Durchklicken:
      // Info -> alle echten Fotos -> Textgrafik ganz zuletzt). Die
      // "position" aus de.json/en.json/nl.json wird hier deshalb bewusst
      // überschrieben, statt sich auf den in der JSON hinterlegten Wert
      // zu verlassen - so bleibt die Reihenfolge korrekt, ganz gleich
      // was dort für "position" eingetragen ist.
      if (isPlainGrid && info) {
        info = typeof info === "object" ? { ...info, position: 0 } : { text: info, position: 0 };
      }
      frame.addEventListener("click", () => {
        // Bei Dia-Show-Kacheln: das GERADE sichtbare Bild merken (siehe
        // frame.dataset.currentFullIndex, gesetzt in startTileSlideshow)
        // und die Lightbox genau dort öffnen, statt immer beim ersten
        // Bild zu starten. Bei normalen Kacheln (kein data-Attribut
        // vorhanden) bleibt es beim gewohnten Start bei Bild 1.
        const startIndex = frame.dataset.currentFullIndex
          ? parseInt(frame.dataset.currentFullIndex, 10)
          : 0;
        openGallery(name, info, startIndex);
      });
    });
  });
}

// ---------- Dia-Show direkt in der Kachel (z.B. "we love Rosa/Bjørn/Romina") ----------
// Läuft unabhängig von der Lightbox, direkt in der kleinen, nicht
// angeklickten Kachel. Bewusst SEHR langsam und mit sanfter Überblendung
// (siehe transition in .tile-slideshow-img, styles.css) - soll im
// Augenwinkel als ruhiges Atmen wirken, nicht als aktives "Slideshow"-
// Gefühl.
//
// Jede Kachel bekommt über den Parameter "index" eine eigene Zykluszeit
// UND einen eigenen Start-Versatz (siehe durations/startDelay unten) -
// beides zusammen sorgt dafür, dass benachbarte Kacheln nicht synchron
// wechseln, selbst direkt nach dem Laden der Seite.
//
// Respektiert prefers-reduced-motion: Nutzer:innen mit reduzierter
// Bewegung sehen dauerhaft nur das erste Bild, kein automatischer Wechsel.
function startTileSlideshow(frame, index) {
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const images = frame.querySelectorAll(".tile-slideshow-img");
  if (images.length < 2) return;

  // Unterschiedliche Zykluszeiten (in ms) - wiederholt sich zyklisch,
  // falls es mal mehr als drei Dia-Show-Kacheln geben sollte. Bewusst
  // ungerade Abstände, damit sich die Wechsel auch über längere Zeit
  // hinweg nicht "einpendeln". (Halbiert gegenüber der ersten Fassung -
  // Bilder wechseln doppelt so schnell, die Fade-Dauer selbst bleibt in
  // styles.css unverändert bei 3,5s, damit der Übergang weiterhin sanft
  // wirkt statt hektisch.)
  const durations = [8500, 10500, 12500];
  const cycleDuration = durations[index % durations.length];
  const startDelay = (index % durations.length) * 1500;

  let current = 0;
  frame.dataset.currentFullIndex = images[0].dataset.fullIndex || "0";
  const advance = () => {
    images[current].classList.remove("active");
    current = (current + 1) % images.length;
    images[current].classList.add("active");
    frame.dataset.currentFullIndex = images[current].dataset.fullIndex || "0";
  };

  setTimeout(() => {
    advance();
    setInterval(advance, cycleDuration);
  }, startDelay);
}

// ---------- Lightbox: Öffnen, Schließen, Vor/Zurück ----------
// startIndex bezieht sich auf die Position im VOLLSTÄNDIGEN entry.items-
// Array (nicht auf die evtl. gekürzte Dia-Show-Liste) - kommt von den
// Dia-Show-Kacheln (siehe frame.dataset.currentFullIndex weiter oben),
// bei allen anderen Aufrufen einfach 0 (erstes Bild, wie bisher).
function openGallery(name, infoText, startIndex = 0) {
  const entry = media[name];
  if (!entry) return;

  if (entry.type === "video") {
    openVideo(entry);
  } else {
    openImages(entry, infoText, startIndex);
  }
}

// Baut die Folien-Liste: erst alle Fotos, dann - falls vorhanden - die
// Info-Seite ganz am Ende. So sieht man erst alle Fotos, bevor man (per
// "weiter") auf die Info-Seite stößt, statt umgekehrt.
// infoValue kann sein:
//   - ein einfacher String  -> Info-Seite landet wie bisher ganz am Ende
//   - ein Objekt {text, position} -> Info-Seite wird an "position" eingefügt
//     (0-basierter Index wie bei Array.splice: 0 = ganz vorne, 1 = zwischen
//     Bild 1 und Bild 2, items.length = ganz hinten/Standard-Verhalten).
function buildSlides(entry, infoValue) {
  const slides = entry.items.map((src) => ({ type: "image", src }));
  if (!infoValue) return slides;

  const isObject = typeof infoValue === "object";
  const text = isObject ? infoValue.text : infoValue;
  if (!text) return slides;

  const requestedPosition = isObject && typeof infoValue.position === "number"
    ? infoValue.position
    : slides.length; // kein "position" angegeben -> Standard: ganz hinten

  // Absichern gegen ungültige Werte (z.B. negativ oder größer als die
  // Anzahl Bilder) - fällt dann einfach auf den nächstgültigen Rand zurück.
  const position = Math.max(0, Math.min(requestedPosition, slides.length));

  slides.splice(position, 0, { type: "info", text });
  return slides;
}

function openImages(entry, infoText, startIndex = 0) {
  currentSlides = buildSlides(entry, infoText);

  if (infoText) {
    // Gibt es einen Info-Text zu dieser Kachel, soll er beim Öffnen
    // IMMER zuerst gezeigt werden - Nutzer:innen lesen so direkt, worum
    // es hier geht (z.B. Rosas Künstlerinnen-Porträt), bevor sie sich
    // über die Pfeile durch die Fotos klicken. Der zuletzt in der
    // Dia-Show gezeigte Index (startIndex) wird in diesem Fall bewusst
    // ignoriert.
    const infoIndex = currentSlides.findIndex((slide) => slide.type === "info");
    currentIndex = infoIndex >= 0 ? infoIndex : 0;
  } else {
    // Kein Info-Text vorhanden: wie gehabt beim gerade in der Dia-Show
    // sichtbaren Foto einsteigen (Suche über die Bild-URL, siehe
    // Kommentar oben bei buildSlides).
    const targetSrc = entry.items[startIndex];
    const matchedIndex = currentSlides.findIndex(
      (slide) => slide.type === "image" && slide.src === targetSrc
    );
    currentIndex = matchedIndex >= 0 ? matchedIndex : 0;
  }

  if (currentSlides.length === 0) return;

  showGalleryChrome();
  renderCurrentSlide();
  lightboxEl.classList.add("active");
}

function openVideo(entry) {
  showVideoMode();
  lightboxVideo.src = entry.src;
  lightboxEl.classList.add("active");
  lightboxVideo.play().catch(() => {
    // Autoplay ggf. vom Browser blockiert - kein Absturz, Nutzer startet manuell.
  });
}

// Zeigt genau die Folie an, auf die currentIndex aktuell zeigt - blendet
// Bild bzw. Info-Panel je nach Folientyp ein/aus.
function renderCurrentSlide() {
  const slide = currentSlides[currentIndex];
  if (!slide) return;

  if (slide.type === "info") {
    lightboxImg.style.display = "none";
    // Text kommt in einen INNEREN Wrapper (.lightbox-info-slide-content),
    // nicht direkt auf den äußeren, fotogroßen Container - sonst würde
    // der Text über die volle Breite/Höhe gestreckt statt mittig als
    // eigener Block zu sitzen (siehe display:flex + justify/align-center
    // am äußeren Container in styles.css).
    lightboxInfoSlide.innerHTML = "";
    const content = document.createElement("div");
    content.className = "lightbox-info-slide-content";
    content.textContent = slide.text; // textContent, nicht innerHTML - kein HTML-Escaping nötig, kein Injection-Risiko
    lightboxInfoSlide.appendChild(content);
    lightboxInfoSlide.classList.add("active");
    fitInfoSlideText(content);
  } else {
    lightboxInfoSlide.classList.remove("active");
    lightboxImg.style.display = "block";
    lightboxImg.src = slide.src;
  }
}

// ---------- Info-Text automatisch verkleinern, bis er ohne Scrollen passt ----------
// Läuft auf ALLEN Bildschirmgrößen (nicht nur Desktop) - die Box hat
// überall eine max-height (siehe .lightbox-info-slide in styles.css:
// 85vh, auf schmalen Screens jetzt zusätzlich ohne erzwungenes
// quadratisches Format, siehe dortige @media-Regel), und übergelaufener
// Text in einer zentrierten Flexbox mit overflow-y:auto lässt sich in
// einigen Browsern nicht zuverlässig zum oberen Rand hin scrollen
// (bekannter Flexbox-Stolperstein bei align-items:center + overflow).
// Statt uns auf das Scrollen zu verlassen, schrumpfen wir die Schrift
// schrittweise, bis der komplette Text ohne Überlauf hineinpasst - dann
// tritt das Problem gar nicht erst auf.
// Auf schmalen Screens ist die Untergrenze etwas niedriger (9px statt
// 11px), weil dort insgesamt weniger Höhe zur Verfügung steht.
function fitInfoSlideText(content) {
  const isNarrow = window.innerWidth <= 640;
  const container = lightboxInfoSlide;
  const baseFontSize = 16;
  const minFontSize = isNarrow ? 9 : 11;
  let fontSize = baseFontSize;
  content.style.fontSize = `${fontSize}px`;

  // requestAnimationFrame, damit der Browser erst layoutet (scrollHeight
  // korrekt berechnet), bevor gemessen wird - direkt nach dem Einfügen
  // ins DOM wäre scrollHeight u.U. noch nicht aktuell.
  requestAnimationFrame(() => {
    const style = window.getComputedStyle(container);
    const verticalPadding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const availableHeight = container.clientHeight - verticalPadding;

    while (content.scrollHeight > availableHeight && fontSize > minFontSize) {
      fontSize -= 0.5;
      content.style.fontSize = `${fontSize}px`;
    }
  });
}

function closeGallery() {
  lightboxEl.classList.remove("active");
  lightboxVideo.pause();
  lightboxVideo.src = "";
  lightboxInfoSlide.classList.remove("active");
}

function showGalleryChrome() {
  lightboxVideo.style.display = "none";
  lightboxVideo.pause();

  // Pfeile zeigen, sobald es mehr als eine Folie gibt - das gilt jetzt
  // auch für ein einzelnes Foto MIT Info-Seite (dann 2 Folien), nicht
  // mehr nur bei mehreren Fotos.
  const hasMultiple = currentSlides.length > 1;
  lightboxPrevBtn.style.display = hasMultiple ? "flex" : "none";
  lightboxNextBtn.style.display = hasMultiple ? "flex" : "none";
}

function showVideoMode() {
  lightboxImg.style.display = "none";
  lightboxInfoSlide.classList.remove("active");
  lightboxVideo.style.display = "block";
  lightboxPrevBtn.style.display = "none";
  lightboxNextBtn.style.display = "none";
}

function showNext() {
  currentIndex = (currentIndex + 1) % currentSlides.length;
  renderCurrentSlide();
}

function showPrev() {
  currentIndex = (currentIndex - 1 + currentSlides.length) % currentSlides.length;
  renderCurrentSlide();
}

// Alle Klick-/Tasten-Handler der Lightbox an einer Stelle verdrahten - vorher
// standen closeGallery()/showPrev()/showNext() als onclick="..." direkt im
// HTML, was bei ES-Modulen nicht mehr funktioniert (Modul-Funktionen sind
// nicht automatisch global). Sauberer ist es ohnehin, Verhalten im JS statt
// im Markup zu definieren.
function wireLightboxControls() {
  document.querySelector(".lightbox-close").addEventListener("click", closeGallery);
  lightboxPrevBtn.addEventListener("click", showPrev);
  lightboxNextBtn.addEventListener("click", showNext);

  // Klick auf den dunklen Hintergrund (nicht auf das Bild selbst) schließt die Lightbox
  lightboxEl.addEventListener("click", (e) => {
    if (e.target.id === "lightbox") {
      closeGallery();
    }
  });

  // Escape-Taste schließt die Lightbox
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeGallery();
    }
  });
}