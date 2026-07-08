import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ASPECT_TYPES, longitudeAt, separation } from '@starcharts/astro-core';
import type { AspectType } from '@starcharts/astro-core';
import LiveAspectStatus from '../../../components/LiveAspectStatus';
import {
  ASPECT_SYMBOL, MEANING_LONG, ARCHETYPE, PLANET_GLYPH, T,
  displayName, parseAspectSlug, pairText, planetPath, nextExactDates, fmtDay,
} from '../../../lib/content';

// Rendered on first request, cached for a day (325 pair pages + 5 hubs).
export const revalidate = 86400;
export function generateStaticParams() {
  return []; // on-demand ISR keeps builds fast; sitemap lists every slug
}

const TYPES = Object.keys(ASPECT_TYPES) as AspectType[];
const isTypeHub = (slug: string): slug is AspectType => (TYPES as string[]).includes(slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (isTypeHub(slug)) {
    const t = ASPECT_TYPES[slug];
    return {
      title: `${slug[0].toUpperCase() + slug.slice(1)}: the ${t.angle}° aspect`,
      description: MEANING_LONG[slug],
    };
  }
  const parsed = parseAspectSlug(slug);
  if (!parsed) return {};
  return {
    title: `${displayName(parsed.a)} ${parsed.type} ${displayName(parsed.b)}: meaning and dates`,
    description: `${pairText(parsed.a, parsed.type, parsed.b)}. What this aspect means and when it happens next.`,
  };
}

export default async function AspectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  /* ----- type hub: /aspects/trine ----- */
  if (isTypeHub(slug)) {
    const def = ASPECT_TYPES[slug];
    return (
      <div className="prose">
        <h1><span className="glyph">{T(ASPECT_SYMBOL[slug])}</span> The {slug}: {def.angle}°</h1>
        <p className="lede">{MEANING_LONG[slug]}</p>
        <p>
          Starcharts draws {slug}s on the <Link href="/">live clock</Link> whenever two points sit within {def.orb}°
          of the exact angle. That margin is called the orb, and the tighter it is, the stronger the aspect reads.
        </p>
        <p className="muted">
          Tradition and interpretation, not prediction. See also the other <Link href="/aspects">major aspects</Link>.
        </p>
      </div>
    );
  }

  /* ----- pair page: /aspects/mars-trine-pluto ----- */
  const parsed = parseAspectSlug(slug);
  if (!parsed) notFound();
  const { a, type, b } = parsed;
  const def = ASPECT_TYPES[type];

  // Slow-changing, computed server-side and cached (revalidate above);
  // the live "Right now" status is client-computed so it never goes stale.
  const snap = new Date();
  const upcoming = nextExactDates(a, type, b, snap, 730, 4);

  // Server-rendered snapshot for crawlers and pre-hydration paint -
  // regenerated daily by ISR, then upgraded to live in the browser.
  const sepSnap = separation(longitudeAt(a, snap), longitudeAt(b, snap));
  const orbSnap = Math.abs(sepSnap - def.angle);
  const fallback =
    `${displayName(a)} and ${displayName(b)} currently stand about ${sepSnap.toFixed(1)}° apart` +
    (orbSnap <= def.orb
      ? `, inside the ${def.orb}° orb, so this ${type} is active on the clock`
      : `, ${orbSnap.toFixed(1)}° away from an exact ${type}`) + '.';

  return (
    <div className="prose">
      <h1>
        <span className="glyph">{T(PLANET_GLYPH[a])} {T(ASPECT_SYMBOL[type])} {T(PLANET_GLYPH[b])}</span>{' '}
        {displayName(a)} {type} {displayName(b)}
      </h1>
      <p className="lede">{pairText(a, type, b)}.</p>
      <p>
        A {type} holds the two at {def.angle}° apart. Here it joins{' '}
        <Link href={planetPath(a)}>{displayName(a)}</Link> ({ARCHETYPE[a]}) with{' '}
        <Link href={planetPath(b)}>{displayName(b)}</Link> ({ARCHETYPE[b]}). {MEANING_LONG[type]}
      </p>
      <h2>Right now</h2>
      <LiveAspectStatus a={a} type={type} b={b} fallback={fallback} />
      {upcoming.length > 0 && (
        <>
          <h2>Next exact {type}s</h2>
          <table>
            <tbody>
              {upcoming.map((d) => (
                <tr key={d.toISOString()}><td>{fmtDay(d)}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Computed from the ephemeris (UTC), not copied from a table.</p>
        </>
      )}
      <p className="muted">
        In traditional astrology this is interpretation, not fate. More:{' '}
        <Link href={`/aspects/${type}`}>about {type}s</Link> · <Link href="/aspects">all aspects</Link>.
      </p>
    </div>
  );
}
