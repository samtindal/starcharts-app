import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import {
  SIGNS, chartAt, detectAspects, positionAt, signWindows,
} from '@starcharts/astro-core';
import type { SignName } from '@starcharts/astro-core';
import {
  composePlanetInSignParagraphs, composePlanetInSignTeaser,
} from '../../../../lib/compose';
import {
  PLANET_GLYPH, SIGN_GLYPH, ARCHETYPE, SIGN_INFO, T, kebab,
  pointFromSlug, signFromSlug, displayName, planetPath, signPath,
  planetInSignPath, aspectPath, fmtDay, rulerDisplay, TRADITIONAL_RULER,
} from '../../../../lib/content';
import MiniWheel from '../../../../components/MiniWheel';
import Crumbs from '../../../../components/Crumbs';
import AdSlot from '../../../../components/ads/AdSlot';

// On-demand ISR, like the aspect pages: fast builds, sitemap lists all 144.
export const revalidate = 86400;
export function generateStaticParams() {
  return [];
}

export async function generateMetadata(
  { params }: { params: Promise<{ planet: string; sign: string }> },
): Promise<Metadata> {
  const { planet, sign } = await params;
  const p = pointFromSlug(planet);
  const s = signFromSlug(sign);
  if (!p || !s) return {};
  // Layout template appends " | Starcharts", so the "|" separator is honoured.
  return {
    title: `${displayName(p)} in ${s}: meaning and dates`,
    description: composePlanetInSignTeaser(p, s),
    alternates: { canonical: planetInSignPath(p, s) },
  };
}

function describeWindows(current: boolean, windows: { enter: Date | null; exit: Date | null }[], point: string, sign: SignName): string[] {
  const out: string[] = [];
  const name = displayName(point);
  if (windows.length === 0) {
    return [`${name} does not enter ${sign} within the window Starcharts scans ahead.`];
  }
  const [first, ...rest] = windows;
  if (current) {
    out.push(
      `${name} is in ${sign} right now` +
      (first.exit ? `, and moves on around ${fmtDay(first.exit)}.` : ' for an extended, multi-year transit.'),
    );
  } else if (first.enter) {
    out.push(
      `${name} next enters ${sign} around ${fmtDay(first.enter)}` +
      (first.exit ? `, staying until about ${fmtDay(first.exit)}.` : ' for a long transit.'),
    );
  }
  for (const w of rest) {
    if (w.enter) {
      out.push(
        `It returns to ${sign} around ${fmtDay(w.enter)}` +
        (w.exit ? ` (through about ${fmtDay(w.exit)}).` : '.'),
      );
    }
  }
  return out;
}

export default async function PlanetInSignPage(
  { params }: { params: Promise<{ planet: string; sign: string }> },
) {
  const { planet, sign } = await params;
  const p = pointFromSlug(planet);
  const s = signFromSlug(sign);
  if (!p || !s) notFound();

  const now = new Date();
  const info = SIGN_INFO[s];
  const paragraphs = composePlanetInSignParagraphs(p, s);
  const { current, windows } = signWindows(p, SIGNS.indexOf(s), now, 3);
  const whenLines = describeWindows(current, windows, p, s);
  const involving = detectAspects(chartAt(now)).filter((a) => a.a === p || a.b === p).slice(0, 5);
  const pos = positionAt(p, now);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${displayName(p)} in ${s}`,
    about: `${ARCHETYPE[p]} expressed through the sign ${s}`,
    inLanguage: 'en',
    isPartOf: { '@type': 'WebSite', name: 'Starcharts', url: 'https://starcharts.me' },
  };

  const ruler = TRADITIONAL_RULER(s);

  return (
    <div className="prose">
      <Crumbs items={[
        { label: 'Planets', href: '/planets' },
        { label: displayName(p), href: planetPath(p) },
        { label: `in ${s}` },
      ]}
      />
      <AdSlot slot="mobile-anchor" template="planet-in-sign" />

      <h1>
        <span className="glyph">{T(PLANET_GLYPH[p])}</span> {displayName(p)} in{' '}
        <span className="glyph">{T(SIGN_GLYPH[SIGNS.indexOf(s)])}</span> {s}
      </h1>
      <p className="lede">{paragraphs[0]}</p>

      <MiniWheel point={p} sign={s} />

      <p>
        {s} is the {info.modality.toLowerCase()} {info.element.toLowerCase()} sign, ruled by{' '}
        <Link href={planetPath(ruler)}>{rulerDisplay(s)}</Link>. Its keynote is {info.keywords}. Placed here,{' '}
        <Link href={planetPath(p)}>{displayName(p)}</Link> ({ARCHETYPE[p]}) takes on that colouring, so read the
        two together on the <Link href={signPath(s)}>{s}</Link> arc of the wheel.
      </p>

      {paragraphs.slice(1).map((para, i) => (
        <p key={i}>{para}</p>
      ))}

      <AdSlot slot="content-in-article" template="planet-in-sign" />
      <AdSlot slot="content-sidebar" template="planet-in-sign" />

      <h2>When {displayName(p)} is in {s}</h2>
      {whenLines.map((line, i) => (
        <p key={i} className={i === 0 ? undefined : 'muted'}>{line}</p>
      ))}
      <p className="muted">Dates computed from the ephemeris (UTC), not copied from a table.</p>

      {current && (
        <p>
          Right now {displayName(p)} stands at {Math.floor(pos.degreeInSign)}° {s}
          {pos.retrograde ? ', moving retrograde' : ''}. Watch it move on the{' '}
          <Link href="/">live clock</Link>.
        </p>
      )}

      {involving.length > 0 && (
        <>
          <h2>{displayName(p)}&rsquo;s aspects today</h2>
          <table><tbody>
            {involving.map((a) => (
              <tr key={`${a.a}-${a.type}-${a.b}`}>
                <td><Link href={aspectPath(a)}>{displayName(a.a)} {a.type} {displayName(a.b)}</Link></td>
                <td className="muted">orb {a.orb.toFixed(1)}°</td>
              </tr>
            ))}
          </tbody></table>
        </>
      )}

      <AdSlot slot="content-in-content-3" template="planet-in-sign" />

      <h2>{displayName(p)} through the other signs</h2>
      <ul className="chip-row">
        {SIGNS.filter((x) => x !== s).map((x) => (
          <li key={x}>
            <Link href={planetInSignPath(p, x)}>
              <span className="glyph">{T(SIGN_GLYPH[SIGNS.indexOf(x)])}</span> {x}
            </Link>
          </li>
        ))}
      </ul>

      <p className="muted">
        Tradition and interpretation, not prediction. See <Link href={planetPath(p)}>{displayName(p)}</Link> or the{' '}
        <Link href={signPath(s)}>sign of {s}</Link>.
      </p>

      <AdSlot slot="content-footer" template="planet-in-sign" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </div>
  );
}
