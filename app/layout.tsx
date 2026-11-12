import type { Metadata, Viewport } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import Link from 'next/link';
import fs from 'node:fs';
import path from 'node:path';
import NavLinks from '@/components/NavLinks';
import './globals.css';

// Fonts are downloaded at build time and served from the site itself (no runtime call to Google).
const barlow = Barlow({ subsets: ['latin'], weight: ['400', '600'], variable: '--font-barlow', display: 'swap' });
const barlowCond = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['600', '800'],
  variable: '--font-barlow-cond',
  display: 'swap',
});

// Club logo: drop the file at public/tvc-logo.png. Until then a text badge is shown.
const HAS_LOGO = fs.existsSync(path.join(process.cwd(), 'public', 'tvc-logo.png'));

export const metadata: Metadata = {
  title: { default: 'Taupō Spring Volleyball 2026', template: '%s · Taupō Spring Volleyball 2026' },
  description: 'Draw, live scores, standings and playoffs for Taupō Spring Volleyball, 14–15 November 2026.',
  icons: HAS_LOGO ? { icon: '/tvc-logo.png', apple: '/tvc-logo.png' } : undefined,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B2559',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-NZ" className={`${barlow.variable} ${barlowCond.variable}`}>
      <body className="min-h-screen">
        <header className="relative overflow-hidden bg-navy text-white">
          {/* decorative ring, echoing a volleyball */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-12 h-56 w-56 rounded-full border-[28px] border-white/[0.06]"
          />
          <div className="relative mx-auto flex max-w-5xl items-center gap-3.5 px-4 py-4">
            <Link href="/" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white" aria-label="Home">
              {HAS_LOGO ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src="/tvc-logo.png" alt="Taupō Volleyball Club" className="h-[82%] w-[82%] object-contain" />
              ) : (
                <span className="heading text-lg text-navy">TVC</span>
              )}
            </Link>
            <div>
              <Link href="/" className="heading block text-[28px] leading-[0.95]">
                Taupō Spring
                <br />
                Volleyball 2026
              </Link>
              <p className="mt-1 text-[13px] text-[#B8C6DC]">14–15 November · Taupō Volleyball Club</p>
            </div>
          </div>
        </header>
        <nav className="sticky top-0 z-10 bg-navy-deep shadow">
          <div className="mx-auto max-w-5xl overflow-x-auto">
            <NavLinks />
          </div>
        </nav>
        <main className="mx-auto max-w-5xl px-4 py-5">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 pb-8 pt-4 text-xs text-ink-muted">
          Run by Taupō Volleyball Club. Scores are entered by TVC and update automatically.{' '}
          <Link href="/admin" className="underline">
            TVC login
          </Link>
        </footer>
      </body>
    </html>
  );
}
