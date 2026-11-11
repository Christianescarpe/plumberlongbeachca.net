import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { countedWords, collectParagraphs, faqStats, parseMarkdown, renderDocument } from "./engine.mjs";
import { productionErrors } from "./gates.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const outDir = path.resolve(root, args.includes("--out") ? args[args.indexOf("--out") + 1] : "dist");
const allowReservedTestDomain = args.includes("--allow-reserved-test-domain");

const configPath = args.includes("--config")
  ? path.resolve(args[args.indexOf("--config") + 1])
  : path.join(root, "site.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
if (args.includes("--production")) config.mode = "production";
if (config.domain?.allowReservedTestDomain && !allowReservedTestDomain) {
  console.error("Production build refused:\n- allowReservedTestDomain cannot be stored in the config file");
  process.exit(1);
}
if (allowReservedTestDomain && config.domain) config.domain.allowReservedTestDomain = true;
if (config.mode === "production") {
  const errors = productionErrors(config, { allowReservedTestDomain });
  if (errors.length) {
    console.error("Production build refused:");
    for (const error of errors) console.error(`- ${error}`);
    process.exit(1);
  }
}

const photos = {};
for (const item of JSON.parse(fs.readFileSync(path.join(root, "src/assets/photos/manifest.json"), "utf8"))) {
  photos[item.filename_1600.replace(/-1600\.jpg$/, "")] = item;
}

function walk(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

const docs = walk(path.join(root, "content/pages")).map((file) => parseMarkdown(fs.readFileSync(file, "utf8"), path.relative(root, file)));
const paths = new Set(docs.map((doc) => doc.front.path));
if (paths.size !== docs.length) throw new Error("Duplicate paths in content");

const expected = [
  "/",
  "/services/",
  "/services/drain-cleaning/",
  "/services/sewer-repair/",
  "/services/leak-detection/",
  "/services/pipe-water-line-repair/",
  "/services/water-heaters/",
  "/services/fixtures-remodel-plumbing/",
  "/services/gas-line-plumbing/",
  "/services/commercial-plumbing/",
  "/services/specialty-plumbing/",
  "/areas/",
  "/areas/downtown-alamitos-beach/",
  "/areas/belmont-shore-heights/",
  "/areas/bixby-knolls-california-heights/",
  "/areas/east-long-beach/",
  "/areas/north-long-beach/",
  "/areas/wrigley-west-central/",
  "/areas/signal-hill/",
  "/areas/lakewood/",
  "/areas/seal-beach/",
  "/areas/los-alamitos/",
  "/areas/carson/",
  "/about/",
  "/contact/",
  "/privacy/",
  "/how-referrals-work/",
  "/plumbing-guides/",
];
for (const url of expected) {
  if (!paths.has(url)) throw new Error(`Missing page ${url}`);
}
for (const url of paths) {
  if (!expected.includes(url)) throw new Error(`Unexpected page ${url}`);
}

const mins = { home: 650, service: 800, district: 600, city: 600, guide: 900, trust: 400, index: 450 };
const titles = new Set();
const h1s = new Set();
const descriptions = new Set();
const rendered = [];
const sharedParas = new Map();
const problems = [];

for (const doc of docs) {
  const { front } = doc;
  if (titles.has(front.title)) problems.push(`Duplicate title: ${front.title}`);
  if (h1s.has(front.h1)) problems.push(`Duplicate H1: ${front.h1}`);
  if (descriptions.has(front.description)) problems.push(`Duplicate description: ${front.description}`);
  titles.add(front.title);
  h1s.add(front.h1);
  descriptions.add(front.description);
  if (front.description.length < 80 || front.description.length > 175) {
    problems.push(`${front.path} meta description length ${front.description.length}`);
  }
  let html;
  try {
    html = renderDocument(doc, config, photos);
  } catch (error) {
    problems.push(`${front.path} render: ${error.message}`);
    continue;
  }
  const wordCount = countedWords(doc, config);
  const min = mins[front.kind];
  if (!min) problems.push(`Unknown kind ${front.kind}`);
  else if (wordCount < min) problems.push(`${front.path} has ${wordCount} counted words; minimum is ${min}`);
  const faqs = faqStats(doc);
  if (front.kind === "home" || front.kind === "service") {
    if (faqs.length < 4 || faqs.length > 6) problems.push(`${front.path} has ${faqs.length} FAQs`);
    for (const faq of faqs) {
      if (faq.words < 40 || faq.words > 70) problems.push(`${front.path} FAQ (${faq.words}w) ${faq.q}`);
    }
  }
  if ((front.kind === "district" || front.kind === "city") && faqs.length < 3) {
    problems.push(`${front.path} needs at least 3 FAQs`);
  }
  for (const paragraph of collectParagraphs(doc, config)) {
    if (paragraph.length < 180) continue;
    const prior = sharedParas.get(paragraph);
    if (prior) problems.push(`Repeated paragraph on ${prior} and ${front.path}: ${paragraph.slice(0, 90)}`);
    sharedParas.set(paragraph, front.path);
  }
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  for (const href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("/assets/")) continue;
    const [pathname, hash] = href.split("#");
    if (!paths.has(pathname)) problems.push(`${front.path} links to unknown ${pathname}`);
    if (hash) {
      const target = docs.find((item) => item.front.path === pathname);
      let ids = [];
      try {
        ids = [...renderDocument(target, config, photos).matchAll(/id="([a-z0-9-]+)"/g)].map((match) => match[1]);
      } catch (error) {
        problems.push(`${front.path} could not inspect ${pathname}: ${error.message}`);
        continue;
      }
      if (!ids.includes(hash)) problems.push(`${front.path} links to missing #${hash} on ${pathname}`);
    }
  }
  rendered.push({ doc, html, wordCount, faqs });
}

if (problems.length) {
  console.error(`Content problems: ${problems.length}`);
  for (const problem of problems) console.error(`- ${problem}`);
  process.exit(1);
}

const coverage = JSON.parse(fs.readFileSync(path.join(root, "content/coverage.json"), "utf8"));
if (coverage.length !== 44) throw new Error(`Coverage file has ${coverage.length} rows`);
const byPath = new Map(rendered.map((item) => [item.doc.front.path, item.html]));
for (const row of coverage) {
  const html = byPath.get(row.path);
  if (!html) throw new Error(`Coverage path missing ${row.path}`);
  if (!html.includes(`id="${row.anchor}"`)) throw new Error(`Missing anchor ${row.anchor}`);
  const chunk = html.split(`id="${row.anchor}"`)[1]?.slice(0, 500) || "";
  const visible = row.topic.replaceAll("&", "&amp;");
  if (!chunk.includes(visible)) throw new Error(`Anchor ${row.anchor} does not show topic ${row.topic}`);
}

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
fs.cpSync(path.join(root, "src/assets"), path.join(outDir, "assets"), { recursive: true });
let css = fs.readFileSync(path.join(root, "src/css/site.css"), "utf8");
fs.writeFileSync(path.join(outDir, "assets/site.css"), css);
fs.copyFileSync(path.join(root, "src/js/site.js"), path.join(outDir, "assets/site.js"));

for (const item of rendered) {
  const dest = item.doc.front.path === "/"
    ? path.join(outDir, "index.html")
    : path.join(outDir, item.doc.front.path, "index.html");
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, item.html);
}

