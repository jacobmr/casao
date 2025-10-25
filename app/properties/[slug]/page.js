import { getProperty, propertySlugs } from '../../../lib/content';

export async function generateStaticParams() {
  const slugs = await propertySlugs();
  return slugs.map((slug) => ({ slug }));
}

export default async function PropertyPage({ params }) {
  const { slug } = params;
  const prop = await getProperty(slug);
  const title = prop.frontmatter.title || slug;
  const images = prop.images;
  const bookingUrl = prop.frontmatter.booking_url || prop.frontmatter.source_url || '#';

  return (
    <div>
      <h1>{title}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
        {images.map((src, i) => (
          <img key={i} src={`/${src.replace(/^content\//, '')}`} alt={`${title} ${i + 1}`} style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 8 }} />
        ))}
      </div>
      <div style={{ marginTop: 24 }} dangerouslySetInnerHTML={{ __html: prop.html }} />
      <div style={{ marginTop: 24 }}>
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" style={{ background: '#111827', color: 'white', padding: '12px 16px', borderRadius: 8, textDecoration: 'none' }}>
          Book Now
        </a>
      </div>
    </div>
  );
}
