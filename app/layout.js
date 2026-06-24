import './globals.css';

export const metadata = {
  title: 'VitalCore',
  description: 'Suplementos de precisión para rendimiento deportivo.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
