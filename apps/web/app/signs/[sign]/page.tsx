import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { SIGNS, POINTS, chartAt } from '@starcharts/astro-core';
import { composeSignParagraphs } from '../../../lib/compose';
import {
  SIGN_GLYPH, SIGN_INFO, signFromSlug, displayName, planetPath, planetInSignPath, T, PLANET_GLYPH,
  rulerDisplay, TRADITIONAL_RULER,
} from '../../../lib/content';
import Crumbs from '../../../components/Crumbs';
import AdSlot from '../../../components/ads/AdSlot';

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
    description: `${s}: ${info.keywords}. Ruled by ${rulerDisplay(s)}, Sun transit ${info.dates}.`,
  };
}

export default async function SignPage({ params }: { params: Promise<{ sign: string }> }) {
  const { sign } = await params;
  const s = signFromSlug(sign);
  if (!s) notFound();
  const i = SIGNS.indexOf(s);
  const info = SIGN_INFO[s];
  const residents = chartAt(new Date()).filter((p) => p.sign === s);
  const paragraphs = composeSignParagraphs(s);
  const ruler = TRADITIONAL_RULER(s);

  return (
    <div className="prose">
      <Crumbs items={[{ label: 'Signs', href: '/signs' }, { label: s }]} />
      <AdSlot slot="mobile-anchor" template="sign" />
      <h1><span className="glyph">{T(SIGN_GLYPH[i])}</span> {s}</h1>
      <p className="lede">{info.keywords[0].toUpperCase() + info.keywords.slice(1)}.</p>
      <p>
        The Sun crosses {s} each year around {info.dates}, the span most people mean when they say they
        &ldquo;are&rdquo; a {s}. On the <Link href="/">clock</Link> it occupies the {i * 30}°–{i * 30 + 30}°
        arc of the gold ring, traditionally ruled by{' '}
        <Link href={planetPath(ruler)}>{rulerDisplay(s)}</Link>.
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
      {paragraphs.map((para, idx) => <p key={idx}>{para}</p>)}

      <AdSlot slot="content-in-article" template="sign" />
      <AdSlot slot="content-sidebar" template="sign" />

      <h2>The planets in {s}</h2>
      <ul className="chip-row">
        {POINTS.map((pt) => (
          <li key={pt}>
            <Link href={planetInSignPath(pt, s)}>
              <span className="glyph">{T(PLANET_GLYPH[pt])}</span> {displayName(pt)} in {s}
            </Link>
          </li>
        ))}
      </ul>
      <p className="muted">See all <Link href="/signs">twelve signs</Link>, or watch them turn on the <Link href="/">live clock</Link>.</p>

      <AdSlot slot="content-footer" template="sign" />
    </div>
  );
}
