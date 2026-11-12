import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Taupō Spring Volleyball 2026', template: '%s · Taupō Spring Volleyball 2026' },
  description: 'Draw, live scores, standings and playoffs for Taupō Spring Volleyball, 14–15 November 2026.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f172a',
};

const NAV = [
  { href: '/', label: 'Now' },
  { href: '/draw/sat', label: 'Sat' },
  { href: '/draw/sun', label: 'Sun' },
  { href: '/division/women', label: 'Women' },
  { href: '/division/social', label: 'Social' },
  { href: '/division/comp', label: 'Comp' },
  { href: '/teams', label: 'Teams' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ">
      <body className="min-h-screen">
        <header className="sticky top-0 z-10 bg-slate-900 text-white shadow">
          <div className="mx-auto max-w-5xl px-4 pt-2">
            <Link href="/" className="block text-base font-bold leading-tight">
              Taupō Spring Volleyball 2026
            </Link>
          </div>
          <nav className="mx-auto max-w-5xl overflow-x-auto px-2 pb-1">
            <ul className="flex gap-1 text-sm whitespace-nowrap">
              {NAV.map((n) => (
                <li key={n.href}>
                  <Link href={n.href} className="inline-block rounded px-2 py-1.5 hover:bg-slate-700">
                    {n.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-xs text-slate-500">
          Run by Taupō Volleyball Club. Scores are entered by TVC and update automatically.{' '}
          <Link href="/admin" className="underline">
            TVC login
          </Link>
        </footer>
      </body>
    </html>
  );
}
