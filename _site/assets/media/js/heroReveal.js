// ---------- Hero-Inhalt kurz nach dem Laden einblenden ----------
export function setupHeroReveal() {
  const heroContent = document.getElementById("hero-content");
  if (!heroContent) return;
  setTimeout(() => heroContent.classList.add("loaded"), 100);
}