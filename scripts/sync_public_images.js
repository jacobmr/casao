#!/usr/bin/env node
// Copy content/images/**/* to public/images/**/* for static serving

const fs = require('fs');
const path = require('path');

function copyDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const entry of fs.readdirSync(src)) {
    const s = path.join(src, entry);
    const d = path.join(dst, entry);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

const src = path.join(process.cwd(), 'content', 'images');
const dst = path.join(process.cwd(), 'public', 'images');
copyDir(src, dst);
console.log('Synced images to public/images');
