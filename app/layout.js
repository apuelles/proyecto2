import './globals.css';

export const metadata = {
  title: 'VitalCore',
  description: 'Suplementos de precision para rendimiento deportivo.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
