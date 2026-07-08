import Link from 'next/link';
import type { Metadata } from 'next';
import { POINTS } from '@starcharts/astro-core';
import { PLANET_GLYPH, PLANET_BLURB, displayName, planetPath, T } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Planets & points',
  description: 'The twelve moving points of the Starcharts clock: Sun through Pluto plus the lunar nodes.',
};

export default function PlanetsIndex() {
  return (
    <div className="prose">
      <h1>Planets &amp; points</h1>
      <p className="lede">The silver travellers of the clock: ten bodies and the two lunar nodes.</p>
      <ul className="card-grid">
        {POINTS.map((p) => (
          <li key={p}>
            <Link href={planetPath(p)}>
              <span className="glyph">{T(PLANET_GLYPH[p])}</span> <strong>{displayName(p)}</strong>
              <br />
              <small>{PLANET_BLURB[p].split(':')[1]?.split('.')[0].trim() ?? PLANET_BLURB[p].split('.')[0]}</small>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
