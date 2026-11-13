import { diagrams } from "./diagrams.mjs";
import { canDial } from "./gates.mjs";
import { crumbFor, primaryNav, sectionNav, services, districts, cities } from "./nav.mjs";

const TEL = new Set([
  "tel:+15625702390",
  "tel:+15625702140",
  "tel:+15625702100",
  "tel:+18006554555",
  "tel:+15625705237",
  "tel:+15625706194",
]);

export function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function fillTokens(text, config) {
  const brand = config.brand.publicName;
  const live = canDial(config);
  const operator = live ? config.brand.operatorLegalName : "not published";
  const phone = live ? config.phone.display : "phone setup pending";
  const hours = config.mode === "production" && config.hours.verified
    ? config.hours.summary
    : "Answering hours are not confirmed";
  const domain = config.mode === "production" && config.domain.verified
    ? config.domain.hostname
    : "no domain configured";
  return String(text)
    .replaceAll("{{brand}}", brand)
    .replaceAll("{{operator}}", operator)
    .replaceAll("{{phone}}", phone)
    .replaceAll("{{hours}}", hours)
    .replaceAll("{{domain}}", domain);
}

function checkHref(href) {
  if (href.startsWith("tel:")) {
    if (!TEL.has(href)) throw new Error(`Telephone link is not an allowlisted official number: ${href}`);
    return;
  }
  if (href.startsWith("https://")) return;
  if (href.startsWith("#")) {
    if (!/^#[a-z0-9-]+$/.test(href)) throw new Error(`Bad anchor ${href}`);
    return;
  }
  if (href.startsWith("/")) {
    const path = href.split("#")[0];
    if (path !== "/" && !path.endsWith("/")) throw new Error(`Internal link needs a trailing slash: ${href}`);
    if (href.includes("?")) throw new Error(`Query links are not used: ${href}`);
    return;
  }
  throw new Error(`Unsupported link: ${href}`);
}

function inline(raw, config) {
  const text = fillTokens(raw, config);
  const re = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let out = "";
  let i = 0;
  for (const match of text.matchAll(re)) {
    out += escapeHtml(text.slice(i, match.index));
    if (match[3]) out += `<strong>${escapeHtml(match[3])}</strong>`;
    else {
      checkHref(match[2]);
      const external = match[2].startsWith("https://");
      const rel = external ? ` rel="noreferrer"` : "";
      out += `<a href="${escapeHtml(match[2])}"${rel}>${escapeHtml(match[1])}</a>`;
    }
    i = match.index + match[0].length;
  }
  out += escapeHtml(text.slice(i));
  return out;
}

function parseHeading(line) {
  const level = line.startsWith("### ") ? 3 : 2;
  let text = line.replace(/^###?\s+/, "").trim();
  let id = "";
  const match = text.match(/^(.*)\{#([a-z0-9-]+)\}\s*$/);
  if (match) {
    text = match[1].trim();
    id = match[2];
  }
  return { type: "h", level, text, id };
}

function parseKeyBlock(raw) {
  const data = {};
  const prose = [];
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    const match = line.match(/^([A-Za-z]+):\s*(.*)$/);
    if (match && ["base", "alt", "caption", "kind", "id", "Heading"].includes(match[1])) {
      data[match[1]] = match[2];
    } else prose.push(line);
  }
  return { data, prose: prose.join("\n").trim() };
}

export function parseMarkdown(fileText, filename) {
  const text = fileText.replace(/\r\n/g, "\n");
  if (!text.startsWith("---\n")) throw new Error(`${filename}: missing front matter`);
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) throw new Error(`${filename}: unclosed front matter`);
  const front = {};
  for (const line of text.slice(4, end).split("\n")) {
    if (!line.trim()) continue;
    const idx = line.indexOf(":");
    if (idx < 0) throw new Error(`${filename}: bad front matter line ${line}`);
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (value === "true") value = true;
    else if (value === "false") value = false;
    front[key] = value;
  }
  const body = text.slice(end + 5);
  return { front, blocks: parseBlocks(body, filename), filename };
}

function parseBlocks(body, filename) {
  const lines = body.split("\n");
  const blocks = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim()) {
      i += 1;
      continue;
    }
    const line = lines[i];
    if (line.startsWith(":::")) {
      const fence = line.slice(3).trim();
      i += 1;
      const buf = [];
      while (i < lines.length && lines[i].trim() !== ":::") {
        buf.push(lines[i]);
        i += 1;
      }
      if (i >= lines.length) throw new Error(`${filename}: unclosed fence ${fence}`);
      i += 1;
      blocks.push({ type: "fence", fence, raw: buf.join("\n").trim() });
      continue;
    }
    if (line.startsWith("## ") || line.startsWith("### ")) {
      blocks.push(parseHeading(line));
      i += 1;
      continue;
    }
    if (line.startsWith("- ")) {
      const items = [];
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2).trim());
        i += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }
    const buf = [line.trim()];
    i += 1;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].startsWith("#") &&
      !lines[i].startsWith("- ") &&
      !lines[i].startsWith(":::")
    ) {
      buf.push(lines[i].trim());
      i += 1;
    }
    blocks.push({ type: "p", text: buf.join(" ") });
  }
  return blocks;
}

