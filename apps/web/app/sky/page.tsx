import Link from 'next/link';
import type { Metadata } from 'next';
import { chartAt, detectAspects, rankAspects } from '@starcharts/astro-core';
import Crumbs from '../../components/Crumbs';
import AdSlot from '../../components/ads/AdSlot';
import { ASPECT_SYMBOL, PLANET_GLYPH, T, canonicalAspectSlug, displayName } from '../../lib/content';
import { composeAspectTeaser } from '../../lib/compose';

export const revalidate = 3600; // hourly; positions and orbs shift through the day

export const metadata: Metadata = {
  title: "The sky today: today's aspect reading",
  description:
    "The strongest planetary aspects in orb right now, ranked and explained, computed live from a real ephemeris.",
};

const TOP_N = 5;

export default function SkyToday() {
  const now = new Date();
  const today = rankAspects(detectAspects(chartAt(now))).slice(0, TOP_N);

  return (
    <div className="prose">
      <Crumbs items={[{ label: 'Clock', href: '/' }, { label: 'The sky today' }]} />
      <AdSlot slot="mobile-anchor" template="sky" />
      <h1>The sky today</h1>
      <p className="lede">
        A reading of what stands out in the sky right now, the tightest and most significant aspects currently
        in orb, ranked strongest first.
      </p>
      <AdSlot slot="content-sidebar" template="sky" />

      {today.length === 0 ? (
        <p>No major aspects are in tight orb right now. Watch the sky change on the <Link href="/">live clock</Link>.</p>
      ) : (
        today.map((a) => (
          <p key={`${a.a}-${a.type}-${a.b}`}>
            <Link href={`/aspects/${canonicalAspectSlug(a.a, a.type, a.b)}`}>
              <span className="glyph">{T(PLANET_GLYPH[a.a])} {T(ASPECT_SYMBOL[a.type])} {T(PLANET_GLYPH[a.b])}</span>{' '}
              {displayName(a.a)} {a.type} {displayName(a.b)}
            </Link>{' '}
            <span className="muted">(orb {a.orb.toFixed(1)}°{a.applying ? ', applying' : ''})</span>
            <br />
            {composeAspectTeaser(a.a, a.type, a.b)}
          </p>
        ))
      )}

      <p className="muted">
        Watch these move live on the <Link href="/">clock</Link>, or check the Moon&rsquo;s{' '}
        <Link href="/planets/moon">phase and void-of-course windows</Link>.
      </p>

      <AdSlot slot="sky-below-fold" template="sky" />
    </div>
  );
}
