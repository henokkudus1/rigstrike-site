// Verification for the IFTA math. Run: node test/math.test.js
// Exercises computeIFTA() from ../app.js against the real ../rates.json.
const assert = require("assert");
const path = require("path");
const { computeIFTA } = require(path.join("..", "app.js"));
const rates = require(path.join("..", "rates.json"));

let failures = 0;
function near(actual, expected, label, tol = 1e-4) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(
    (ok ? "  PASS " : "  FAIL ") + label +
    "  expected=" + expected.toFixed(4) + "  got=" + Number(actual).toFixed(4)
  );
  if (!ok) failures++;
  return ok;
}
function line(res, code) { return res.lines.find((l) => l.code === code); }

console.log("Rates loaded:", rates.quarter, "| source:", rates.source);
console.log("MI=" + rates.jurisdictions.MI.rate, "OH=" + rates.jurisdictions.OH.rate,
  "KY=" + rates.jurisdictions.KY.rate + "/" + rates.jurisdictions.KY.surcharge,
  "IN=" + rates.jurisdictions.IN.rate + "/" + rates.jurisdictions.IN.surcharge);

// ---------------------------------------------------------------------------
console.log("\nSCENARIO 1 — MI + OH (task's known case)");
// 2,000 mi MI + 1,000 mi OH; 400 gal bought in MI, 100 in OH.
const s1 = computeIFTA(
  [
    { code: "MI", miles: 2000, gallons: 400 },
    { code: "OH", miles: 1000, gallons: 100 },
  ],
  rates
);
// Hand math: total miles 3000, total gal 500 -> MPG = 6.0
near(s1.mpg, 6.0, "fleet MPG (3000/500)");
// MI: taxable = 2000/6 = 333.3333 ; net = -66.6667 ; tax = -66.6667*0.524 = -34.9333
near(line(s1, "MI").taxableGal, 333.3333, "MI taxable gallons");
near(line(s1, "MI").lineTotal, -34.9333, "MI tax (credit)");
// OH: taxable = 1000/6 = 166.6667 ; net = 66.6667 ; tax = 66.6667*0.47 = 31.3333
near(line(s1, "OH").taxableGal, 166.6667, "OH taxable gallons");
near(line(s1, "OH").lineTotal, 31.3333, "OH tax (due)");
// Net = -34.9333 + 31.3333 = -3.6000 (credit)
near(s1.netTotal, -3.6, "net total (credit $3.60)");

// ---------------------------------------------------------------------------
console.log("\nSCENARIO 2 — KY surcharge (taxable gallons, no purchase credit)");
// 1,200 mi KY (0 gal bought) + 1,800 mi MI (500 gal bought). MPG = 3000/500 = 6.0
const s2 = computeIFTA(
  [
    { code: "KY", miles: 1200, gallons: 0 },
    { code: "MI", miles: 1800, gallons: 500 },
  ],
  rates
);
near(s2.mpg, 6.0, "fleet MPG");
// KY taxable = 1200/6 = 200 ; tax = 200*0.22 = 44.00 ; surcharge = 200*0.105 = 21.00
near(line(s2, "KY").taxableGal, 200, "KY taxable gallons");
near(line(s2, "KY").tax, 44.0, "KY base tax");
near(line(s2, "KY").surcharge, 21.0, "KY surcharge (200 taxable * 0.105)");
near(line(s2, "KY").lineTotal, 65.0, "KY line total (tax + surcharge)");
// MI taxable = 1800/6 = 300 ; net = 300-500 = -200 ; tax = -200*0.524 = -104.80
near(line(s2, "MI").lineTotal, -104.8, "MI line (credit)");
// Net = 65.00 - 104.80 = -39.80
near(s2.netTotal, -39.8, "net total (credit $39.80)");

// ---------------------------------------------------------------------------
console.log("\nSCENARIO 3 — Indiana surcharge is $0 for Q2 2026 (folded into base rate)");
assert.strictEqual(rates.jurisdictions.IN.surcharge, 0,
  "IN surcharge must be 0 in Q2 2026 official matrix");
const s3 = computeIFTA([{ code: "IN", miles: 600, gallons: 0 },
                        { code: "MI", miles: 2400, gallons: 500 }], rates);
// MPG = 3000/500 = 6 ; IN taxable = 600/6 = 100 ; surcharge component must be 0
near(line(s3, "IN").surcharge, 0, "IN surcharge component is 0");
console.log("  PASS IN base rate $" + rates.jurisdictions.IN.rate.toFixed(4) + " applied, no surcharge");

// ---------------------------------------------------------------------------
console.log("\nSCENARIO 4 — divide-by-zero guard (0 gallons purchased anywhere)");
const s4 = computeIFTA([{ code: "MI", miles: 500, gallons: 0 }], rates);
near(s4.mpg, 0, "MPG guarded to 0 when total gallons = 0");
near(line(s4, "MI").lineTotal, 0, "no NaN / crash; tax = 0");
assert.ok(!Number.isNaN(s4.netTotal), "net total is a number");

// ---------------------------------------------------------------------------
console.log("\nSCENARIO 5 — rate-data sanity");
const codes = Object.keys(rates.jurisdictions);
assert.strictEqual(codes.length, 48, "expected 48 US IFTA jurisdictions, got " + codes.length);
assert.strictEqual(rates.jurisdictions.OR.rate, 0, "Oregon IFTA diesel rate must be 0");
assert.strictEqual(rates.jurisdictions.VA.surcharge, 0.143, "VA surcharge must be 0.143");
assert.ok(!("DC" in rates.jurisdictions), "DC is not an IFTA jurisdiction");
console.log("  PASS 48 jurisdictions, OR=0, VA surcharge=0.143, no DC");

// ---------------------------------------------------------------------------
console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED ✅" : failures + " CHECK(S) FAILED ❌"));
process.exit(failures === 0 ? 0 : 1);
