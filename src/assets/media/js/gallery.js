// ---------- Foto-/Video-Galerie inklusive Lightbox ----------
// Aktiv nur auf Seiten, die tatsächlich [data-photo-grid]-Container und die
// Lightbox-Elemente enthalten (aktuell nur die Startseite) - setupGallery()
// bricht sonst früh ab, kein Fehler auf Impressum/Datenschutz.

// ---------- Medien (Name -> Bilder-Galerie ODER einzelnes Video) ----------
// Jeder Eintrag trägt seinen Typ selbst - eine einzige "Source of Truth"
// pro Name, statt getrennter Objekte für Bilder und Videos.
const media = {
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
  Vorne: {
    type: "images",
    label: "Foto — Vorne",
    items: [
      "/assets/media/Vorne/Living_front_1.jpg",
      "/assets/media/Vorne/Living_front_2.jpg",
      "/assets/media/Vorne/Living_front_3.jpg",
      "/assets/media/Vorne/Living_front_4.jpg",
      "/assets/media/Vorne/Living_front_5.jpg"
    ]
  },
  Hinten: {
    type: "images",
    label: "Foto — Hinten",
    items: [
      "/assets/media/Hinten/Living_back_1.jpg",
      "/assets/media/Hinten/Living_back_2.jpg",
      "/assets/media/Hinten/Living_back_3.jpg",
      "/assets/media/Hinten/Living_back_4.jpg",
      "/assets/media/Hinten/Living_back_5.jpg"
    ]
  },
  Bad: {
    type: "images",
    label: "Foto — Bad",
    items: ["/assets/media/Bad/Bath_1.jpg", "/assets/media/Bad/Bath_2.jpg"]
  },
  "Grundriss Vorne": {
    type: "images",
    label: "Grundriss — Vorne",
    items: ["/assets/media/Grundriss/Grundriss_vorne.jpg"]
  },
  "Grundriss Hinten": {
    type: "images",
    label: "Grundriss — Hinten",
    items: ["/assets/media/Grundriss/Grundriss_hinten.jpg"]
  },
  "Grundriss Gesamt": {
    type: "images",
    label: "Grundriss — Gesamt",
    items: ["/assets/media/Grundriss/Grundriss_gesamt.jpg"]
  },
  "Video vorne": {
    type: "video",
    label: "Video — Vorne",
    src: "/assets/media/Video vorne/Video_vorne.mp4"
  },
  "Video hinten": {
    type: "video",
    label: "Video — Hinten",
    src: "/assets/media/Video hinten/Video_hinten.mp4"
  }
};

// Lightbox-Elemente werden erst beim Start gesetzt (nicht auf Modul-Ebene),
// damit dieses Modul auch dann sicher geladen werden kann, wenn es die
// Lightbox auf der jeweiligen Seite gar nicht gibt.
let lightboxEl, lightboxImg, lightboxVideo, lightboxPrevBtn, lightboxNextBtn;
let currentGallery = [];
let currentIndex = 0;

export function setupGallery() {
  lightboxEl = document.getElementById("lightbox");
  if (!lightboxEl) return; // Seite ohne Galerie (Impressum/Datenschutz)

  lightboxImg = document.getElementById("lightbox-img");
  lightboxVideo = document.getElementById("lightbox-video");
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
// Mehrsprachigkeit: media[name].label ist IMMER Deutsch (dient nur als
// Fallback, z.B. falls eine Seite das data-photo-labels-Attribut mal nicht
// mitgibt). Die tatsächlich angezeigte, übersetzte Beschriftung kommt aus
// data-photo-labels - einem JSON-Objekt {name: übersetztes Label}, das
// home.njk aus der jeweiligen Sprachdatei (de.json/en.json/nl.json) erzeugt.
// Die "name"-Werte selbst (z.B. "Garten") bleiben unübersetzt - sie sind
// nur interne IDs, um Bilder/Videos im media-Objekt wiederzufinden, und
// werden nirgends direkt angezeigt.
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

    container.innerHTML = names
      .map((name) => {
        const entry = media[name];
        if (!entry) return "";
        const label = labelOverrides[name] || entry.label;
        const videoClass = entry.type === "video" ? " video-frame" : "";
        return `<div class="photo-frame${videoClass}" data-gallery="${name}">
          <span class="mono-label fog-label">${label}</span>
        </div>`;
      })
      .join("");

    container.querySelectorAll(".photo-frame[data-gallery]").forEach((frame) => {
      const entry = media[frame.dataset.gallery];
      if (entry.type === "images" && entry.items.length > 0) {
        frame.style.backgroundImage = `url('${entry.items[0]}')`;
      }
      frame.addEventListener("click", () => openGallery(frame.dataset.gallery));
    });
  });
}

// ---------- Lightbox: Öffnen, Schließen, Vor/Zurück ----------
function openGallery(name) {
  const entry = media[name];
  if (!entry) return;

  if (entry.type === "video") {
    openVideo(entry);
  } else {
    openImages(entry);
  }
}

function openImages(entry) {
  currentGallery = entry.items;
  currentIndex = 0;
  if (currentGallery.length === 0) return;

  showImageMode();
  lightboxImg.src = currentGallery[currentIndex];
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

function closeGallery() {
  lightboxEl.classList.remove("active");
  lightboxVideo.pause();
  lightboxVideo.src = "";
}

function showImageMode() {
  lightboxImg.style.display = "block";
  lightboxVideo.style.display = "none";
  lightboxVideo.pause();

  // Bei nur einem Bild (z.B. Grundriss) machen Vor/Zurück-Pfeile keinen Sinn
  const hasMultiple = currentGallery.length > 1;
  lightboxPrevBtn.style.display = hasMultiple ? "flex" : "none";
  lightboxNextBtn.style.display = hasMultiple ? "flex" : "none";
}

function showVideoMode() {
  lightboxImg.style.display = "none";
  lightboxVideo.style.display = "block";
  lightboxPrevBtn.style.display = "none";
  lightboxNextBtn.style.display = "none";
}

function showNext() {
  currentIndex = (currentIndex + 1) % currentGallery.length;
  lightboxImg.src = currentGallery[currentIndex];
}

function showPrev() {
  currentIndex = (currentIndex - 1 + currentGallery.length) % currentGallery.length;
  lightboxImg.src = currentGallery[currentIndex];
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