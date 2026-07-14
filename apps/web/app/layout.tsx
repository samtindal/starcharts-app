import type { Metadata } from 'next';
import Link from 'next/link';
import ConsentBanner from '../components/ads/ConsentBanner';
import PrivacyChoicesLink from '../components/ads/PrivacyChoicesLink';
import GA4Bridge from '../components/ads/GA4Bridge';
import ServiceWorkerRegister from '../components/ServiceWorkerRegister';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://starcharts.me'),
  title: { default: 'Starcharts | Astrology Clock', template: '%s | Starcharts' },
  description:
    'A live astrology clock: drag the planets to travel through time and watch the aspects change. Tropical zodiac, real ephemeris.',
  icons: {
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: '/apple-touch-icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link href="/" className="wordmark">
            Starcharts
            <small>Astrology Clock</small>
          </Link>
          <nav className="site-nav">
            <Link href="/sky">Sky today</Link>
            <Link href="/aspects">Aspects</Link>
            <Link href="/signs">Signs</Link>
            <Link href="/planets">Planets</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div>Starcharts, an astrology clock. Positions computed with a real astronomical ephemeris (tropical zodiac, geocentric).</div>
          <nav>
            <Link href="/sky">The sky today</Link>
            <Link href="/aspects">Aspect meanings</Link>
            <Link href="/signs">The twelve signs</Link>
            <Link href="/planets">Planets &amp; points</Link>
            <Link href="/about">About</Link>
            <Link href="/privacy">Privacy</Link>
            <PrivacyChoicesLink />
          </nav>
        </footer>
        <ConsentBanner />
        <GA4Bridge />
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
