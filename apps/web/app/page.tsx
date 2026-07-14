import Link from 'next/link';
import Wheel from '../components/Wheel';
import AdSlot from '../components/ads/AdSlot';
import { ASPECT_TYPES } from '@starcharts/astro-core';
import type { AspectType } from '@starcharts/astro-core';
import { ASPECT_SYMBOL, MEANING } from '../lib/content';

export const dynamic = 'force-dynamic'; // the sky is live

const LEGEND_SWATCH: Record<AspectType, string> = {
  conjunction: '2px solid var(--parchment)',
  sextile: '2px dotted var(--soft)',
  square: '2px solid var(--hard)',
  trine: '2px solid var(--soft)',
  opposition: '2px dashed var(--hard)',
};

export default function Home() {
  return (
    <>
      <h1 style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>
        Starcharts: the live astrology clock with draggable planets
      </h1>
      <Wheel initialMs={Date.now()} />
      <aside className="legend">
        <h3>Aspects</h3>
        {(Object.keys(ASPECT_TYPES) as AspectType[]).map((t) => (
          <div className="lg" key={t}>
            <span className="sw" style={{ borderTop: LEGEND_SWATCH[t] }} />
            <span>
              <span className="glyph">{ASPECT_SYMBOL[t]}︎</span>{' '}
              <Link href={`/aspects/${t}`}>{t[0].toUpperCase() + t.slice(1)}</Link>{' '}
              <span className="deg">{ASPECT_TYPES[t].angle}°</span>
              <br />
              {MEANING[t]}
            </span>
          </div>
        ))}
        <p>The tighter the orb, the brighter the line.</p>
      </aside>
      <AdSlot slot="clock-sidebar" template="clock" />
    </>
  );
}
