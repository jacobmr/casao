export const metadata = {
  title: 'Casa Vistas',
  description: 'A beautiful vacation home with direct booking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, sans-serif', margin: 0 }}>
        <header style={{ padding: '16px 24px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <strong>Casa Vistas</strong>
          </a>
          <a href="/" style={{ textDecoration: 'none' }}>Home</a>
        </header>
        <main style={{ padding: '24px', maxWidth: 1000, margin: '0 auto' }}>{children}</main>
        <footer style={{ padding: '24px', borderTop: '1px solid #eee', textAlign: 'center' }}>
          © {new Date().getFullYear()} Casa Vistas
        </footer>
      </body>
    </html>
  );
}
