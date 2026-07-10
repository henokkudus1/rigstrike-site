// Verifies api/subscribe.js behavior without a live network / key.
// Run: node test/subscribe.test.js
const path = require("path");
const handler = require(path.join("..", "api", "subscribe.js"));

let failures = 0;
function check(cond, label) {
  console.log((cond ? "  PASS " : "  FAIL ") + label);
  if (!cond) failures++;
}

// Minimal Express-like res mock.
function mockRes() {
  return {
    statusCode: 0, body: null, headers: {},
    setHeader(k, v) { this.headers[k] = v; },
    status(c) { this.statusCode = c; return this; },
    json(o) { this.body = o; return this; },
  };
}

async function run() {
  // 1) Missing MAILERLITE_API_KEY -> clean 503, no crash, no key leaked.
  delete process.env.MAILERLITE_API_KEY;
  let res = mockRes();
  await handler({ method: "POST", body: { email: "driver@example.com" } }, res);
  console.log("\nMissing-key path:", res.statusCode, JSON.stringify(res.body));
  check(res.statusCode === 503, "returns 503 when MAILERLITE_API_KEY is unset");
  check(res.body && typeof res.body.error === "string", "returns a clean error message");

  // 2) Invalid email -> 400 (checked before any network call).
  res = mockRes();
  await handler({ method: "POST", body: { email: "not-an-email" } }, res);
  console.log("Invalid-email path:", res.statusCode, JSON.stringify(res.body));
  check(res.statusCode === 400, "rejects invalid email with 400");

  // 3) Honeypot filled -> 200 ok, silently ignored (no key needed).
  res = mockRes();
  await handler({ method: "POST", body: { email: "driver@example.com", company: "spammer" } }, res);
  console.log("Honeypot path:", res.statusCode, JSON.stringify(res.body));
  check(res.statusCode === 200 && res.body.ok === true, "honeypot submission is silently accepted");

  // 4) Wrong method -> 405.
  res = mockRes();
  await handler({ method: "GET" }, res);
  console.log("Wrong-method path:", res.statusCode, JSON.stringify(res.body));
  check(res.statusCode === 405, "non-POST returns 405");

  console.log("\n" + (failures === 0 ? "ALL CHECKS PASSED ✅" : failures + " CHECK(S) FAILED ❌"));
  process.exit(failures === 0 ? 0 : 1);
}
run();
