import Link from 'next/link';
import type { Metadata } from 'next';
import { SIGNS } from '@starcharts/astro-core';
import { SIGN_GLYPH, SIGN_INFO, signPath } from '../../lib/content';

export const metadata: Metadata = {
  title: 'The twelve signs',
  description: 'The zodiac ring of the Starcharts clock: elements, modalities, rulers, and dates for all twelve signs.',
};

export default function SignsIndex() {
  return (
    <div className="prose">
      <h1>The twelve signs</h1>
      <p className="lede">The gold ring of the clock. Every planet is always in one of them.</p>
      <ul className="card-grid">
        {SIGNS.map((s, i) => (
          <li key={s}>
            <Link href={signPath(s)}>
              <span className="glyph">{SIGN_GLYPH[i]}︎</span> <strong>{s}</strong>
              <br />
              <small>{SIGN_INFO[s].modality} {SIGN_INFO[s].element} · {SIGN_INFO[s].dates}</small>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
