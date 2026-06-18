# English (en/) — maintenance note

This directory holds the **English version** of the site, served at `https://school.0x48lab.com/en/`.

## Keep in sync

When site content changes, update **both** language versions:

| Japanese (default)   | English                 |
|----------------------|-------------------------|
| `/docs/index.html`   | `/docs/en/index.html`   |
| `/docs/trial.html`   | `/docs/en/trial.html`   |

## Conventions

- `<html lang="en">` on every page.
- Assets are referenced with **root-absolute paths** (`/css/...`, `/js/...`, `/images/...`), because pages live under `/en/`.
- Each page cross-links its Japanese counterpart via `hreflang` (`ja` / `en` / `x-default` → Japanese), and a header language switcher.
- `hreflang="x-default"` points to the Japanese page (Japanese is the default entry; no auto-redirect).
- Shared JS `/js/calendar.js` localizes its own UI strings via `document.documentElement.lang` — no separate copy needed.
- The embedded Google Form on the trial page is the existing Japanese form (out of scope to translate the form itself).
