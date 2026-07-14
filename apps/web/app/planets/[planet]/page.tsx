import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  POINTS, SIGNS, positionAt, detectAspects, rankAspects, chartAt, voidOfCourse,
} from '@starcharts/astro-core';
import { composeAspectTeaser, composePlanetParagraphs } from '../../../lib/compose';
import {
  PLANET_GLYPH, SIGN_GLYPH, PLANET_BLURB, ARCHETYPE, T, kebab, pointFromSlug,
  displayName, signPath, aspectPath, planetInSignPath, DIGNITIES, fmtUTC,
} from '../../../lib/content';
import Crumbs from '../../../components/Crumbs';
import MoonPanel from '../../../components/MoonPanel';
import AdSlot from '../../../components/ads/AdSlot';

export const revalidate = 3600;
export function generateStaticParams() {
  return POINTS.map((p) => ({ planet: kebab(p) }));
}

export async function generateMetadata({ params }: { params: Promise<{ planet: string }> }): Promise<Metadata> {
  const { planet } = await params;
  const p = pointFromSlug(planet);
  if (!p) return {};
  if (p === 'Moon') {
    return {
      title: 'Moon: instinct and feeling, phase & void-of-course',
      description:
        'The Moon right now: sign, phase, illumination, and whether it is void of course, plus what the Moon means and the next 30 days of void windows. Computed from a real ephemeris.',
    };
  }
  return {
    title: `${displayName(p)}: ${ARCHETYPE[p]}`,
    description: PLANET_BLURB[p],
  };
}

/** Void-of-course periods over the next ~30 days (Moon page only, server-rendered, ISR-fresh). */
function voidCalendar(from: Date) {
  const rows: { since: Date; until: Date; sign: string }[] = [];
  const end = from.getTime() + 30 * 86_400_000;
  let cursor = from;
  for (let guard = 0; guard < 40 && cursor.getTime() < end; guard++) {
    const v = voidOfCourse(cursor);
    if (v.since && v.since.getTime() < v.until.getTime() && v.until.getTime() > from.getTime()) {
      rows.push({ since: v.since, until: v.until, sign: positionAt('Moon', v.until).sign });
    }
    cursor = new Date(v.until.getTime() + 60_000); // step into the next sign
  }
  // Drop duplicates that share an ingress time.
  return rows.filter((r, i) => i === 0 || r.until.getTime() !== rows[i - 1].until.getTime());
}

export default async function PlanetPage({ params }: { params: Promise<{ planet: string }> }) {
  const { planet } = await params;
  const p = pointFromSlug(planet);
  if (!p) notFound();
  const isMoon = p === 'Moon';

  const now = new Date();
  const pos = positionAt(p, now);
  const involving = rankAspects(detectAspects(chartAt(now)).filter((a) => a.a === p || a.b === p));
  const paragraphs = composePlanetParagraphs(p);
  const dignity = DIGNITIES[p];
  const periods = isMoon ? voidCalendar(now) : [];

  return (
    <div className="prose">
      <Crumbs items={[{ label: 'Planets', href: '/planets' }, { label: displayName(p) }]} />
      <h1><span className="glyph">{T(PLANET_GLYPH[p])}</span> {displayName(p)}</h1>
      <p className="lede">{ARCHETYPE[p][0].toUpperCase() + ARCHETYPE[p].slice(1)}.</p>
      <p>{PLANET_BLURB[p]}</p>

      <h2>Right now</h2>
      {isMoon && <MoonPanel initialMs={now.getTime()} />}
      <p>
        {!isMoon && (
          <>
            {displayName(p)} stands at {Math.floor(pos.degreeInSign)}°{' '}
            <Link href={signPath(pos.sign)}>{pos.sign}</Link>
            {pos.retrograde ? ', moving retrograde' : ''}.{' '}
          </>
        )}
        Drag it on the <Link href="/">live clock</Link> to travel through time.
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

      <AdSlot slot="content-in-article" template="planet" />

      {isMoon && (
        <>
          <h2>Moon phase</h2>
          <p>
            The phase is simply how far the Moon has moved ahead of the Sun around the zodiac. At the new moon the two
            sit together and the disc is dark; a quarter turn later the Moon is half lit; opposite the Sun it is full.
            The percentage above is the illuminated fraction, computed from the real geometry, not an approximation.
          </p>
          <p>
            The full cycle from one new moon to the next runs about twenty-nine and a half days, the synodic month.
            Because that is slightly longer than the Moon&rsquo;s roughly twenty-seven-day loop through the twelve
            signs, the phase and the sign drift apart over the year rather than repeating in lockstep, so a full moon
            in one sign will fall in a different sign next month.
          </p>

          <h2>How long does a void-of-course Moon last?</h2>
          <p>
            The Moon is called void of course from the moment it makes its last major aspect (conjunction, sextile,
            square, trine, or opposition) to one of the ten bodies, Sun through Pluto, until it crosses into the next
            sign. Traditionally it is a fallow stretch: a poor time to start something you want to stick, a fine time
            to rest, finish, or let things settle. Starcharts uses the modern ten-body set, and every time shown is UTC.
          </p>
          <p>
            There is no fixed length. Because the Moon can make its last aspect early or late in a sign, a void
            period can run minutes or run most of a day; the calendar below lists the actual computed windows for
            the next thirty days rather than a rule of thumb.
          </p>

          <h3>Void-of-course periods, next 30 days</h3>
          <p className="muted">Each period runs from the Moon&rsquo;s last major aspect until it enters the next sign (UTC).</p>
          <table><tbody>
            {periods.map((r) => (
              <tr key={r.until.toISOString()}>
                <td>{fmtUTC(r.since)}</td>
                <td className="muted">until {fmtUTC(r.until)}</td>
                <td>enters {r.sign}</td>
              </tr>
            ))}
          </tbody></table>

          <h2>Waxing vs waning</h2>
          <p>
            Waxing means the illuminated fraction is growing, from new toward full; waning means it is shrinking,
            from full back toward new. Tradition reads the waxing half as a building, planting phase and the waning
            half as a releasing, finishing one, though this, like the rest of the page, is interpretation rather
            than a claim about outcomes.
          </p>
        </>
      )}

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
      <p className="muted">
        {isMoon && <>Tradition and interpretation, not prediction. </>}
        All <Link href="/planets">planets &amp; points</Link>.
      </p>

      <AdSlot slot="content-footer" template="planet" />
    </div>
  );
}
