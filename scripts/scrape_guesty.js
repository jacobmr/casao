#!/usr/bin/env node
// Scrape a Guesty booking page: download images and extract text into markdown
// Usage: node scripts/scrape_guesty.js --url <url> [--out content]

const fs = require('fs');
const path = require('path');
const { load } = require('cheerio');
const sanitize = require('sanitize-filename');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { url: null, outDir: 'content' };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--url' && args[i + 1]) {
      out.url = args[++i];
    } else if (args[i] === '--out' && args[i + 1]) {
      out.outDir = args[++i];
    }
  }
  if (!out.url) {
    console.error('Error: --url is required');
    process.exit(1);
  }
  return out;
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function slugify(input) {
  const s = input
    .toLowerCase()
    .replace(/https?:\/\//, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return s || 'property';
}

function unique(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function resolveUrl(base, maybe) {
  try {
    if (!maybe) return null;
    if (maybe.startsWith('//')) return 'https:' + maybe;
    return new URL(maybe, base).toString();
  } catch (e) {
    return null;
  }
}

async function downloadTo(url, filePath) {
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  fs.writeFileSync(filePath, Buffer.from(arrayBuffer));
}

function extractMeta($) {
  const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim();
  const desc =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    $('[data-testid*="description"], .description, #description').first().text().trim();
  const ld = $('script[type="application/ld+json"]').map((_, el) => $(el).text()).get();
  return { title: title || 'Untitled Property', description: desc || '', ldjson: ld };
}

function extractAllText($) {
  // Heuristic: collect key blocks if present, else full body text
  const blocks = [];
  const selectors = [
    '[data-testid*="description"]',
    '[class*="description"]',
    '#description',
    '[data-testid*="amenities"]',
    '[class*="amenit"]',
    '[data-testid*="location"]',
  ];
  for (const sel of selectors) {
    $(sel).each((_, el) => {
      const t = $(el).text().trim();
      if (t && !blocks.includes(t)) blocks.push(t);
    });
  }
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
  const combined = unique([...blocks, bodyText]).join('\n\n');
  return combined;
}

function extractImageUrls($, baseUrl) {
  const urls = [];
  $('img[src]').each((_, el) => {
    urls.push(resolveUrl(baseUrl, $(el).attr('src')));
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach(part => {
        const u = part.trim().split(' ')[0];
        urls.push(resolveUrl(baseUrl, u));
      });
    }
  });
  $('source[srcset]').each((_, el) => {
    const srcset = $(el).attr('srcset');
    if (srcset) {
      srcset.split(',').forEach(part => {
        const u = part.trim().split(' ')[0];
        urls.push(resolveUrl(baseUrl, u));
      });
    }
  });
  // Also look for JSON with images fields
  $('script').each((_, el) => {
    const txt = $(el).text();
    if (!txt) return;
    try {
      if (txt.includes('images') && /\{[\s\S]*\}/.test(txt)) {
        const matches = txt.match(/https?:[^"'\s)]+\.(?:jpg|jpeg|png|webp)/gi);
        if (matches) urls.push(...matches.map(u => resolveUrl(baseUrl, u)));
      }
    } catch {}
  });
  return unique(urls);
}

function toFrontmatter(obj) {
  const yamlEscape = (v) => String(v).replace(/"/g, '\\"');
  const lines = ['---'];
  for (const [k, v] of Object.entries(obj)) {
    if (Array.isArray(v)) {
      lines.push(`${k}:`);
      v.forEach(item => lines.push(`  - "${yamlEscape(item)}"`));
    } else {
      lines.push(`${k}: "${yamlEscape(v)}"`);
    }
  }
  lines.push('---');
  return lines.join('\n');
}

async function main() {
  const { url, outDir } = parseArgs();
  const urlObj = new URL(url);
  const base = urlObj.origin;
  const slug = slugify(urlObj.pathname.split('/').filter(Boolean).join('-'));

  const outBase = path.join(outDir);
  const propDir = path.join(outBase, 'properties');
  const imgDir = path.join(outBase, 'images', slug);
  const rawDir = path.join(outBase, 'raw');
  ensureDir(propDir);
  ensureDir(imgDir);
  ensureDir(rawDir);

  console.log(`Fetching: ${url}`);
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to fetch page: ${res.status}`);
  const html = await res.text();

  const rawFile = path.join(rawDir, `${slug}.html`);
  fs.writeFileSync(rawFile, html);
  console.log(`Saved raw HTML: ${path.relative(process.cwd(), rawFile)}`);

  const $ = load(html);
  const meta = extractMeta($);
  const text = extractAllText($);
  const imageUrls = extractImageUrls($, base);

  console.log(`Found ${imageUrls.length} image URLs`);
  const savedImages = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const u = imageUrls[i];
    if (!u) continue;
    const extGuess = path.extname(new URL(u).pathname).split('?')[0] || '.jpg';
    const filenameBase = `${String(i + 1).padStart(3, '0')}`;
    const filename = sanitize(`${filenameBase}${extGuess}`);
    const outPath = path.join(imgDir, filename);
    try {
      await downloadTo(u, outPath);
      savedImages.push(path.relative(outBase, outPath));
      process.stdout.write('.');
    } catch (e) {
      console.warn(`\nSkip image: ${u} -> ${e.message}`);
    }
  }
  if (imageUrls.length) process.stdout.write('\n');

  const frontmatter = {
    title: meta.title,
    slug,
    source_url: url,
    scraped_at: new Date().toISOString(),
    images: savedImages,
  };
  const mdFile = path.join(propDir, `${slug}.md`);
  const md = `${toFrontmatter(frontmatter)}\n\n${meta.description ? meta.description + '\n\n' : ''}${text}`;
  fs.writeFileSync(mdFile, md);
  console.log(`Saved markdown: ${path.relative(process.cwd(), mdFile)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

