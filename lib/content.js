import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function propertyFiles() {
  const dir = path.join(CONTENT_DIR, 'properties');
  return fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
}

export async function listProperties() {
  return propertyFiles().map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, 'properties', file), 'utf8');
    const { data } = matter(raw);
    return {
      slug: path.basename(file, '.md'),
      title: data.title || path.basename(file, '.md'),
    };
  });
}

export async function getProperty(slug) {
  const file = path.join(CONTENT_DIR, 'properties', `${slug}.md`);
  const raw = fs.readFileSync(file, 'utf8');
  const { data, content } = matter(raw);
  const html = marked.parse(content);
  const images = Array.isArray(data.images) ? data.images : [];
  return { frontmatter: data, html, images, slug };
}

export async function propertySlugs() {
  return propertyFiles().map((f) => path.basename(f, '.md'));
}
