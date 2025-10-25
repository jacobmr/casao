#!/usr/bin/env node
// Import local images into content/images/<slug> and update markdown frontmatter images list
// Usage: node scripts/import_images.js --src "/path/with spaces" [--slug <slug>] [--content content]

const fs = require('fs');
const path = require('path');

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { src: null, slug: null, contentDir: 'content' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--src' && args[i + 1]) out.src = args[++i];
    else if (a === '--slug' && args[i + 1]) out.slug = args[++i];
    else if (a === '--content' && args[i + 1]) out.contentDir = args[++i];
  }
  if (!out.src) {
    console.error('Error: --src is required');
    process.exit(1);
  }
  return out;
}

function pickSlug(contentDir, provided) {
  if (provided) return provided;
  const propsDir = path.join(contentDir, 'properties');
  if (!fs.existsSync(propsDir)) throw new Error(`No properties dir: ${propsDir}`);
  const mds = fs.readdirSync(propsDir).filter(f => f.endsWith('.md'));
  if (mds.length === 0) throw new Error('No property markdown files found');
  if (mds.length > 1) {
    console.warn(`Multiple markdown files found, defaulting to first: ${mds[0]}. Use --slug to target.`);
  }
  return path.basename(mds[0], '.md');
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function listImages(srcDir) {
  const exts = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
  if (!fs.existsSync(srcDir)) throw new Error(`Source not found: ${srcDir}`);
  const all = fs.readdirSync(srcDir).map(f => path.join(srcDir, f));
  const files = all.filter(p => {
    const st = fs.statSync(p);
    return st.isFile() && exts.has(path.extname(p).toLowerCase());
  });
  return files.sort();
}

function copySequential(files, destDir) {
  ensureDir(destDir);
  const rels = [];
  files.forEach((file, idx) => {
    const ext = path.extname(file).toLowerCase() || '.jpg';
    const name = `${String(idx + 1).padStart(3, '0')}${ext}`;
    const dst = path.join(destDir, name);
    fs.copyFileSync(file, dst);
    rels.push(name);
  });
  return rels;
}

function updateMarkdownImages(contentDir, slug, relNames) {
  const mdPath = path.join(contentDir, 'properties', `${slug}.md`);
  if (!fs.existsSync(mdPath)) throw new Error(`Markdown not found: ${mdPath}`);
  const raw = fs.readFileSync(mdPath, 'utf8');
  const start = raw.indexOf('---');
  if (start !== 0) throw new Error('Frontmatter start not found');
  const end = raw.indexOf('\n---', 3);
  if (end === -1) throw new Error('Frontmatter end not found');
  const fm = raw.slice(0, end + 4);
  const body = raw.slice(end + 4);
  // Remove existing images block (naive but effective)
  const imagesBlockRegex = /\nimages:\n(?:[ \t]*-.*\n)*/i;
  const fmWithoutImages = fm.replace(imagesBlockRegex, '\n');
  const newImages = ['images:', ...relNames.map(n => `  - "images/${slug}/${n}"`)].join('\n');
  const rebuilt = fmWithoutImages.replace(/\n$/, '') + '\n' + newImages + '\n';
  const result = rebuilt + body;
  fs.writeFileSync(mdPath, result);
  return mdPath;
}

function main() {
  const { src, slug: providedSlug, contentDir } = parseArgs();
  const slug = pickSlug(contentDir, providedSlug);
  const srcDir = src;
  const files = listImages(srcDir);
  if (files.length === 0) {
    console.error('No images found to import');
    process.exit(2);
  }
  const destDir = path.join(contentDir, 'images', slug);
  const relNames = copySequential(files, destDir);
  const mdPath = updateMarkdownImages(contentDir, slug, relNames);
  console.log(`Imported ${relNames.length} images to ${destDir}`);
  console.log(`Updated images list in ${mdPath}`);
}

try { main(); } catch (e) { console.error(e.message); process.exit(1); }

