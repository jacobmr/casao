import './globals.css';

export const metadata = {
  title: 'Casa Vistas',
  description: 'A beautiful vacation home with direct booking',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