const notFound = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Page not found | Long Beach Plumbing Referral</title>
  <meta name="description" content="That address is not one of the 28 pages on this private Long Beach plumbing referral preview.">
  <meta name="robots" content="noindex, nofollow, noarchive">
  <meta name="theme-color" content="#0e2438">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/site.css">
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <header class="site-header"><div class="wrap header-inner"><a class="brand" href="/"><span class="brand-name">Long Beach Plumbing Referral</span></a></div></header>
  <main id="main"><div class="wrap"><article data-wordcount>
    <h1>This page is not on the site</h1>
    <p class="lead">The address does not match one of the 28 guides. Use the service index, the area index, or return home.</p>
    <ul class="link-cards">
      <li><a href="/"><strong>Home</strong><span>Plumber in Long Beach, as a referral.</span></a></li>
      <li><a href="/services/"><strong>Services</strong><span>Nine plumbing clusters.</span></a></li>
      <li><a href="/areas/"><strong>Areas</strong><span>Districts and nearby cities.</span></a></li>
      <li><a href="/contact/"><strong>Contact</strong><span>Phone setup is still pending.</span></a></li>
    </ul>
  </article></div></main>
  <div class="sticky-call"><p class="call-pending"><strong>Phone setup pending</strong><span>This preview does not place a call.</span></p></div>
</body>
</html>
`;
fs.writeFileSync(path.join(outDir, "404.html"), notFound);

const robots = config.mode === "production"
  ? `User-agent: *\nAllow: /\n\nSitemap: https://${config.domain.hostname}/sitemap.xml\n`
  : `User-agent: *\nDisallow: /\n\n# Private preview. This file is not a production sitemap policy.\n`;
fs.writeFileSync(path.join(outDir, "robots.txt"), robots);

const sitemap = config.mode === "production"
  ? `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${expected.map((url) => `  <url><loc>https://${config.domain.hostname}${url}</loc></url>`).join("\n")}\n</urlset>\n`
  : `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<!-- Private preview: no URLs are listed until a verified production domain is configured. -->\n</urlset>\n`;
fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);

