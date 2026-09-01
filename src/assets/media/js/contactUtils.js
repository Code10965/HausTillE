// ---------- contact-utils.js ----------
// Gemeinsame, wiederverwendbare Logik für alle "verschleierten" Kontakt-Elemente
// (Bild-Canvas + Kopieren-Button). Kennt selbst weder E-Mail noch Telefon,
// sondern nur generische Kontakt-Werte.

export function renderContacts({ selector, value, canvasClass, boxClassDark, boxClassLight, ariaLabel, defaultCopyLabel, themeDataKey }) {
  const placeholders = document.querySelectorAll(selector);
  if (placeholders.length === 0) return;

  placeholders.forEach((placeholder) => {
    const isDarkBackground = placeholder.dataset[themeDataKey] === "dark";
    const boxClass = isDarkBackground ? boxClassDark : boxClassLight;
    // Dieselbe Grau-Nuance wie der umliegende Fliesstext, nicht reines
    // Weiß/Schwarz: #C7C6C1 = Farbe von .contact-text (Kontakt-Absatz auf
    // dunklem Grund), #5C5D58 = var(--slate) (Fliesstext auf hellem Grund,
    // z.B. .prose-paragraph im Impressum).
    const textColor = isDarkBackground ? "#C7C6C1" : "#5C5D58";
    const copyLabel = placeholder.dataset.copyLabel || defaultCopyLabel;

    placeholder.innerHTML = `
      <div class="contact-row">
        <div class="${boxClass} contact-value-box">
          <canvas class="${canvasClass}" data-value="${value}" data-color="${textColor}" aria-label="${ariaLabel}"></canvas>
        </div>
        <button class="copy-btn" type="button" data-value="${value}" data-copied-label="${placeholder.dataset.copiedLabel || "Kopiert ✓"}">${copyLabel}</button>
      </div>
    `;
  });

  drawCanvases(`.${canvasClass}`);
  setupCopyButtons();
}

// Zeichnet einen beliebigen Wert auf jedes passende Canvas - Text wird nie
// als HTML geschrieben, sondern erst hier im Browser zusammengesetzt und gerendert.
function drawCanvases(canvasSelector) {
  document.querySelectorAll(canvasSelector).forEach((canvas) => {
    const ctx = canvas.getContext("2d");
    // Dieselbe Schriftart/-größe wie der umliegende Fliesstext (body /
    // .prose-paragraph / .contact-text), nicht mehr JetBrains Mono - die
    // Nummer/E-Mail soll aussehen wie normaler Text, nicht wie ein
    // Code-/Mono-Schnipsel.
    const fontSize = 17;
    const font = `${fontSize}px 'Space Grotesk', sans-serif`;
    const text = canvas.dataset.value;

    const dpr = window.devicePixelRatio || 1;
    ctx.font = font;
    const textWidth = ctx.measureText(text).width;

    canvas.width = (textWidth + 4) * dpr;
    canvas.height = (fontSize + 8) * dpr;
    canvas.style.width = (textWidth + 4) + "px";
    canvas.style.height = (fontSize + 8) + "px";

    ctx.scale(dpr, dpr);
    ctx.font = font;
    ctx.fillStyle = canvas.dataset.color || "#5C5D58";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 2, (fontSize + 8) / 2);
  });
}

// Ein Handler für alle Kopieren-Buttons, egal welcher Kontakt-Typ.
function setupCopyButtons() {
  document.querySelectorAll(".copy-btn").forEach((button) => {
    if (button.dataset.bound) return; // verhindert Doppel-Bindung bei mehreren Aufrufen
    button.dataset.bound = "true";
    const originalLabel = button.textContent;

    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(button.dataset.value);
        button.textContent = button.dataset.copiedLabel || "Kopiert ✓";
        setTimeout(() => {
          button.textContent = originalLabel;
        }, 2000);
      } catch (err) {
        // Zwischenablage nicht verfügbar - kein Absturz, einfach nichts tun.
      }
    });
  });
}

// Gleicht die Breite mehrerer Kontakt-Boxen an, damit die danebenstehenden
// Buttons unabhängig von der Textlänge (E-Mail vs. Telefonnummer, oder je
// nach Sprache) auf derselben horizontalen Linie starten.
export function alignContactBoxWidths(selector = ".contact-value-box") {
  const boxes = document.querySelectorAll(selector);
  if (boxes.length === 0) return;

  const maxWidth = Math.max(...Array.from(boxes).map((box) => box.getBoundingClientRect().width));

  boxes.forEach((box) => {
    box.style.width = `${maxWidth}px`;
  });
}