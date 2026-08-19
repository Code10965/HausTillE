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
      markdownTemplateEngine: "njk"
    };
  };