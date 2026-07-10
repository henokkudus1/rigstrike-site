// Vercel serverless function — adds a waitlist email to MailerLite.
// SECURITY: the API key is read ONLY from process.env.MAILERLITE_API_KEY.
// Never hardcode a key here. Set it in the Vercel project:
//   Vercel Dashboard → Project → Settings → Environment Variables → MAILERLITE_API_KEY
// Optionally set MAILERLITE_GROUP_ID to add subscribers to a specific group.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Body may arrive parsed (Vercel) or as a raw string.
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const email = (body.email || "").trim();
  const honeypot = (body.company || "").trim();

  // Honeypot: bots fill hidden fields. Pretend success, do nothing.
  if (honeypot) {
    return res.status(200).json({ ok: true });
  }

  if (!EMAIL_RE.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address." });
  }

  const apiKey = process.env.MAILERLITE_API_KEY;
  if (!apiKey) {
    // Missing configuration — fail cleanly, do NOT leak details, do NOT hardcode a key.
    console.error("MAILERLITE_API_KEY is not set. Add it in Vercel project env vars.");
    return res.status(503).json({ error: "Waitlist is temporarily unavailable. Please try again later." });
  }

  const payload = { email: email };
  if (process.env.MAILERLITE_GROUP_ID) {
    payload.groups = [process.env.MAILERLITE_GROUP_ID];
  }

  try {
    const r = await fetch("https://connect.mailerlite.com/api/subscribers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer " + apiKey,
      },
      body: JSON.stringify(payload),
    });

    // MailerLite returns 200/201 for created/updated subscribers.
    if (r.ok) {
      return res.status(200).json({ ok: true });
    }

    let detail = "";
    try { detail = JSON.stringify(await r.json()); } catch (_) {}
    console.error("MailerLite error", r.status, detail);
    return res.status(502).json({ error: "Could not add you right now. Please try again in a moment." });
  } catch (err) {
    console.error("MailerLite request failed", err);
    return res.status(502).json({ error: "Could not add you right now. Please try again in a moment." });
  }
};
