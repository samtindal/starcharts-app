import Link from 'next/link';
import type { Metadata } from 'next';
import Crumbs from '../../components/Crumbs';

export const metadata: Metadata = {
  title: 'About',
  description: 'What Starcharts is, how the positions are computed, and how to reach us.',
};

export default function About() {
  return (
    <div className="prose">
      <Crumbs items={[{ label: 'About' }]} />
      <h1>About Starcharts</h1>
      <p className="lede">
        Starcharts is a live astrology clock. The wheel on the home page shows where the Sun, Moon, and planets sit
        right now, and you can drag any of them to travel through time and watch the aspects between them change.
      </p>
      <p>
        Every position comes from a real astronomical ephemeris (the <code>astronomy-engine</code> library), not a
        lookup table or an approximation, geocentric and tropical, accurate to a fraction of a degree. The content
        pages (aspect meanings, signs, planets, planet-in-sign pages, and the daily sky reading) are generated from
        that same engine, so a date shown anywhere on the site is computed, not copied in from elsewhere.
      </p>
      <p>
        The interpretive text throughout the site draws on traditional and modern astrology. It is offered as
        tradition and reflection, not as prediction or fact, and it is not medical, financial, or legal advice.
      </p>
      <h2>Who runs this</h2>
      <p>
        Starcharts is an independent, ad-supported site. It is not affiliated with any astrology school,
        publication, or app. See the <Link href="/privacy">privacy policy</Link> for what data is collected and how
        advertising is handled.
      </p>
      <h2>Contact</h2>
      <p>
        Questions, corrections, or feedback: <a href="mailto:hello@starcharts.me">hello@starcharts.me</a>.
      </p>
    </div>
  );
}