function words(text) {
  const plain = String(text).replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\*\*/g, "");
  return plain.trim().split(/\s+/).filter(Boolean);
}

function paragraphHtml(blocks, config) {
  return blocks.filter((block) => block.type === "p").map((block) => `<p>${inline(block.text, config)}</p>`).join("\n");
}

function listHtml(items, config) {
  return `<ul>\n${items.map((item) => `<li>${inline(item, config)}</li>`).join("\n")}\n</ul>`;
}

function cardItems(items) {
  return items.map((item) => {
    const match = item.match(/^\[([^\]]+)\]\(([^)\s]+)\)\s+—\s+(.+)$/);
    if (!match) throw new Error(`Card item needs [Label](/path/) — text: ${item}`);
    checkHref(match[2]);
    return { label: match[1], href: match[2], text: match[3] };
  });
}

export function countedWords(doc, config) {
  const mode = config.mode === "production" ? "production" : "preview";
  let bag = [];
  const takeBlocks = (blocks) => {
    for (const block of blocks) {
      if (block.type === "p") bag.push(block.text);
      else if (block.type === "h") bag.push(block.text);
      else if (block.type === "list") bag.push(...block.items);
      else if (block.type === "fence") {
        if (block.fence === "if-preview" && mode !== "preview") continue;
        if (block.fence === "if-production" && mode !== "production") continue;
        if (block.fence === "safety") continue;
        if (["local", "context", "conditional", "note", "if-preview", "if-production"].includes(block.fence)) {
          takeBlocks(parseBlocks(block.raw, doc.filename));
        } else if (block.fence === "faq") {
          for (const faq of parseFaqs(block.raw)) bag.push(faq.q, faq.a);
        } else if (block.fence === "steps") {
          for (const step of parseSteps(block.raw)) bag.push(step.title, step.text);
        } else if (block.fence === "symptoms" || block.fence === "related" || block.fence === "sources") {
          bag.push(...block.raw.split("\n").map((line) => line.replace(/^- /, "")));
        } else if (block.fence === "table") {
          bag.push(...block.raw.split("\n"));
        } else if (block.fence === "figure" || block.fence === "diagram") {
          const { data } = parseKeyBlock(block.raw);
          if (data.caption) bag.push(data.caption);
          if (data.alt) bag.push(data.alt);
        }
      }
    }
  };
  takeBlocks(doc.blocks);
  return words(bag.join(" ")).length;
}

function parseFaqs(raw) {
  const faqs = [];
  let current = null;
  const flush = () => {
    if (current) faqs.push(current);
    current = null;
  };
  for (const line of raw.split("\n")) {
    if (line.startsWith("Q:")) {
      flush();
      current = { q: line.slice(2).trim(), a: "" };
    } else if (line.startsWith("A:")) {
      if (!current) throw new Error(`Answer without question: ${line}`);
      current.a = line.slice(2).trim();
    } else if (current && line.trim()) {
      current.a = `${current.a} ${line.trim()}`.trim();
    }
  }
  flush();
  return faqs;
}

function parseSteps(raw) {
  return raw.split("\n").filter((line) => line.trim()).map((line) => {
    const idx = line.indexOf("|");
    if (idx < 0) throw new Error(`Step needs Title | text: ${line}`);
    return { title: line.slice(0, idx).trim(), text: line.slice(idx + 1).trim() };
  });
}

function renderFaqs(raw, config, heading) {
  const faqs = parseFaqs(raw);
  const items = faqs.map((faq) => `<details class="qa">\n<summary>${inline(faq.q, config)}</summary>\n<p>${inline(faq.a, config)}</p>\n</details>`).join("\n");
  return `<section class="faq">\n<h2>${escapeHtml(heading)}</h2>\n${items}\n</section>`;
}

