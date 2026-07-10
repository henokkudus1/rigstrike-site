/* RigStrike free IFTA calculator — all math runs in the browser, nothing is sent anywhere. */
(function () {
  "use strict";

  var RATES = null;
  var rowsEl, resultsEl, addBtn, form;

  function money(n) {
    var neg = n < 0;
    var s = "$" + Math.abs(n).toFixed(2);
    return neg ? "-" + s : s;
  }
  function num(v) {
    var n = parseFloat(v);
    return isFinite(n) && n >= 0 ? n : 0;
  }

  function jurisdictionOptions(selected) {
    var codes = Object.keys(RATES.jurisdictions).sort(function (a, b) {
      return RATES.jurisdictions[a].name.localeCompare(RATES.jurisdictions[b].name);
    });
    var out = '<option value="">Select state…</option>';
    codes.forEach(function (c) {
      var j = RATES.jurisdictions[c];
      var sel = c === selected ? " selected" : "";
      out += '<option value="' + c + '"' + sel + ">" + j.name + " (" + c + ")</option>";
    });
    return out;
  }

  function addRow(sel) {
    var row = document.createElement("div");
    row.className = "calc-row";
    row.innerHTML =
      '<div class="cols">' +
      '<div><label>Jurisdiction</label><select class="j-state">' + jurisdictionOptions(sel) + "</select></div>" +
      '<div><label>Miles driven</label><input class="j-miles" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></div>' +
      '<div><label>Gallons purchased</label><input class="j-gal" type="number" inputmode="decimal" min="0" step="any" placeholder="0"></div>' +
      '<div><button type="button" class="row-del" aria-label="Remove state">✕</button></div>' +
      "</div>";
    row.querySelector(".row-del").addEventListener("click", function () {
      row.remove();
      calculate();
    });
    row.addEventListener("input", calculate);
    row.addEventListener("change", calculate);
    rowsEl.appendChild(row);
  }

  function readRows() {
    var data = [];
    rowsEl.querySelectorAll(".calc-row").forEach(function (r) {
      data.push({
        code: r.querySelector(".j-state").value,
        miles: num(r.querySelector(".j-miles").value),
        gallons: num(r.querySelector(".j-gal").value),
      });
    });
    return data;
  }

  /* Core IFTA math — pure function, also exercised by test/math.test.js */
  function computeIFTA(rows, rates) {
    var totalMiles = 0, totalGallons = 0;
    rows.forEach(function (r) {
      if (!r.code) return;
      totalMiles += r.miles;
      totalGallons += r.gallons;
    });

    var mpg = totalGallons > 0 ? totalMiles / totalGallons : 0; // guard divide-by-zero

    var lines = [];
    var netTotal = 0;

    rows.forEach(function (r) {
      if (!r.code) return;
      var j = rates.jurisdictions[r.code];
      if (!j) return;
      var taxableGal = mpg > 0 ? r.miles / mpg : 0;
      var netGal = taxableGal - r.gallons;
      var tax = netGal * j.rate;
      // Surcharge (KY/VA): applied to ALL taxable gallons, no credit for purchases.
      var surcharge = taxableGal * (j.surcharge || 0);
      var lineTotal = tax + surcharge;
      netTotal += lineTotal;
      lines.push({
        code: r.code,
        name: j.name,
        miles: r.miles,
        taxableGal: taxableGal,
        purchasedGal: r.gallons,
        rate: j.rate,
        surchargeRate: j.surcharge || 0,
        tax: tax,
        surcharge: surcharge,
        lineTotal: lineTotal,
      });
    });

    return { mpg: mpg, totalMiles: totalMiles, totalGallons: totalGallons, lines: lines, netTotal: netTotal };
  }

  function render(res) {
    if (!res.lines.length) {
      resultsEl.innerHTML = '<p class="muted">Add at least one state with miles and gallons to see your estimate.</p>';
      return;
    }
    var hasSur = res.lines.some(function (l) { return l.surchargeRate > 0; });
    var html = "";
    html += '<div style="margin:10px 0 14px">';
    html += '<span class="mpg-badge">Fleet MPG: <strong>' + (res.mpg ? res.mpg.toFixed(3) : "—") + "</strong></span>";
    html += '<span class="mpg-badge">Total miles: <strong>' + res.totalMiles.toLocaleString() + "</strong></span>";
    html += '<span class="mpg-badge">Total gallons: <strong>' + res.totalGallons.toLocaleString() + "</strong></span>";
    html += "</div>";

    html += '<div class="results-wrap"><table class="results-table"><thead><tr>' +
      "<th>State</th><th>Miles</th><th>Taxable gal</th><th>Purchased gal</th><th>Rate</th>" +
      (hasSur ? "<th>Surcharge</th>" : "") +
      "<th>Tax due / (credit)</th></tr></thead><tbody>";

    res.lines.forEach(function (l) {
      var cls = l.lineTotal >= 0 ? "tax-due" : "tax-credit";
      html += "<tr>" +
        "<td>" + l.name + " (" + l.code + ")</td>" +
        "<td>" + l.miles.toLocaleString() + "</td>" +
        "<td>" + l.taxableGal.toFixed(2) + "</td>" +
        "<td>" + l.purchasedGal.toFixed(2) + "</td>" +
        "<td>$" + l.rate.toFixed(4) + "</td>" +
        (hasSur ? "<td>" + (l.surchargeRate > 0 ? money(l.surcharge) + ' <span class="small muted">@$' + l.surchargeRate.toFixed(4) + "</span>" : "—") + "</td>" : "") +
        '<td class="' + cls + '">' + money(l.lineTotal) + "</td>" +
        "</tr>";
    });
    html += "</tbody></table></div>";

    var netCls = res.netTotal >= 0 ? "tax-due" : "tax-credit";
    var netLabel = res.netTotal >= 0 ? "Net tax due" : "Net credit";
    html += '<p class="stamp">Rates: ' + RATES.quarter + " — for the return due July 31, 2026. Source: official IFTA, Inc. matrix.</p>";
    html += '<div class="net-total ' + netCls + '">' + netLabel + ": " + money(res.netTotal) + "</div>";
    resultsEl.innerHTML = html;
  }

  function calculate() {
    if (!RATES) return;
    render(computeIFTA(readRows(), RATES));
  }

  function init() {
    rowsEl = document.getElementById("calc-rows");
    resultsEl = document.getElementById("results");
    addBtn = document.getElementById("add-state");
    form = document.getElementById("calc-form");
    if (!rowsEl) return;

    fetch("../rates.json")
      .then(function (r) {
        if (!r.ok) throw new Error("rates fetch failed");
        return r.json();
      })
      .then(function (data) {
        RATES = data;
        var stamp = document.getElementById("rates-stamp");
        if (stamp) stamp.textContent = RATES.quarter + " diesel rates — official IFTA, Inc. matrix (" + RATES.period + ").";
        addRow("MI");
        addRow("OH");
        calculate();
      })
      .catch(function () {
        resultsEl.innerHTML = '<p class="tax-credit" style="color:var(--red)">Could not load the tax-rate data. Please refresh. Do not file from this page until rates load.</p>';
      });

    addBtn.addEventListener("click", function () { addRow(""); });
    if (form) form.addEventListener("submit", function (e) { e.preventDefault(); calculate(); });
  }

  // Export for Node test harness; no-op in the browser.
  if (typeof module !== "undefined" && module.exports) {
    module.exports = { computeIFTA: computeIFTA };
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
