import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Girja Enterprise Admin',
  description: 'Girja Enterprise admin panel for managing products, categories, and enquiries.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain antialiased">
        {children}
      </body>
    </html>
  );
}