function safetyBox() {
  return `<aside class="shared-safety" data-shared="true">
  <h2>If there is danger, use the utility line</h2>
  <p>For a suspected gas leak in Long Beach, get people out of the area. From a safe place, call Long Beach Utilities at <a href="tel:+15625702140">(562) 570-2140</a> or call 911. Do not use switches, flames, or a phone where you smell gas. This referral preview is not the gas emergency line.</p>
  <p>For sewage in the street, a noisy or odorous manhole, or a sewer stoppage Long Beach Utilities asks to hear about, call <a href="tel:+15625702390">(562) 570-2390</a>. Those numbers are the utility’s published emergency lines, checked November 8, 2026. They are not this website’s referral number.</p>
</aside>`;
}

function renderFence(block, config, photos, faqHeading) {
  const mode = config.mode === "production" ? "production" : "preview";
  if (block.fence === "if-preview" && mode !== "preview") return "";
  if (block.fence === "if-production" && mode !== "production") return "";
  if (block.fence === "safety") return safetyBox();
  if (["if-preview", "if-production", "note"].includes(block.fence)) {
    return renderFlow(parseBlocks(block.raw, "fence"), config, photos, faqHeading);
  }
  if (block.fence === "context" || block.fence === "local") {
    const lines = block.raw.split("\n");
    let heading = "Long Beach context";
    let rest = block.raw;
    if (lines[0].startsWith("Heading:")) {
      heading = lines[0].slice(8).trim();
      rest = lines.slice(1).join("\n").trim();
    }
    const inner = renderFlow(parseBlocks(rest, "context"), config, photos, faqHeading);
    return `<aside class="local-context">\n<h2>${escapeHtml(heading)}</h2>\n${inner}\n</aside>`;
  }
  if (block.fence === "conditional") {
    const lines = block.raw.split("\n");
    let heading = "Availability has to be confirmed";
    let rest = block.raw;
    if (lines[0].startsWith("Heading:")) {
      heading = lines[0].slice(8).trim();
      rest = lines.slice(1).join("\n").trim();
    }
    const inner = renderFlow(parseBlocks(rest, "conditional"), config, photos, faqHeading);
    return `<aside class="conditional">\n<h3>${escapeHtml(heading)}</h3>\n${inner}\n</aside>`;
  }
  if (block.fence === "faq") return renderFaqs(block.raw, config, faqHeading);
  if (block.fence === "steps") {
    const steps = parseSteps(block.raw);
    return `<ol class="steps">\n${steps.map((step, index) => `<li><span class="num">${String(index + 1).padStart(2, "0")}</span><h3>${inline(step.title, config)}</h3><p>${inline(step.text, config)}</p></li>`).join("\n")}\n</ol>`;
  }
  if (block.fence === "symptoms" || block.fence === "related") {
    let raw = block.raw;
    let label = block.fence === "symptoms" ? "Ways to describe the problem" : "Related guides";
    const lines = raw.split("\n");
    if (lines[0].startsWith("Heading:")) {
      label = lines[0].slice(8).trim();
      raw = lines.slice(1).join("\n");
    }
    const cards = cardItems(raw.split("\n").filter((line) => line.trim()).map((line) => line.replace(/^- /, "")));
    const iconSvg = `<span class="card-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg></span>`;
    return `<section class="${block.fence === "symptoms" ? "symptom-block" : "related"}">\n<h2>${escapeHtml(label)}</h2>\n<ul class="link-cards">\n${cards.map((card) => `<li><a href="${escapeHtml(card.href)}">${block.fence === "symptoms" ? iconSvg : ""}<strong>${escapeHtml(card.label)}</strong><span>${inline(card.text, config)}</span><span class="card-more" aria-hidden="true">Explore &rarr;</span></a></li>`).join("\n")}\n</ul>\n</section>`;
  }
  if (block.fence === "sources") {
    const items = block.raw.split("\n").filter((line) => line.trim()).map((line) => line.replace(/^- /, ""));
    return `<section class="sources">\n<h2>Sources and limits</h2>\n<ul>\n${items.map((item) => `<li>${inline(item, config)}</li>`).join("\n")}\n</ul>\n<p>Checked November 8, 2026, unless a source itself is older. Official pages can change. Nothing here is a permit determination, a coverage promise, or legal advice.</p>\n</section>`;
  }
  if (block.fence === "table") {
    const rows = block.raw.split("\n").filter((line) => line.trim());
    const caption = rows[0];
    const head = rows[1].split("|").map((cell) => cell.trim());
    const body = rows.slice(2).map((row) => row.split("|").map((cell) => cell.trim()));
    return `<div class="table-wrap"><table>\n<caption>${inline(caption, config)}</caption>\n<thead><tr>${head.map((cell) => `<th scope="col">${inline(cell, config)}</th>`).join("")}</tr></thead>\n<tbody>\n${body.map((row) => `<tr>${row.map((cell) => `<td>${inline(cell, config)}</td>`).join("")}</tr>`).join("\n")}\n</tbody>\n</table></div>`;
  }
  if (block.fence === "figure") return renderPhoto(parseKeyBlock(block.raw).data, photos, config, false);
  if (block.fence === "diagram") {
    const { data } = parseKeyBlock(block.raw);
    const diagram = diagrams[data.id];
    if (!diagram) throw new Error(`Unknown diagram ${data.id}`);
    const caption = data.caption || diagram.caption;
    return `<figure class="diagram">\n${diagram.svg}\n<figcaption><span class="label">${escapeHtml(diagram.title)}</span>${inline(caption, config)} Original illustration for this site, November 8, 2026.</figcaption>\n</figure>`;
  }
  throw new Error(`Unknown fence ${block.fence}`);
}

