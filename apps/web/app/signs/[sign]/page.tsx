import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SIGNS, chartAt } from '@starcharts/astro-core';
import { SIGN_GLYPH, SIGN_INFO, signFromSlug, displayName, planetPath, T, PLANET_GLYPH } from '../../../lib/content';

export const revalidate = 3600; // "planets in this sign now" stays fresh
export function generateStaticParams() {
  return SIGNS.map((s) => ({ sign: s.toLowerCase() }));
}

export async function generateMetadata({ params }: { params: Promise<{ sign: string }> }): Promise<Metadata> {
  const { sign } = await params;
  const s = signFromSlug(sign);
  if (!s) return {};
  const info = SIGN_INFO[s];
  return {
    title: `${s}: ${info.modality} ${info.element}`,
    description: `${s}: ${info.keywords}. Ruled by ${info.ruler}, Sun transit ${info.dates}.`,
  };
}

export default async function SignPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const s = signFromSlug(sign);
  if (!s) notFound();
  const i = SIGNS.indexOf(s);
  const info = SIGN_INFO[s];
  const residents = chartAt(new Date()).filter((p) => p.sign === s);

  return (
    <div className="prose">
      <h1><span className="glyph">{T(SIGN_GLYPH[i])}</span> {s}</h1>
      <p className="lede">{info.keywords[0].toUpperCase() + info.keywords.slice(1)}.</p>
      <p>
        {s} is the {info.modality.toLowerCase()} {info.element.toLowerCase()} sign, traditionally ruled by{' '}
        {info.ruler}. The Sun crosses it each year around {info.dates}, the span most people mean when they
        say they &ldquo;are&rdquo; a {s}. On the <Link href="/">clock</Link> it occupies the{' '}
        {i * 30}°–{i * 30 + 30}° arc of the gold ring.
      </p>
      <h2>In {s} right now</h2>
      {residents.length === 0 ? (
        <p>No planets are passing through {s} at the moment. The ring waits empty.</p>
      ) : (
        <table><tbody>
          {residents.map((p) => (
            <tr key={p.body}>
              <td><span className="glyph">{T(PLANET_GLYPH[p.body])}</span> <Link href={planetPath(p.body)}>{displayName(p.body)}</Link></td>
              <td>{Math.floor(p.degreeInSign)}° {s}{p.retrograde ? ' ℞' : ''}</td>
            </tr>
          ))}
        </tbody></table>
      )}
      <p className="muted">See all <Link href="/signs">twelve signs</Link>, or watch them turn on the <Link href="/">live clock</Link>.</p>
    </div>
  );
}
