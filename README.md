# RigStrike — site (Phase 0)

Fast, mobile-first static site: **free IFTA calculator** (acquisition front door for the RigStrike app),
landing page with **email waitlist**, **IFTA due-dates** reference, and **privacy** page. Plain HTML/CSS/JS,
no framework. Deployable on Vercel.

## Structure
```
index.html                 Landing (hero + waitlist form)
calculator/index.html      The IFTA calculator UI
app.js                     Calculator math (client-side; also unit-tested in Node)
rates.json                 Official IFTA Q2 2026 US diesel rates
ifta-due-dates/index.html  2026 quarterly deadlines + FAQ (JSON-LD)
privacy/index.html         Plain-language privacy page
api/subscribe.js           Vercel serverless waitlist -> MailerLite
sitemap.xml, robots.txt    SEO
data/                      Provenance: raw official CSV + the parser that built rates.json
test/                      Node verification (math + subscribe)
```

## Rates (accuracy-critical)
`rates.json` is built from the **official IFTA, Inc.** Q2 2026 "Special Diesel" matrix:
- Source file: https://www.iftach.org/taxmatrix/charts/2Q2026.csv
- Downloads page: https://www.iftach.org/taxmatrix4/TaxDownload.php
- Fetched: 2026-07-10 — for the return due **July 31, 2026**.
- Raw source CSV kept at `data/ifta-q2-2026-source.csv`; regenerate with `python3 data/build_rates.py data/ifta-q2-2026-source.csv rates.json`.

To roll to a new quarter: download that quarter's CSV from the downloads page, rerun the parser, and update
the `quarter` / `period` / `return_due` fields.

## Environment variables (set in Vercel — do NOT commit keys)
- `MAILERLITE_API_KEY` (required for the waitlist) — Vercel → Project → Settings → Environment Variables.
- `MAILERLITE_GROUP_ID` (optional) — adds subscribers to a specific MailerLite group.

If `MAILERLITE_API_KEY` is missing, `/api/subscribe` returns a clean 503 and never exposes a key.

## Verify
```
npm test          # math + subscribe missing-key path
```

## Deploy
Static site + `/api` serverless functions deploy directly on Vercel. Set the env vars above first.

> **Note:** `https://rigstrike-site.vercel.app` is used as the canonical/sitemap domain placeholder. Update it across the
> HTML `<link rel="canonical">`, JSON-LD `url`s, `sitemap.xml`, and `robots.txt` once the real domain is set.
