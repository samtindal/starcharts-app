import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { POINTS, positionAt, detectAspects, chartAt } from '@starcharts/astro-core';
import {
  PLANET_GLYPH, PLANET_BLURB, ARCHETYPE, T, kebab, pointFromSlug,
  displayName, signPath, aspectPath, pairText,
} from '../../../lib/content';

export const revalidate = 3600;
export function generateStaticParams() {
  return POINTS.map((p) => ({ planet: kebab(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ planet: string }> }): Promise<Metadata> {
  const { planet } = await params;
  const p = pointFromSlug(planet);
  if (!p) return {};
  return {
    title: `${displayName(p)}: ${ARCHETYPE[p]}`,
    description: PLANET_BLURB[p],
  };
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params;
  const p = pointFromSlug(planet);
  if (!p) notFound();

  const now = new Date();
  const pos = positionAt(p, now);
  const involving = detectAspects(chartAt(now)).filter((a) => a.a === p || a.b === p);

  return (
    <div className="prose">
      <h1><span className="glyph">{T(PLANET_GLYPH[p])}</span> {displayName(p)}</h1>
      <p className="lede">{ARCHETYPE[p][0].toUpperCase() + ARCHETYPE[p].slice(1)}.</p>
      <p>{PLANET_BLURB[p]}</p>
      <h2>Right now</h2>
      <p>
        {displayName(p)} stands at {Math.floor(pos.degreeInSign)}°{' '}
        <Link href={signPath(pos.sign)}>{pos.sign}</Link>
        {pos.retrograde ? ', moving retrograde' : ''}. Drag it on the{' '}
        <Link href="/">live clock</Link> to travel through time.
      </p>
      {involving.length > 0 && (
        <>
          <h2>Current aspects</h2>
          <table><tbody>
            {involving.map((a) => (
              <tr key={`${a.a}-${a.type}-${a.b}`}>
                <td>
                  <Link href={aspectPath(a)}>
                    {displayName(a.a)} {a.type} {displayName(a.b)}
                  </Link>
                </td>
                <td className="muted">orb {a.orb.toFixed(1)}°</td>
              </tr>
            ))}
          </tbody></table>
          <p className="muted">{involving.length > 0 && pairText(involving[0].a, involving[0].type, involving[0].b)}.</p>
        </>
      )}
      <p className="muted">All <Link href="/planets">planets &amp; points</Link>.</p>
    </div>
  );
}
