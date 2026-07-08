import Link from 'next/link';
import type { Metadata } from 'next';
import { ASPECT_TYPES, POINTS } from '@starcharts/astro-core';
import type { AspectType, PointName } from '@starcharts/astro-core';
import { ASPECT_SYMBOL, MEANING_LONG, aspectSlug, displayName } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Aspect meanings',
  description: 'What conjunctions, sextiles, squares, trines, and oppositions mean, and every planet pair that can form them.',
};

const isNode = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';

export default function AspectsIndex() {
  const types = Object.keys(ASPECT_TYPES) as AspectType[];
  return (
    <div className="prose">
      <h1>The five major aspects</h1>
      <p className="lede">
        An aspect is an angle between two planets on the wheel. Five angles carry the classical tradition;
        each colours the conversation between the two planets differently.
      </p>
      {types.map((t) => (
        <section key={t}>
          <h2>
            <span className="glyph">{ASPECT_SYMBOL[t]}︎</span>{' '}
            <Link href={`/aspects/${t}`}>{t[0].toUpperCase() + t.slice(1)}</Link>{' '}
            <span className="muted">{ASPECT_TYPES[t].angle}° · orb {ASPECT_TYPES[t].orb}°</span>
          </h2>
          <p>{MEANING_LONG[t]}</p>
        </section>
      ))}
      <h2>Every pair</h2>
      <ul className="card-grid">
        {POINTS.flatMap((a, i) =>
          POINTS.slice(i + 1).map((b) =>
            isNode(a) && isNode(b) ? null : (
              <li key={`${a}-${b}`}>
                <Link href={`/aspects/${aspectSlug(a, 'conjunction', b)}`}>
                  {displayName(a)} × {displayName(b)}
                </Link>
              </li>
            ),
          ),
        )}
      </ul>
    </div>
  );
}
