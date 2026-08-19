// ---------- Sanftes Einblenden von Abschnitten beim Scrollen ----------
// Sobald ein Abschnitt (data-reveal) zu ~12% sichtbar ist, bekommt er
// die Klasse "visible" - der Rest (Verzögerung pro Kind-Element) steht in styles.css.
// Läuft ins Leere (kein Fehler), wenn eine Seite gar kein [data-reveal] hat.
export function setupScrollReveal() {
  const targets = document.querySelectorAll("[data-reveal]");
  if (targets.length === 0) return;

  if (!("IntersectionObserver" in window)) {
    targets.forEach((el) => el.classList.add("visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  targets.forEach((el) => observer.observe(el));
}