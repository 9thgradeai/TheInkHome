/* Applies the stored theme before first paint to avoid a flash.
   Kept as a separate file so the strict CSP can allow it. */
(function () {
  var THEME_KEY = "the-ink-home:theme";
  var theme = null;
  try {
    theme = window.localStorage.getItem(THEME_KEY);
  } catch (error) {
    theme = null;
  }
  if (theme !== "paper" && theme !== "night") {
    theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "night" : "paper";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
