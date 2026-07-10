# RigStrike Design System — LOCKED (v1)

This is the design law for the RigStrike site. **Every future change must obey it.**
No hardcoded hex outside the token blocks in `styles.css`. The previous v0 accent orange is retired — the brand
orange is now `var(--orange)` only; never reintroduce a raw hex accent.

## Fonts (Google Fonts)
- **Barlow Semi Condensed**, weight **500** — all headings (`h1`/`h2`/`h3`), the wordmark, and all **big numbers**
  (e.g. the calculator net total).
- **Barlow**, weights **400 / 500** — body copy and buttons.

Load once per page:
```
https://fonts.googleapis.com/css2?family=Barlow:wght@400;500&family=Barlow+Semi+Condensed:wght@500&display=swap
```

## Theme tokens
Two themes. `data-theme` is set on `<html>` before first paint by an inline `<head>` script.
Dark is the default (`:root` and `[data-theme="dark"]`); `[data-theme="light"]` overrides.

### DARK (default)
```
--bg:#0B0D0F  --card:#15181B  --border:#23262A  --border-sub:#1C1F22
--text:#FFFFFF  --body:#E8E8E6  --muted:#8A8D91
--orange:#FF8A3D  --on-orange:#0B0D0F
--green:#5DCAA5  --green-bg:#0F2A22  --green-border:#085041
--red:#F09595   --red-bg:#2A1212   --red-border:#501313
--amber:#FAC775 --amber-bg:#2A2108 --amber-border:#633806
--orange-chip-bg:#2A1608  --btn2-border:#33373C
```

### LIGHT
```
--bg:#F7F7F5  --card:#FFFFFF  --border:#E4E3DE  --border-sub:#EFEEE9
--text:#0B0D0F  --body:#0B0D0F  --muted:#888780
--orange:#E8620C  --on-orange:#FFFFFF
--green:#1D9E75  --green-bg:#E1F5EE  --green-border:#9FE1CB
--red:#A32D2D   --red-bg:#FCEBEB   --red-border:#F7C1C1
--amber:#854F0B --amber-bg:#FAEEDA --amber-border:#FAC775
--orange-chip-bg:#FAECE7  --btn2-border:#C9C8C2
```

## Component rules
- **Cards** — `background: var(--card)`; `border: 0.5px solid var(--border)`; `border-radius: 12px`; padding `14–16px`.
- **Primary button** — solid `var(--orange)`; text `var(--on-orange)`; radius `12px`; Barlow **500**; **full-width on mobile**.
- **Secondary button** — `background: var(--card)`; `border: 0.5px solid var(--btn2-border)`; text `var(--text)`.
- **Chips** — radius `6–8px`; tinted background + matching text (e.g. `--green-bg` + `--green`, `--orange-chip-bg` + `--orange`).
- **Wordmark** — `RIG` in `var(--text)` + `STRIKE` in `var(--orange)`, Barlow Semi Condensed **500**.
- **Big touch targets** — inputs/buttons ≥ ~52px tall; the site is used one-handed in a truck cab.

## Semantic color — never decorative
- **Green** (`--green` / `--green-bg` / `--green-border`) → **only** credits, savings, good news.
- **Red** (`--red` …) → **only** problems / errors / destructive actions.
- **Amber** (`--amber` …) → **cautions** (e.g. the "estimates only" disclaimer, the zero-report rule).
- **Orange** is the brand accent — CTAs, wordmark `STRIKE`, eyebrows, and orange chips. Not a semantic status color.

## Theme control
- Header toggle cycles **light → dark → auto** (auto follows `prefers-color-scheme`).
- Choice persisted in `localStorage` under `rs-theme`.
- An inline `<head>` script resolves the setting and stamps `data-theme` on `<html>` **before first paint** (no flash).
