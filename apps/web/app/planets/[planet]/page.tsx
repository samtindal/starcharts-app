import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { POINTS, SIGNS, positionAt, detectAspects, rankAspects, chartAt } from '@starcharts/astro-core';
import { composeAspectTeaser, composePlanetParagraphs } from '../../../lib/compose';
import {
  PLANET_GLYPH, SIGN_GLYPH, PLANET_BLURB, ARCHETYPE, T, kebab, pointFromSlug,
  displayName, signPath, aspectPath, planetInSignPath, DIGNITIES,
} from '../../../lib/content';
import Crumbs from '../../../components/Crumbs';

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
  const involving = rankAspects(detectAspects(chartAt(now)).filter((a) => a.a === p || a.b === p));
  const paragraphs = composePlanetParagraphs(p);
  const dignity = DIGNITIES[p];

  return (
    <div className="prose">
      <Crumbs items={[{ label: 'Planets', href: '/planets' }, { label: displayName(p) }]} />
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
          <p className="muted">{composeAspectTeaser(involving[0].a, involving[0].type, involving[0].b)}</p>
        </>
      )}
      {paragraphs.map((para, idx) => <p key={idx}>{para}</p>)}
      {(dignity.rules.length > 0 || dignity.exaltation) && (
        <>
          <h2>Dignities</h2>
          <p>
            {dignity.rules.length > 0 && (
              <>
                {displayName(p)} traditionally rules{' '}
                {dignity.rules.map((s, i) => (
                  <span key={s}>
                    {i > 0 ? ' and ' : ''}<Link href={signPath(s)}>{s}</Link>
                  </span>
                ))}
                {dignity.modern ? ', a modern assignment (the planet postdates the classical scheme)' : ''}.{' '}
              </>
            )}
            {dignity.exaltation && (
              <>It is exalted in <Link href={signPath(dignity.exaltation)}>{dignity.exaltation}</Link>, its strongest placement by tradition.</>
            )}
          </p>
        </>
      )}
      <h2>{displayName(p)} in each sign</h2>
      <ul className="chip-row">
        {SIGNS.map((sg, i) => (
          <li key={sg}>
            <Link href={planetInSignPath(p, sg)}>
              <span className="glyph">{T(SIGN_GLYPH[i])}</span> {sg}
            </Link>
          </li>
        ))}
      </ul>
      <p className="muted">All <Link href="/planets">planets &amp; points</Link>.</p>
    </div>
  );
}
