// ---------- email-contact.js ----------
import { renderContacts } from "./contactUtils.js";

const CONTACT_EMAIL = ["office", "haus-till-e.com"].join("@");

export function renderEmailContacts() {
  renderContacts({
    selector: "[data-email-contact-theme]",
    themeDataKey: "emailContactTheme",
    value: CONTACT_EMAIL,
    canvasClass: "email-canvas",
    boxClassDark: "contact-email",
    boxClassLight: "email-box",
    ariaLabel: "E-Mail-Adresse als Bild, gegen automatisiertes Auslesen geschützt",
    defaultCopyLabel: "Adresse kopieren",
  });
}