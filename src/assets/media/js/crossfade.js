// ---------- Crossfade für Hero-Hintergrund ----------
// Jede Gruppe von Bildern (data-interval = Wartezeit in ms) rotiert
// selbstständig durch, indem abwechselnd die Klasse "active" gesetzt wird.
export function setupCrossfadeGroups() {
  document.querySelectorAll(".crossfade-group").forEach((group) => {
    const images = Array.from(group.querySelectorAll(".crossfade-img"));
    if (images.length < 2) return;

    const intervalMs = parseInt(group.dataset.interval, 10) || 6000;
    let index = 0;

    setInterval(() => {
      images[index].classList.remove("active");
      index = (index + 1) % images.length;
      images[index].classList.add("active");
    }, intervalMs);
  });
}