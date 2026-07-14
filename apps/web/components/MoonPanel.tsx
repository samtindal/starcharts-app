'use client';

/**
 * Live Moon panel for the sky-today surface (D4). All values come from
 * astro-core (moonPhase + voidOfCourse + positionAt), the single source of
 * truth, and are computed IN THE BROWSER so they never go stale between ISR
 * revalidations (same pattern as LiveAspectStatus). A server snapshot renders
 * first for crawlers and pre-hydration paint.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { moonPhase, voidOfCourse, positionAt, SIGNS } from '@starcharts/astro-core';
import { T, PLANET_GLYPH, SIGN_GLYPH, planetInSignPath, fmtUTC } from '../lib/content';
import type { SignName } from '@starcharts/astro-core';

/** Waxing/waning lit-fraction glyph: two elliptical arcs, silver on navy. */
function PhaseGlyph({ illumination, waxing, size = 96 }: { illumination: number; waxing: boolean; size?: number }) {
  const r = size / 2 - 2;
  const c = size / 2;
  const inner = r * (1 - 2 * illumination); // signed terminator radius
  const limbSweep = waxing ? 1 : 0;
  const termSweep = inner > 0 ? limbSweep : 1 - limbSweep;
  const lit = `M ${c} ${c - r} A ${r} ${r} 0 0 ${limbSweep} ${c} ${c + r} A ${Math.abs(inner).toFixed(2)} ${r} 0 0 ${termSweep} ${c} ${c - r} Z`;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} role="img" aria-label="current moon phase">
      <circle cx={c} cy={c} r={r} fill="var(--bg-deep)" stroke="var(--line-faint)" strokeWidth={1} />
      <path d={lit} fill="var(--planet)" opacity={0.92} />
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--line)" strokeWidth={0.8} />
    </svg>
  );
}

function View({ at }: { at: Date }) {
  const phase = moonPhase(at);
  const voc = voidOfCourse(at);
  const moon = positionAt('Moon', at);
  const nextSign: SignName = positionAt('Moon', voc.until).sign;

  return (
    <div className="moon-panel">
      <div className="moon-figure">
        <PhaseGlyph illumination={phase.illumination} waxing={phase.angle < 180} />
      </div>
      <div className="moon-facts">
        <p className="lede" style={{ margin: '0 0 6px' }}>
          {phase.name[0].toUpperCase() + phase.name.slice(1)} Moon, {Math.round(phase.illumination * 100)}% lit
        </p>
        <p style={{ margin: '0 0 6px' }}>
          <span className="glyph">{T(PLANET_GLYPH.Moon)}</span> The Moon is at {Math.floor(moon.degreeInSign)}°{' '}
          <span className="glyph">{T(SIGN_GLYPH[SIGNS.indexOf(moon.sign)])}</span>{' '}
          <Link href={planetInSignPath('Moon', moon.sign)}>{moon.sign}</Link>.
        </p>
        <p className="muted" style={{ margin: '0 0 10px' }}>
          Next new moon {fmtUTC(phase.nextNew)} · next full moon {fmtUTC(phase.nextFull)}
        </p>
        <p className="voc" style={{ margin: 0 }}>
          {voc.isVoid ? (
            <>
              The Moon is <strong>void of course</strong> until it enters {nextSign} at {fmtUTC(voc.until)}.
              {voc.since && <span className="muted"> (void since its last major aspect at {fmtUTC(voc.since)}.)</span>}
            </>
          ) : (
            <>
              The Moon is active in {moon.sign}.
              {voc.since && <> Its next void-of-course period begins {fmtUTC(voc.since)}.</>}
            </>
          )}
        </p>
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 12 }}>
          Void-of-course is measured from the Moon&rsquo;s last major aspect to the ten bodies (Sun through Pluto)
          until it changes sign. Tradition and interpretation, not prediction.
        </p>
      </div>
    </div>
  );
}

export default function MoonPanel({ initialMs }: { initialMs: number }) {
  // Start from the server-provided instant so the pre-hydration markup is
  // deterministic (no mismatch), then upgrade to the live minute after mount.
  const [ms, setMs] = useState(initialMs);
  useEffect(() => {
    setMs(Date.now());
    const id = setInterval(() => setMs(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  return <View at={new Date(ms)} />;
}
