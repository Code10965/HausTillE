module.exports = function (eleventyConfig) {
  // "Passthrough Copy": Dateien, die NICHT von Eleventy verarbeitet werden
  // sollen (CSS, JS, Bilder, Fonts), werden 1:1 in den Ausgabeordner (_site)
  // kopiert. Ohne das würde Eleventy nur .njk/.md/... Dateien bauen und
  // styles.css & Co. würden im fertigen Build einfach fehlen.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data"
    },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",

    // ---------- pathPrefix: macht die Seite unterordner-fest ----------
    // Alle Templates, die den eingebauten "url"-Filter benutzen
    // (z.B. {{ '/assets/styles.css' | url }}), bekommen diesen Wert
    // automatisch vorangestellt. Damit funktioniert dieselbe Seite
    // unverändert:
    //   - lokal (npm start)                    -> pathPrefix "/"
    //   - auf GitHub Pages im Unterordner       -> pathPrefix "/HausTillE/"
    //   - später auf der eigenen Domain         -> pathPrefix "/"
    //
    // Gesteuert über eine Umgebungsvariable, damit NICHTS am Code
    // geändert werden muss, wenn sich der Hosting-Ort ändert - genau wie
    // beim BASE_URL-Secret der Tests. Beispiel für den Build-Befehl:
    //   ELEVENTY_PATH_PREFIX=/HausTillE/ npm run build
    // Ohne gesetzte Variable (z.B. beim lokalen "npm start") gilt "/".
    pathPrefix: process.env.ELEVENTY_PATH_PREFIX || "/"
  };
};