import type { Metadata } from 'next';
import './globals.css';
import Providers from './providers';

export const metadata: Metadata = {
  title: 'Anishinaabe Connect',
  description: 'Artist-designed wearables for Thunder Bay community gatherings.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans bg-slate-50 text-slate-900">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
