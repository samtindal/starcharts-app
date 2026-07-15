import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import type { Metadata } from 'next';
import {
  ASPECT_TYPES, POINTS, orbFor, longitudeAt, separation, positionAt, lastExactAspectDate,
} from '@starcharts/astro-core';
import type { AspectType, PointName } from '@starcharts/astro-core';
import LiveAspectStatus from '../../../components/LiveAspectStatus';
import Crumbs from '../../../components/Crumbs';
import AdSlot from '../../../components/ads/AdSlot';
import {
  ASPECT_SYMBOL, MEANING_LONG, ARCHETYPE, PLANET_GLYPH, T,
  displayName, parseAspectSlug, planetPath, signPath, nextExactDates, fmtDay,
  canonicalAspectSlug, relatedAspects, aspectSlug,
} from '../../../lib/content';
import { composeAspectParagraphs, composeAspectTeaser } from '../../../lib/compose';

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
  const canonical = canonicalAspectSlug(parsed.a, parsed.type, parsed.b);
  return {
    title: `${displayName(parsed.a)} ${parsed.type} ${displayName(parsed.b)}: meaning and dates`,
    description: `${composeAspectTeaser(parsed.a, parsed.type, parsed.b)} What this aspect means and when it happens next.`,
    alternates: { canonical: `/aspects/${canonical}` },
  };
}

