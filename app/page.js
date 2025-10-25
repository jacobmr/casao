import { listProperties } from '../lib/content';

export default async function HomePage() {
  const props = await listProperties();
  return (
    <div>
      <h1>Welcome to Casa Vistas</h1>
      <p>Explore the property and book your stay directly.</p>
      <h2>Property</h2>
      <ul>
        {props.map((p) => (
          <li key={p.slug}>
            <a href={`/properties/${p.slug}`}>{p.title || p.slug}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
