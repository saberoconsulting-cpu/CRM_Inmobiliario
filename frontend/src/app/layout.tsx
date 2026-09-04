// Metadata no necesaria (dashboard). Layout global raíz.
import './globals.css';

export const metadata = {
  title: 'CRM Inmobiliario',
  description: 'Gestión de lotes, planos, clientes y ventas inmobiliarias',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          href="https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
