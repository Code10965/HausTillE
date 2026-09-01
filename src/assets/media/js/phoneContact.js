// ---------- phoneContact.js ----------
import { renderContacts } from "./contactUtils.js";

const CONTACT_PHONE = ["+49 177 ", "2345678"].join("1"); // 
const CONTACT_2_PHONE = ["+49 6542 ", "227"].join("5"); // 

export function renderPhoneContacts() {
  renderContacts({
    selector: "[data-phone-contact-theme]",
    themeDataKey: "phoneContactTheme",
    value: CONTACT_PHONE,
    canvasClass: "phone-canvas",
    boxClassDark: "contact-phone",
    boxClassLight: "phone-box",
    ariaLabel: "Telefonnummer als Bild, gegen automatisiertes Auslesen geschützt",
    defaultCopyLabel: "Nummer kopieren",
  });

  // Zweite Nummer: eigener themeDataKey - und zwar "phone-2ContactTheme"
  // MIT Bindestrich vor der "2"! Die dataset-Umwandlung des Browsers
  // entfernt einen Bindestrich nur, wenn danach ein Kleinbuchstabe folgt
  // (dann wird der Buchstabe großgeschrieben). Folgt eine Ziffer, bleibt
  // der Bindestrich stehen. "data-phone-2-contact-theme" wird deshalb zu
  // "phone-2ContactTheme", NICHT zu "phone2ContactTheme" (das war der
  // vorherige, falsche Versuch - deshalb blieb dataset[themeDataKey]
  // immer undefined, egal wie aktuell die Datei war).
  renderContacts({
    selector: "[data-phone-2-contact-theme]",
    themeDataKey: "phone-2ContactTheme",
    value: CONTACT_2_PHONE,
    canvasClass: "phone-2-canvas",
    boxClassDark: "contact-phone",
    boxClassLight: "phone-box",
    ariaLabel: "Telefonnummer als Bild, gegen automatisiertes Auslesen geschützt",
    defaultCopyLabel: "Nummer kopieren",
  });
}