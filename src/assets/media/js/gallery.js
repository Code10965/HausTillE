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
      "/assets/media/Haus/Haus_2.jpg"
    ]
  },
  Garten: {
    type: "images",
    label: "Foto — Garten",
    items: [
      "/assets/media/Garten/Garden_1.jpg",
      "/assets/media/Garten/Garden_2.jpg",
      "/assets/media/Garten/Garden_3.jpg",
      "/assets/media/Garten/Garden_4.jpg"
    ]
  },
  Eingangsbereich: {
    type: "images",
    label: "Foto — Eingangsbereich",
    items: [
      "/assets/media/Eingangsbereich/Eingangsbereich_1.jpg",
      "/assets/media/Eingangsbereich/Eingangsbereich_2.jpg"
    ]
  },
  Frühstücksraum: {
    type: "images",
    label: "Foto — Frühstücksraum",
    items: [
      "/assets/media/Frühstücksraum/Frühstücksraum_1.jpg",
      "/assets/media/Frühstücksraum/Frühstücksraum_2.jpg"
    ]
  },
  Treppenhaus: {
    type: "images",
    label: "Foto — Treppenhaus",
    items: [
      "/assets/media/Treppenhaus/Treppenhaus_1.jpg",
      "/assets/media/Treppenhaus/Treppenhaus_2.jpg"
    ]
  },
  "Zimmer_1": {
    type: "images",
    label: "Foto — Zimmer 1",
    items: [
      "/assets/media/Zimmer_1/Zimmer_1_1.jpg",
      "/assets/media/Zimmer_1/Zimmer_1_2.jpg"
    ]
  },
  "Zimmer_2": {
    type: "images",
    label: "Foto — Zimmer 2",
    items: [
      "/assets/media/Zimmer_2/Zimmer_2_1.jpg",
      "/assets/media/Zimmer_2/Zimmer_2_2.jpg"
    ]
  },
  "Zimmer_3": {
    type: "images",
    label: "Foto — Zimmer 3",
    items: [
      "/assets/media/Zimmer_3/Zimmer_3_1.jpg",
      "/assets/media/Zimmer_3/Zimmer_3_2.jpg"
    ]
  },
  "Zimmer_4": {
    type: "images",
    label: "Foto — Zimmer 4",
    items: [
      "/assets/media/Zimmer_4/Zimmer_4_1.jpg",
      "/assets/media/Zimmer_4/Zimmer_4_2.jpg"
    ]
  },
  "Zimmer_5": {
    type: "images",
    label: "Foto — Zimmer 5",
    items: [
      "/assets/media/Zimmer_5/Zimmer_5_1.jpg",
      "/assets/media/Zimmer_5/Zimmer_5_2.jpg"
    ]
  },
  Rosa: {
    type: "images",
    label: "we love Rosa",
    items: [
      "/assets/media/Rosa/Rosa_1.jpg",
      "/assets/media/Rosa/Rosa_2.jpg"
    ]
  },
  Bjorn: {
    type: "images",
    label: "we love Bjørn",
    items: [
      "/assets/media/Bjorn/Bjorn_1.jpg",
      "/assets/media/Bjorn/Bjorn_2.jpg"
    ]
  },
  Romina: {
    type: "images",
    label: "we love Romina",
    items: [
      "/assets/media/Romina/Romina_1.jpg",
      "/assets/media/Romina/Romina_2.jpg"
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
          return `<div class="photo-frame${videoClass}" data-gallery="${name}">
            <span class="mono-label fog-label">${label}</span>
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

    container.querySelectorAll(".photo-frame[data-gallery]").forEach((frame) => {
      const name = frame.dataset.gallery;
      const entry = media[name];
      if (entry.type === "images" && entry.items.length > 0) {
        frame.style.backgroundImage = `url('${entry.items[0]}')`;
      }
      const info = infoOverrides[name] || entry.info || "";
      frame.addEventListener("click", () => openGallery(name, info));
    });
  });
}

// ---------- Lightbox: Öffnen, Schließen, Vor/Zurück ----------
function openGallery(name, infoText) {
  const entry = media[name];
  if (!entry) return;

  if (entry.type === "video") {
    openVideo(entry);
  } else {
    openImages(entry, infoText);
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

function openImages(entry, infoText) {
  currentSlides = buildSlides(entry, infoText);
  currentIndex = 0;
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
  } else {
    lightboxInfoSlide.classList.remove("active");
    lightboxImg.style.display = "block";
    lightboxImg.src = slide.src;
  }
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