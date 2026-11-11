# QA report

Run on November 8, 2026, against the preview build in `dist/`. This is a file crawl of the generated HTML, not a public deployment and not an authorized test call.

## Result

File crawl passed with no failures.

Pages checked: 29 HTML files (28 launch URLs plus the host 404 page).

## What was checked

- Exactly 28 `index.html` launch URLs, unique titles, H1s, and meta descriptions, one H1 each, HTML5 doctype, `lang="en"`.
- Preview `noindex, nofollow, noarchive` on every HTML file, robots.txt disallow, sitemap with no `<loc>` entries, and no canonical URL.
- No `<form>`. Telephone links limited to the published Long Beach Utilities, Edison, permit-center, and preservation numbers. No referral `tel:` link.
- JSON-LD parses. No LocalBusiness, FAQPage, Plumber, telephone, address, openingHours, or rating fields.
- Forbidden-claim scan for network name, payout figures, testimonials, star ratings, 24-hour referral promises, and fake-crew phrases.
- All 44 plumbing topic labels visible at the mapped anchor.
- The 11 residential ZIP sections appear on the areas index. No residential folder was created for the excluded PO Box codes.
- Internal links, anchors, and local image and font files resolve. No `http://` asset URLs.

## Failures

None.

## Notes

- None from the file crawl.

## HTML and visual checks

Nu HTML Checker (validator `latest` jar, November 8, 2026) reported no errors on all 29 HTML files after the hero revision.

Playwright 1.49 with Chromium reopened all 28 pages at 1440×900 and 390×844, plus a 768-wide sample. Every URL returned HTTP 200. No page had horizontal overflow. The pending-phone control is present, and it is not a `tel:` link. Updated frames:

- `/opt/cursor/artifacts/screenshots/desktop/home.png`
- `/opt/cursor/artifacts/screenshots/mobile/home.png`
- `/opt/cursor/artifacts/screenshots/desktop/services-drain-cleaning.png`
- `/opt/cursor/artifacts/screenshots/mobile/services-drain-cleaning.png`
- `/opt/cursor/artifacts/screenshots/desktop/about.png`
- `/opt/cursor/artifacts/screenshots/mobile/about.png`

The homepage hero uses a CC BY 2.0 photograph of copper pipe being soldered (neffk, 2010), captioned as illustrative and not this service’s staff or a Long Beach job. The Long Beach waterfront photograph remains lower on the homepage.

## Production gate

`node scripts/check-production-gate.mjs` still refuses the shipped config (24 reasons) and deletes its fixture output. `dist/` stays the noindex preview.

## Not claimed by this file crawl

- Browser layout at 360, 768, and 1280 pixels is recorded separately from Playwright screenshots when those screenshots exist.
- Nu HTML Checker results are recorded only if the checker actually ran.
- No call was placed. Destination, overflow, and after-hours behavior are untested because no routing number exists.
- Production canonicals were not emitted. The production gate test is a separate script and does not replace this preview.
