import Link from 'next/link';
import type { Metadata } from 'next';
import { ASPECT_TYPES } from '@starcharts/astro-core';
import type { AspectType } from '@starcharts/astro-core';
import { ASPECT_SYMBOL, MEANING_LONG } from '../../lib/content';

export const metadata: Metadata = {
  title: 'Aspect meanings',
  description: 'What conjunctions, sextiles, squares, trines, and oppositions mean, and every planet pair that can form them.',
};

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
    </div>
  );
}