function renderPhoto(data, photos, config, eager) {
  const meta = photos[data.base];
  if (!meta) throw new Error(`Unknown photo ${data.base}`);
  if (!data.alt || !data.caption) throw new Error(`Photo ${data.base} needs alt and caption`);
  const src800 = `/assets/photos/${meta.filename_800}`;
  const src1600 = `/assets/photos/${meta.filename_1600}`;
  return `<figure class="photo">\n<img src="${src800}" srcset="${src800} ${meta.width_800}w, ${src1600} ${meta.width_1600}w" sizes="(min-width: 960px) 640px, 100vw" width="${meta.width_1600}" height="${meta.height_1600}" alt="${escapeHtml(data.alt)}" ${eager ? `loading="eager" fetchpriority="high"` : `loading="lazy"`} decoding="async">\n</figure>`;
}

function isSplitInlineBlock(block) {
  return (
    block.type === "p" ||
    block.type === "list" ||
    (block.type === "fence" && block.fence === "conditional")
  );
}

function renderSplitInlineBlock(block, config, photos, faqHeading) {
  if (block.type === "p") return `<p>${inline(block.text, config)}</p>\n`;
  if (block.type === "list") return `${listHtml(block.items, config)}\n`;
  return `${renderFence(block, config, photos, faqHeading)}\n`;
}

function renderFlow(blocks, config, photos, faqHeading) {
  let html = "";
  let i = 0;
  while (i < blocks.length) {
    const b = blocks[i];
    // Pattern 1: Heading followed by prose/list/conditional blocks and then a figure fence
    if (b.type === "h") {
      let j = i + 1;
      const items = [];
      let hasPara = false;
      while (j < blocks.length && isSplitInlineBlock(blocks[j])) {
        if (blocks[j].type === "p") hasPara = true;
        items.push(blocks[j]);
        j++;
      }
      if (j < blocks.length && blocks[j].type === "fence" && blocks[j].fence === "figure" && hasPara) {
        const id = b.id ? ` id="${b.id}"` : "";
        const headingHtml = `<h${b.level}${id}>${inline(b.text, config)}</h${b.level}>\n`;
        const bodyHtml = items.map((item) => renderSplitInlineBlock(item, config, photos, faqHeading)).join("");
        const photoHtml = renderFence(blocks[j], config, photos, faqHeading);
        html += `<section class="split-section">\n  <div class="split-section-copy">\n    ${headingHtml}    ${bodyHtml}  </div>\n  ${photoHtml}\n</section>\n`;
        i = j + 1;
        continue;
      }
    }
    // Pattern 2: Prose/list/conditional blocks starting with a paragraph followed immediately by a figure fence
    if (b.type === "p") {
      let j = i;
      const items = [];
      while (j < blocks.length && isSplitInlineBlock(blocks[j])) {
        items.push(blocks[j]);
        j++;
      }
      if (j < blocks.length && blocks[j].type === "fence" && blocks[j].fence === "figure" && items.length > 0) {
        const bodyHtml = items.map((item) => renderSplitInlineBlock(item, config, photos, faqHeading)).join("");
        const photoHtml = renderFence(blocks[j], config, photos, faqHeading);
        html += `<section class="split-section">\n  <div class="split-section-copy">\n    ${bodyHtml}  </div>\n  ${photoHtml}\n</section>\n`;
        i = j + 1;
        continue;
      }
      html += `<p>${inline(b.text, config)}</p>\n`;
      i++;
      continue;
    }
    if (b.type === "h") {
      const id = b.id ? ` id="${b.id}"` : "";
      html += `<h${b.level}${id}>${inline(b.text, config)}</h${b.level}>\n`;
    } else if (b.type === "list") {
      html += `${listHtml(b.items, config)}\n`;
    } else if (b.type === "fence") {
      html += `${renderFence(b, config, photos, faqHeading)}\n`;
    }
    i++;
  }
  return html;
}

