// ---------- Nav-Item-Objekte bauen ----------
// Ein "Item" bündelt alle DOM-Elemente + berechneten Werte für eine der
// drei Kugeln (Menü/Sprache/Kontakt) an einem Ort, statt dass jede
// Funktion (Öffnen/Schließen, Scroll-Positionierung) die DOM-Struktur
// immer wieder selbst durchsuchen muss.
export function buildItem(wrapper) {
  const toggle = wrapper.querySelector(".nav-ball");
  const visual = wrapper.querySelector(".nav-ball-visual");
  const dropdown = wrapper.querySelector(".nav-dropdown");
  if (!toggle || !visual || !dropdown) return null;

  const slot = Number(wrapper.dataset.navSlot || 0);

  // Leichtes "Schweben" im Stapel-Zustand (nicht beim Menü, slot 0 - das
  // bleibt fest) - Amplitude/Geschwindigkeit/Phase zufällig pro Kugel,
  // damit sie nicht alle synchron schweben. Wird später in
  // navScrollTrack.js beim Stapel-Zustand verwendet.
  const hasDrift = slot > 0;
  const driftAmplitude = hasDrift ? 6 + Math.random() * 8 : 0;
  const driftSpeed = hasDrift ? 1.2 + Math.random() * 1.2 : 0;
  const driftPhase = hasDrift ? Math.random() * Math.PI * 2 : 0;

  return { wrapper, toggle, visual, dropdown, slot, driftAmplitude, driftSpeed, driftPhase };
}