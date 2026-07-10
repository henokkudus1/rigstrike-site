/* RigStrike theme control — light / dark / auto. Cycles on click, persists in localStorage.
   The no-flash inline <head> script already stamped data-theme before paint; this wires the toggle. */
(function () {
  "use strict";
  var KEY = "rs-theme";
  var ORDER = ["light", "dark", "auto"];
  var ICON = { light: "☀", dark: "☾", auto: "◑" };
  var mq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

  function getSetting() {
    try {
      var v = localStorage.getItem(KEY);
      return ORDER.indexOf(v) >= 0 ? v : "auto";
    } catch (e) { return "auto"; }
  }
  function resolve(setting) {
    if (setting === "auto") return mq && mq.matches ? "dark" : "light";
    return setting;
  }
  function apply(setting) {
    document.documentElement.setAttribute("data-theme", resolve(setting));
    paintButton(setting);
  }
  function paintButton(setting) {
    var btn = document.getElementById("theme-toggle");
    if (!btn) return;
    btn.innerHTML = '<span class="tt-icon" aria-hidden="true">' + ICON[setting] +
      '</span><span class="tt-label">' + setting + "</span>";
    btn.setAttribute("aria-label", "Theme: " + setting + " (click to change)");
    btn.setAttribute("title", "Theme: " + setting + " — click to change");
  }
  function setSetting(setting) {
    try { localStorage.setItem(KEY, setting); } catch (e) {}
    apply(setting);
  }

  function init() {
    var btn = document.getElementById("theme-toggle");
    if (btn) {
      btn.addEventListener("click", function () {
        var next = ORDER[(ORDER.indexOf(getSetting()) + 1) % ORDER.length];
        setSetting(next);
      });
    }
    // Re-resolve when the OS theme changes and we're in auto mode.
    if (mq) {
      var onChange = function () { if (getSetting() === "auto") apply("auto"); };
      if (mq.addEventListener) mq.addEventListener("change", onChange);
      else if (mq.addListener) mq.addListener(onChange);
    }
    apply(getSetting());
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
