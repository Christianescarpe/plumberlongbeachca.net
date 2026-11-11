# Long Beach Plumbing Referral

Private, unpublished preview of a phone-only plumbing referral site for Long Beach, California. It is an independent referral explanation, not a plumbing contractor, and it is not ready to publish.

The descriptive title “Long Beach Plumbing Referral” is a working name. The legal operator, the approved brand, the domain, the phone number, and the answering hours are intentionally empty. The pages say “Phone setup pending” and do not dial a stand-in number.

## What is in this folder

- `content/pages/` — the 28 pages, as editable Markdown.
- `content/coverage.json` — the 44 plumbing topics and the anchor each one must show.
- `site.config.json` — the only place for brand, operator, domain, phone, hours, and launch acknowledgements.
- `src/` — the static-site build, the stylesheet, and the original diagrams.
- `dist/` — the generated site. Upload this folder, not the Markdown, when someone is actually cleared to host it.
- `handoff/` — page map, topic coverage, image licenses, source notes, launch checklist, and the QA report. These files are not pages on the site.
- `deploy/nginx.conf.example` — a sketch for an ordinary web server. The preview build also writes `dist/.htaccess`.

There is no framework, no database, and no API key. Hosting does not require Vercel or any account from this build.

## Preview locally

```bash
node src/build.mjs
node scripts/preview-server.mjs
```

Open `http://127.0.0.1:41731/`. The server listens on localhost only. Links are root-relative and assume the site is the host’s document root. Set `PORT` if 41731 is taken.

JavaScript is optional. Menus, footnotes, and the phone status work without it. The small `site.js` file only closes the mobile menu.

## Production build

`node src/build.mjs --production` exits with an error on this config. It will write canonical URLs, an indexable robots file, a sitemap, and a real `tel:` link only when `site.config.json` has a verified operator, brand, domain, matching phone, Pacific Time hours, coverage acknowledgements, and compliance flags. Placeholder words, example domains, and fictional 555-01 numbers are rejected.

Do not flip those flags to see the layout. The preview is the layout. Publishing still needs the checklist in `handoff/LAUNCH-CHECKLIST.md`.

## Editing a page

Change the Markdown, then rebuild. Front matter needs `path`, `title`, `h1`, `description` (80–175 characters), `intent`, `kind`, and `crumb`. Internal links end with a slash: `[Sewer lines](/services/sewer-repair/#sewer-lines)`.

The build checks word counts, FAQ length on the home and service pages, duplicate paragraphs, the 44 topic anchors, and internal links. If it fails, the message names the page.

`kind` is one of `home`, `service`, `index`, `district`, `city`, `trust`, or `guide`. Do not add a 29th public URL without a new editorial decision. A cloned ZIP page or a second “plumber in Long Beach” URL is out of scope.

## Deploying later

1. Finish `handoff/LAUNCH-CHECKLIST.md`.
2. Fill `site.config.json` with the real values and run the production build.
3. Upload the new `dist/` directory as the document root.
4. Serve `index.html` for directories, keep the trailing slash, and point 404s at `/404.html`.
5. Use HTTPS. The generated production `.htaccess` includes a sketch. Nginx notes are in `deploy/nginx.conf.example`.
6. Leave the preview `noindex` header off only on that production build. This preview’s robots file disallows the whole site.

Rollback is replacing the document root with the previous `dist/` directory. There is no database migration.

## What this preview refuses to do

- No quote form, chat lead, or email-to-lead.
- No fake office, license, insurance, reviews, stars, crew, or arrival promise.
- No payout figure and no network name on the public pages.
- No claim that a specialty or a nearby city is currently accepted.
- HVAC topics from the source list are not on this site.

Image rights are in `handoff/ASSET-LICENSES.csv`. Local facts and their limits are in `handoff/SOURCE-CLAIMS.md`.