export default async function AspectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  /* ----- type hub: /aspects/trine ----- */
  if (isTypeHub(slug)) {
    const def = ASPECT_TYPES[slug];
    const isNode = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';
    const pairs: [PointName, PointName][] = [];
    for (let i = 0; i < POINTS.length; i++) {
      for (let j = i + 1; j < POINTS.length; j++) {
        if (isNode(POINTS[i]) && isNode(POINTS[j])) continue;
        pairs.push([POINTS[i], POINTS[j]]);
      }
    }
    return (
      <div className="prose">
        <Crumbs items={[{ label: 'Aspects', href: '/aspects' }, { label: slug[0].toUpperCase() + slug.slice(1) }]} />
        <h1><span className="glyph">{T(ASPECT_SYMBOL[slug])}</span> The {slug}: {def.angle}°</h1>
        <p className="lede">{MEANING_LONG[slug]}</p>
        <p>
          Starcharts draws {slug}s on the <Link href="/">live clock</Link> whenever two points sit within {def.orb}°
          of the exact angle. That margin is called the orb, and the tighter it is, the stronger the aspect reads.
        </p>
        <h2>Every {slug} ({pairs.length} pairs)</h2>
        <ul className="card-grid">
          {pairs.map(([x, y]) => (
            <li key={`${x}-${y}`}>
              <Link href={`/aspects/${aspectSlug(x, slug, y)}`}>{displayName(x)} {slug} {displayName(y)}</Link>
            </li>
          ))}
        </ul>
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
  const canonical = canonicalAspectSlug(a, type, b);
  if (slug !== canonical) permanentRedirect(`/aspects/${canonical}`);
  const def = ASPECT_TYPES[type];

  // Slow-changing, computed server-side and cached (revalidate above);
  // the live "Right now" status is client-computed so it never goes stale.
  const snap = new Date();
  const upcoming = nextExactDates(a, type, b, snap, 730, 4);
  const past = lastExactAspectDate(a, type, b, snap);

  // Server-rendered snapshot for crawlers and pre-hydration paint -
  // regenerated daily by ISR, then upgraded to live in the browser.
  // Pair-specific orb: luminary pairs carry a wider cutoff (orbFor), the same
  // number the clock uses to draw the line, so the copy never contradicts it.
  const pairOrb = orbFor(type, a, b);
  const sepSnap = separation(longitudeAt(a, snap), longitudeAt(b, snap));
  const orbSnap = Math.abs(sepSnap - def.angle);
  const fallback =
    `${displayName(a)} and ${displayName(b)} currently stand about ${sepSnap.toFixed(1)}° apart` +
    (orbSnap <= pairOrb
      ? `, inside the ${pairOrb}° orb, so this ${type} is active on the clock`
      : `, ${orbSnap.toFixed(1)}° away from an exact ${type}`) + '.';

  const paragraphs = composeAspectParagraphs(a, type, b);
  const signA = positionAt(a, snap).sign;
  const signB = positionAt(b, snap).sign;
  const otherTypes = TYPES.filter((t) => t !== type);
  const related = relatedAspects(a, type, b, 3);

  return (
    <div className="prose">
      <Crumbs items={[
        { label: 'Aspects', href: '/aspects' },
        { label: type[0].toUpperCase() + type.slice(1), href: `/aspects/${type}` },
        { label: `${displayName(a)} ${type} ${displayName(b)}` },
      ]}
      />
      <AdSlot slot="mobile-anchor" template="aspect" />
      <h1>
        <span className="glyph">{T(PLANET_GLYPH[a])} {T(ASPECT_SYMBOL[type])} {T(PLANET_GLYPH[b])}</span>{' '}
        {displayName(a)} {type} {displayName(b)}
      </h1>
      <p className="lede">{paragraphs[0]}</p>
      {paragraphs.slice(1).map((para, i) => <p key={i}>{para}</p>)}

      <AdSlot slot="content-in-article" template="aspect" />
      <AdSlot slot="content-sidebar" template="aspect" />

      <p>
        Here the {type} joins <Link href={planetPath(a)}>{displayName(a)}</Link> ({ARCHETYPE[a]}) with{' '}
        <Link href={planetPath(b)}>{displayName(b)}</Link> ({ARCHETYPE[b]}), held {def.angle}° apart.
      </p>

      <h2>Right now</h2>
      <LiveAspectStatus a={a} type={type} b={b} fallback={fallback} />

      {(past || upcoming.length > 0) && (
        <>
          <h2>When: past and next exact {type}s</h2>
          <table>
            <tbody>
              {past && <tr><td>{fmtDay(past)}</td><td className="muted">most recent</td></tr>}
              {upcoming.map((d) => (
                <tr key={d.toISOString()}><td>{fmtDay(d)}</td><td className="muted">upcoming</td></tr>
              ))}
            </tbody>
          </table>
          <p className="muted">Computed from the ephemeris (UTC), not copied from a table.</p>
        </>
      )}

      <AdSlot slot="content-in-content-3" template="aspect" />

      <h2>More on this pair</h2>
      <ul className="chip-row">
        <li><Link href={`/aspects/${aspectSlug(b, type, a)}`}>{displayName(b)} {type} {displayName(a)}</Link></li>
        {otherTypes.map((t) => (
          <li key={t}>
            <Link href={`/aspects/${canonicalAspectSlug(a, t, b)}`}>
              {displayName(a)} {t} {displayName(b)}
            </Link>
          </li>
        ))}
      </ul>

      <h2>Where these two stand today</h2>
      <ul className="chip-row">
        <li><Link href={signPath(signA)}>{displayName(a)} in {signA}</Link></li>
        <li><Link href={signPath(signB)}>{displayName(b)} in {signB}</Link></li>
      </ul>

      {related.length > 0 && (
        <>
          <h2>Related {type}s</h2>
          <ul className="chip-row">
            {related.map((r) => (
              <li key={`${r.a}-${r.b}`}>
                <Link href={`/aspects/${canonicalAspectSlug(r.a, r.type, r.b)}`}>
                  {displayName(r.a)} {r.type} {displayName(r.b)}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      <p className="muted">
        In traditional astrology this is interpretation, not fate. More:{' '}
        <Link href={`/aspects/${type}`}>about {type}s</Link> · <Link href="/aspects">all aspects</Link>.
      </p>

      <AdSlot slot="content-footer" template="aspect" />
    </div>
  );
}