function assignIds(blocks, filename) {
  const used = new Set();
  const walk = (list) => {
    for (const block of list) {
      if (block.type === "h") {
        if (!block.id) block.id = block.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "section";
        if (used.has(block.id)) throw new Error(`${filename}: duplicate id ${block.id}`);
        used.add(block.id);
      }
    }
  };
  walk(blocks);
  return used;
}

function jsonLd(doc, config) {
  const path = doc.front.path;
  const origin = config.mode === "production" ? `https://${config.domain.hostname}` : "";
  const graph = [];
  const org = {
    "@type": "Organization",
    name: config.brand.publicName,
    description: "Independent referral service that publishes plumbing decision guides and may connect callers with third-party providers. Not a plumbing contractor.",
  };
  if (origin) org.url = origin + "/";
  graph.push(org);
  if (path === "/") {
    const site = { "@type": "WebSite", name: config.brand.publicName, description: org.description };
    if (origin) site.url = origin + "/";
    graph.push(site);
  }
  if (doc.front.kind === "service") {
    graph.push({
      "@type": "Service",
      name: doc.front.h1,
      serviceType: "Referral introduction",
      provider: { "@type": "Organization", name: config.brand.publicName },
      description: doc.front.description,
    });
  }
  const crumbs = crumbFor(path, doc.front.crumb || doc.front.h1);
  if (crumbs.length) {
    graph.push({
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map(([name, href], index) => {
        const item = { "@type": "ListItem", position: index + 1, name };
        if (origin) item.item = origin + href;
        return item;
      }),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replaceAll("<", "\\u003c");
}

const REFERRAL_LINE = "Independent referral service. Calls may connect to third-party providers; availability and pricing vary.";

function callControl(config, className) {
  if (canDial(config)) {
    const hours = config.hours?.verified ? `<p class="referral-line">${escapeHtml(config.hours.summary)} Pacific Time.</p>` : "";
    return `<a class="call-btn ${className}" href="tel:${escapeHtml(config.phone.e164)}">Call ${escapeHtml(config.phone.display)}</a>${hours}`;
  }
  return `<button type="button" class="call-btn is-pending ${className}" disabled aria-disabled="true">Phone setup pending</button>`;
}

function heroActions(config) {
  return `<div class="hero-actions">
    ${callControl(config, "hero-call")}
    <div class="hero-connector" aria-hidden="true">
      <span class="connector-line"></span>
      <span class="connector-circle"><svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14"><path d="M8 5v14l11-7z"/></svg></span>
    </div>
  </div>
  <p class="referral-line">${REFERRAL_LINE}</p>`;
}

function headerCall(config) {
  return `<div class="header-call-group">
    ${callControl(config, "header-call-btn")}
    <a class="header-circle-btn" href="/contact/" aria-label="Contact details"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg></a>
  </div>`;
}

function stickyCall(config) {
  return `<div class="sticky-call">${callControl(config, "sticky-btn")}</div>`;
}

function navHtml(items, current, label) {
  return `<nav aria-label="${label}">${items.map(([name, href]) => {
    const currentAttr = href === current ? ` aria-current="page"` : "";
    return `<a href="${escapeHtml(href)}"${currentAttr}>${escapeHtml(name)}</a>`;
  }).join("")}</nav>`;
}

function subnav(path) {
  const items = sectionNav(path);
  if (!items.length) return "";
  const links = items.map(([name, href]) => `<li><a href="${escapeHtml(href)}"${href === path ? ` aria-current="page"` : ""}>${escapeHtml(name)}</a></li>`).join("");
  return `<ul class="subnav">${links}</ul>`;
}

function toc(blocks) {
  const heads = blocks.filter((block) => block.type === "h" && block.level === 2);
  if (heads.length < 4) return "";
  return `<nav class="toc" aria-label="On this page"><strong>On this page</strong><ol>${heads.map((head) => `<li><a href="#${head.id}">${escapeHtml(head.text)}</a></li>`).join("")}</ol></nav>`;
}

function splitIntro(blocks) {
  const intro = [];
  const rest = [];
  let started = false;
  for (const block of blocks) {
    const starts = block.type === "h" || (block.type === "fence" && ["faq", "sources", "related", "symptoms"].includes(block.fence));
    if (starts) started = true;
    (started ? rest : intro).push(block);
  }
  return { intro, rest };
}

function photoImgTag(base, alt, photos, eager = false) {
  const meta = photos[base];
  if (!meta) throw new Error(`Unknown photo ${base}`);
  const src800 = `/assets/photos/${meta.filename_800}`;
  const src1600 = `/assets/photos/${meta.filename_1600}`;
  return `<img src="${src800}" srcset="${src800} ${meta.width_800}w, ${src1600} ${meta.width_1600}w" sizes="(min-width: 960px) 640px, 100vw" width="${meta.width_1600}" height="${meta.height_1600}" alt="${escapeHtml(alt)}" ${eager ? `loading="eager" fetchpriority="high"` : `loading="lazy"`} decoding="async">`;
}

function tickerStrip() {
  const items = [
    "Drain Cleaning",
    "Sewer Line Repair",
    "Leak Detection",
    "Water Heaters",
    "Pipe & Water Lines",
    "Fixtures & Remodels",
    "Gas Line Plumbing",
    "Commercial Plumbing",
    "Long Beach, CA",
  ];
  const itemHtml = items.map((label) => `<span class="ticker-item"><span class="ticker-dot" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="12" height="12"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></span>${escapeHtml(label)}</span>`).join("");
  return `<div class="ticker-strip" aria-hidden="true"><div class="ticker-track">${itemHtml}${itemHtml}</div></div>`;
}

function homeShowcaseSections(photos, config) {
  const galleryCards = [
    { base: "service-index-overview", title: "Tools & Inspection", href: "/services/", alt: "Plumbing wrenches, brass valves, and pipe fittings." },
    { base: "service-leak-detection", title: "Leak Detection", href: "/services/leak-detection/", alt: "Plumber using pliers to inspect and fix an under-sink leak." },
    { base: "service-fixtures-remodel", title: "Fixtures & Remodels", href: "/services/fixtures-remodel-plumbing/", alt: "Plumber installing and tightening a bathroom faucet." },
    { base: "service-commercial-plumbing", title: "Commercial Piping", href: "/services/commercial-plumbing/", alt: "Plumber working on industrial piping in a mechanical room." },
  ];

  return `
<section class="design-band showcase-grid-section">
  <div class="section-head-center">
    <p class="eyebrow">Long Beach Plumbing Scopes</p>
    <h2>The trades behind every call</h2>
  </div>
  <div class="showcase-grid">
    ${galleryCards.map((c) => `<a class="showcase-card" href="${c.href}">
      <div class="showcase-img">${photoImgTag(c.base, c.alt, photos)}</div>
      <span class="showcase-label">${escapeHtml(c.title)} <span aria-hidden="true">&rarr;</span></span>
    </a>`).join("")}
  </div>
</section>

<section class="design-band split-showcase">
  <div class="section-head-left">
    <p class="eyebrow">Before You Call</p>
    <h2>Delivering clear intake across Long Beach</h2>
  </div>
  <div class="split-showcase-grid">
    <div class="split-tall-img">${photoImgTag("service-sewer-drain-pipe", "Technician inspecting drainage and waste lines.", photos)}</div>
    <div class="split-right-col">
      <div class="split-top-row">
        <div class="split-copy">
          <p>This site helps you sort the plumbing symptom, confirm who can authorize entry, and separate private property repairs from Long Beach Utilities emergencies before placing a call.</p>
          <a class="blue-pill-btn" href="/services/">Browse service guides</a>
        </div>
        <div class="split-small-img">${photoImgTag("service-gas-line-plumbing", "Plumber tightening threaded iron pipe fittings.", photos)}</div>
      </div>
      <div class="split-divider" aria-hidden="true">
        <svg viewBox="0 0 420 28" fill="none" preserveAspectRatio="none"><path d="M0 14 H140 L170 24 H420" stroke="rgba(255,255,255,0.22)" stroke-width="1.5"/></svg>
      </div>
      <div class="split-bottom-row">
        <p class="split-note">Prepare the street address, ZIP code, and property ownership status.</p>
        <div class="pill-tags">
          <a class="pill-tag" href="/services/drain-cleaning/">Drain Cleaning</a>
          <a class="pill-tag" href="/services/water-heaters/">Water Heaters</a>
          <a class="pill-tag" href="/areas/">11 Long Beach ZIPs</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="design-band spotlight-section">
  <div class="section-head-left">
    <p class="eyebrow">How It Works</p>
    <h2>Independent providers, direct quotes</h2>
  </div>
  <div class="spotlight-grid">
    <div class="spotlight-photos">
      <div class="spotlight-img-sm">${photoImgTag("guide-plumbing-inspection", "Plumber with toolbox conducting a plumbing inspection.", photos)}</div>
      <div class="spotlight-img-md">${photoImgTag("service-specialty-filtration", "Plumber fitting a residential water filtration system.", photos)}</div>
    </div>
    <div class="spotlight-quote">
      <div class="quote-mark" aria-hidden="true">&ldquo;</div>
      <p>We are an independent referral service, not a plumbing contractor and not a city department. When a call is connected, the receiving provider decides whether to take the job, sets the written price, and handles licensing and permits directly with you.</p>
      <div class="spotlight-meta">
        <div>
          <strong>Long Beach Plumbing Referral</strong>
          <span>Phone-only referral &middot; No online forms</span>
        </div>
        <div class="spotlight-actions">
          <a class="circle-arrow-btn" href="/how-referrals-work/" aria-label="How referrals work">&rarr;</a>
          <a class="circle-arrow-btn" href="/about/" aria-label="About this service">&rarr;</a>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="design-band stats-band" aria-label="Coverage facts">
  <div class="stat-item"><span class="stat-num">11</span><span class="stat-label">Long Beach Residential ZIPs</span></div>
  <div class="stat-item"><span class="stat-num">9</span><span class="stat-label">Core Service Guides</span></div>
  <div class="stat-item"><span class="stat-num">28</span><span class="stat-label">Dedicated Local Pages</span></div>
  <div class="stat-item"><span class="stat-num">44</span><span class="stat-label">Plumbing Topics Mapped</span></div>
</section>`;
}

export function renderDocument(doc, config, photos) {
  const front = doc.front;
  for (const key of ["path", "title", "h1", "description", "intent", "kind", "crumb"]) {
    if (!front[key]) throw new Error(`${doc.filename}: missing ${key}`);
  }
  assignIds(doc.blocks, doc.filename);
  const faqHeading = front.faqHeading || "Questions that change the next step";
  const { intro, rest } = splitIntro(doc.blocks);
  const lead = intro.find((block) => block.type === "p");
  const introRest = intro.filter((block) => block !== lead);
  const hero = front.hero ? renderPhoto({
    base: front.hero,
    alt: front.heroAlt,
    caption: front.heroCaption,
    kind: front.heroKind || "place",
  }, photos, config, true) : "";
  const crumbs = crumbFor(front.path, front.crumb);
  const crumbHtml = crumbs.length ? `<ol class="crumbs">${crumbs.map(([name, href], index) => {
    const last = index === crumbs.length - 1;
    return `<li>${last ? escapeHtml(name) : `<a href="${escapeHtml(href)}">${escapeHtml(name)}</a>`}</li>`;
  }).join("")}</ol>` : "";
  const robots = config.mode === "production" ? "index, follow" : "noindex, nofollow, noarchive";
  const canonical = config.mode === "production" ? `<link rel="canonical" href="https://${escapeHtml(config.domain.hostname)}${escapeHtml(front.path)}">` : "";
  const ogUrl = config.mode === "production" ? `<meta property="og:url" content="https://${escapeHtml(config.domain.hostname)}${escapeHtml(front.path)}">` : "";
  const banner = "";
  const currentNav = primaryNav.find(([, href]) => front.path === href || (href !== "/" && front.path.startsWith(href)))?.[1] || "";
  const isHome = front.path === "/";
  const heroPills = isHome
    ? `<div class="pill-tags hero-pills"><a class="pill-tag" href="/services/drain-cleaning/">Drains &amp; Sewers</a><a class="pill-tag" href="/services/leak-detection/">Leaks &amp; Pipes</a><a class="pill-tag" href="/services/water-heaters/">Water Heaters</a></div>`
    : `<div class="pill-tags hero-pills"><a class="pill-tag" href="/services/">All Services</a><a class="pill-tag" href="/areas/">Service Areas</a><a class="pill-tag" href="/contact/">Call Readiness</a></div>`;
  const article = `<article data-wordcount>
<header class="page-head${hero ? " has-media" : ""}">
  <div class="page-head-copy">
    ${front.eyebrow ? `<p class="eyebrow">${escapeHtml(front.eyebrow)}</p>` : ""}
    <h1>${escapeHtml(front.h1)}</h1>
    ${lead ? `<p class="lead">${inline(lead.text, config)}</p>` : ""}
    ${heroActions(config)}
    ${heroPills}
  </div>
  ${hero}
</header>
${isHome ? tickerStrip() : ""}
${isHome ? homeShowcaseSections(photos, config) : ""}
${renderFlow(introRest, config, photos, faqHeading)}
${toc(rest)}
${renderFlow(rest, config, photos, faqHeading)}
</article>`;
  const ctaBand = `<section class="cta-band">
  <div class="wrap">
    <h2>Ask about this job by phone</h2>
    <p>Have the address and a short description of the problem. The provider sets the price and whether they can take the work.</p>
    <div class="cta-band-actions">${callControl(config, "cta-band-btn")} <a class="cta-outline-link" href="/contact/">What to prepare &rarr;</a></div>
  </div>
</section>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(front.title)}</title>
  <meta name="description" content="${escapeHtml(front.description)}">
  <meta name="robots" content="${robots}">
  ${canonical}
  <meta property="og:title" content="${escapeHtml(front.title)}">
  <meta property="og:description" content="${escapeHtml(front.description)}">
  <meta property="og:type" content="website">
  ${ogUrl}
  <meta name="theme-color" content="#000000">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/assets/site.css">
  <script type="application/ld+json">${jsonLd(doc, config)}</script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  ${banner}
  <header class="site-header">
    <div class="wrap header-inner">
      <a class="brand" href="/">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#5097bc"/><path d="M8 23V12.5h9.5" fill="none" stroke="#ffffff" stroke-width="2.4" stroke-linecap="round"/><path d="M17.5 12.5H23V18" fill="none" stroke="#000000" stroke-width="2.4" stroke-linecap="round"/><circle cx="23" cy="18" r="1.5" fill="#ffffff"/></svg>
        <span><span class="brand-name">${escapeHtml(config.brand.publicName)}</span><span class="brand-note">Plumbing referral · Long Beach</span></span>
      </a>
      ${navHtml(primaryNav, currentNav, "Primary").replace("<nav", `<nav class="desktop-nav"`)}
      <div class="header-call">${headerCall(config)}</div>
      <details class="mobile-nav">
        <summary>Menu</summary>
        ${navHtml(primaryNav, currentNav, "Primary mobile")}
      </details>
    </div>
  </header>
  <main id="main">
    <div class="wrap">
      ${crumbHtml}
      ${subnav(front.path)}
      ${article}
    </div>
  </main>
  ${ctaBand}
  ${footer(config)}
  ${stickyCall(config)}
  <script src="/assets/site.js" defer></script>
</body>
</html>`;
  return html;
}

function footer(config) {
  const col = (title, items) => `<div><h2>${title}</h2><ul>${items.map(([name, href]) => `<li><a href="${href}">${escapeHtml(name)}</a></li>`).join("")}</ul></div>`;
  return `<footer class="site-footer">
    <div class="wrap footer-grid">
      <div>
        <h2>${escapeHtml(config.brand.publicName)}</h2>
        <p>An independent referral service for plumbing questions in Long Beach. Not a plumbing contractor, and not a city department.</p>
      </div>
      ${col("Services", services)}
      ${col("Long Beach", districts)}
      ${col("More", [["Nearby cities", "/areas/"], ["Guides", "/plumbing-guides/"], ["How referrals work", "/how-referrals-work/"], ["About", "/about/"], ["Contact", "/contact/"], ["Privacy", "/privacy/"]])}
    </div>
    <div class="wrap legal">
      <p>We are an independent referral service, not a plumbing contractor. Calls may be connected to third-party service providers. Availability, pricing, licensing, and service terms are determined by the receiving provider. You would contract with and pay that provider directly.</p>
      <p>© 2026 ${escapeHtml(config.brand.publicName)}. Original text and diagrams are prepared for this referral site. Photographs keep the licenses named beside them. ${config.mode === "preview" ? "Setup note: this private preview has no referral phone number, answering hours, legal operator name, or domain." : `Operator: ${escapeHtml(config.brand.operatorLegalName)}.`} No reviews are shown because none have been authorized.</p>
    </div>
  </footer>`;
}

export function faqStats(doc) {
  const stats = [];
  const walk = (blocks) => {
    for (const block of blocks) {
      if (block.type === "fence" && block.fence === "faq") {
        for (const faq of parseFaqs(block.raw)) stats.push({ q: faq.q, words: words(faq.a).length, answer: faq.a });
      }
    }
  };
  walk(doc.blocks);
  return stats;
}

export function collectParagraphs(doc, config) {
  const mode = config.mode === "production" ? "production" : "preview";
  const paras = [];
  const walk = (blocks) => {
    for (const block of blocks) {
      if (block.type === "p") paras.push(block.text);
      if (block.type === "fence" && ["context", "local", "conditional", "note"].includes(block.fence)) {
        const raw = block.raw.split("\n").filter((line) => !line.startsWith("Heading:")).join("\n");
        walk(parseBlocks(raw, doc.filename));
      }
      if (block.type === "fence" && block.fence === "if-preview" && mode === "preview") walk(parseBlocks(block.raw, doc.filename));
      if (block.type === "fence" && block.fence === "if-production" && mode === "production") walk(parseBlocks(block.raw, doc.filename));
      if (block.type === "fence" && block.fence === "faq") {
        for (const faq of parseFaqs(block.raw)) paras.push(faq.a);
      }
    }
  };
  walk(doc.blocks);
  return paras.map((text) => words(fillTokens(text, config)).join(" "));
}

export { paragraphHtml, services, districts, cities };