const htaccess = config.mode === "production"
  ? `# Production rules generated with a verified domain. Review before upload.\nOptions -Indexes\nDirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_rewrite.c>\nRewriteEngine On\nRewriteCond %{HTTPS} !=on\nRewriteCond %{HTTP:X-Forwarded-Proto} !=https\nRewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]\nRewriteCond %{REQUEST_FILENAME} -d\nRewriteRule ^(.+[^/])$ /$1/ [R=301,L]\n</IfModule>\n`
  : `# Private preview. Do not publish this folder.\nOptions -Indexes\nDirectoryIndex index.html\nErrorDocument 404 /404.html\n<IfModule mod_headers.c>\nHeader set X-Robots-Tag "noindex, nofollow, noarchive"\n</IfModule>\n`;
fs.writeFileSync(path.join(outDir, ".htaccess"), htaccess);

const handoff = path.join(root, "handoff");
const writeHandoff = path.resolve(outDir) === path.resolve(root, "dist");
if (writeHandoff) fs.mkdirSync(handoff, { recursive: true });
if (writeHandoff) {
const csvEscape = (value) => `"${String(value).replaceAll('"', '""')}"`;
const pageMap = ["url,title,h1,primary_intent,kind,word_count,faq_count", ...rendered.map((item) => [
  item.doc.front.path,
  item.doc.front.title,
  item.doc.front.h1,
  item.doc.front.intent,
  item.doc.front.kind,
  item.wordCount,
  item.faqs.length,
].map(csvEscape).join(","))];
fs.writeFileSync(path.join(handoff, "PAGE-MAP.csv"), `${pageMap.join("\n")}\n`);
const coverageCsv = ["topic,url,anchor,conditional,notes", ...coverage.map((row) => [
  row.topic, row.path, row.anchor, row.conditional ? "yes" : "no", row.note,
].map(csvEscape).join(","))];
fs.writeFileSync(path.join(handoff, "ARROYO-COVERAGE.csv"), `${coverageCsv.join("\n")}\n`);
const manifest = JSON.parse(fs.readFileSync(path.join(root, "src/assets/photos/manifest.json"), "utf8"));
const assetRows = [[
  "asset", "source_url", "creator", "license", "permission", "download_date", "allowed_uses", "attribution",
].join(",")];
for (const item of manifest) {
  for (const file of [item.filename_800, item.filename_1600]) {
    assetRows.push([
      `website/assets/photos/${file}`,
      item.source_page,
      item.creator,
      item.license,
      item.permission,
      item.download_date,
      item.allowed_uses,
      `${item.creator}. ${item.license}. ${item.date}. ${item.description}`,
    ].map(csvEscape).join(","));
  }
}
assetRows.push([
  "src/assets/fonts/fraunces-latin-500-normal.woff2 and 600 and 700",
  "https://github.com/undercasetype/Fraunces via @fontsource/fraunces@5.2.8",
  "Undercase Type (Fraunces)",
  "SIL Open Font License 1.1",
  "OFL text copied to src/assets/fonts/Fraunces-OFL.txt",
  "2026-11-08",
  "Self-hosted webfont on this site",
  "Fraunces by Undercase Type, SIL OFL 1.1",
].map(csvEscape).join(","));
assetRows.push([
  "src/assets/fonts/source-sans-3-latin-400-normal.woff2 and 500, 600, 700",
  "https://github.com/adobe-fonts/source-sans via @fontsource/source-sans-3@5.2.8",
  "Paul D. Hunt / Adobe",
  "SIL Open Font License 1.1",
  "OFL text copied to src/assets/fonts/SourceSans3-OFL.txt",
  "2026-11-08",
  "Self-hosted webfont on this site",
  "Source Sans 3 by Paul D. Hunt, SIL OFL 1.1",
].map(csvEscape).join(","));
assetRows.push([
  "src/diagrams.mjs and src/assets/favicon.svg",
  "original",
  "Prepared for this referral site",
  "Original work, all rights reserved for the site operator",
  "Created for this project; not a photograph of staff or a job",
  "2026-11-08",
  "Use on this referral website",
  "Original diagram or mark. Not a photo of a crew, van, or completed job.",
].map(csvEscape).join(","));
fs.writeFileSync(path.join(handoff, "ASSET-LICENSES.csv"), `${assetRows.join("\n")}\n`);
fs.writeFileSync(path.join(handoff, "page-stats.json"), JSON.stringify(rendered.map((item) => ({
  path: item.doc.front.path,
  words: item.wordCount,
  faqs: item.faqs,
})), null, 2));
}

console.log(`Built ${rendered.length} pages to ${outDir} (${config.mode}).`);
for (const item of rendered) console.log(`${String(item.wordCount).padStart(4)}  ${item.doc.front.path}`);
