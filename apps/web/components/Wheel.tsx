'use client';

import { useMemo, useRef, useState, type ReactNode, type PointerEvent } from 'react';
import Link from 'next/link';
import {
  chartAt, detectAspects, rankAspects, dateForLongitude, longitudeAt, norm360, wrapDiff,
  SIGNS, MEAN_MOTION, type PointName, type Aspect, type BodyPosition,
} from '@starcharts/astro-core';
import {
  T, PLANET_GLYPH, SIGN_GLYPH, GLYPH_SIZE, ASPECT_SYMBOL, SIGN_INFO,
  displayName, aspectPath, signPath, MEANING_LONG, fmtUTC, rulerDisplay,
} from '../lib/content';
import { composeAspectTeaser } from '../lib/compose';

const CX = 400, CY = 400;
const pt = (lon: number, r: number): [number, number] => {
  const a = ((180 - lon) * Math.PI) / 180;
  return [CX + r * Math.cos(a), CY + r * Math.sin(a)];
};
const lonFromPointer = (x: number, y: number) =>
  norm360(180 - (Math.atan2(y - CY, x - CX) * 180) / Math.PI);

const ASPECT_STYLE: Record<string, { color: string; dash: string; cls: string }> = {
  conjunction: { color: 'var(--parchment)', dash: '', cls: 'soft' },
  sextile: { color: 'var(--soft)', dash: '2 6', cls: 'soft' },
  square: { color: 'var(--hard)', dash: '', cls: 'hard' },
  trine: { color: 'var(--soft)', dash: '', cls: 'soft' },
  opposition: { color: 'var(--hard)', dash: '8 5', cls: 'hard' },
};

const clampMs = (ms: number) =>
  Math.min(Math.max(ms, Date.UTC(1000, 0, 1)), Date.UTC(3000, 0, 1));

interface Tip { content: ReactNode; x: number; y: number }

export default function Wheel({ initialMs }: { initialMs: number }) {
  const [ms, setMs] = useState(clampMs(initialMs));
  const [tip, setTip] = useState<Tip | null>(null);
  const [dragging, setDragging] = useState<PointName | null>(null);
  const dragDir = useRef<-1 | 0 | 1>(0);
  const raf = useRef<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const date = useMemo(() => new Date(ms), [ms]);
  const chart = useMemo(() => chartAt(date), [date]);
  const aspects = useMemo(() => detectAspects(chart), [chart]);
  // §9: order the list by importance and mark the strongest few for emphasis.
  const ranked = useMemo(() => rankAspects(aspects), [aspects]);
  const topKeys = useMemo(
    () => new Set(ranked.slice(0, 3).map((a) => `${a.a}-${a.type}-${a.b}`)),
    [ranked],
  );

  /* ---------- tooltip helpers ---------- */
  const moveTip = (e: PointerEvent) =>
    setTip((old) => (old ? { ...old, x: e.clientX, y: e.clientY } : old));
  const hideTip = () => setTip(null);

  const showAspectTip = (a: Aspect, e: PointerEvent) =>
    setTip({
      x: e.clientX, y: e.clientY,
      content: (
        <>
          <b>{T(PLANET_GLYPH[a.a])} {displayName(a.a)} {a.type} {displayName(a.b)} {T(PLANET_GLYPH[a.b])}</b>
          {MEANING_LONG[a.type]}
          <br />
          <span className="muted2">orb {a.orb.toFixed(2)}° · exact at {a.angle}°</span>
        </>
      ),
    });

  const showSignTip = (s: number, e: PointerEvent) => {
    const info = SIGN_INFO[SIGNS[s]];
    setTip({
      x: e.clientX, y: e.clientY,
      content: (
        <>
          <b>{T(SIGN_GLYPH[s])} {SIGNS[s]}</b>
          {info.modality} {info.element}, ruled by {rulerDisplay(SIGNS[s])}.
          <br />Sun transits {SIGNS[s]} {info.dates}.
        </>
      ),
    });
  };

  const showPlanetTip = (p: BodyPosition, e: PointerEvent) => {
    if (dragging) return; // never over a live drag
    setTip({
      x: e.clientX, y: e.clientY,
      content: (
        <>
          <b>{T(PLANET_GLYPH[p.body])} {displayName(p.body)}</b>
          {Math.floor(p.degreeInSign)}°{String(Math.round((p.degreeInSign % 1) * 60)).padStart(2, '0')}′ {p.sign}
          {p.retrograde ? ' · retrograde' : ''}
          <br />
          <span className="muted2">drag to travel time, 1° ≈ {describeRate(p.body)}</span>
        </>
      ),
    });
  };

  /* ---------- drag ---------- */
  const onPlanetDown = (body: PointName) => (e: PointerEvent<SVGGElement>) => {
    setDragging(body);
    hideTip(); // owner rule: tooltip must vanish the moment a drag starts
    svgRef.current?.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    if (!dragging || raf.current !== null) return;
    const { clientX, clientY } = e;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const svg = svgRef.current;
      if (!svg || !dragging) return;
      const rect = svg.getBoundingClientRect();
      const x = ((clientX - rect.left) * 800) / rect.width;
      const y = ((clientY - rect.top) * 800) / rect.height;
      const targetLon = lonFromPointer(x, y);
      const curLon = longitudeAt(dragging, new Date(ms));
      const step = wrapDiff(targetLon - curLon);
      const bounded = norm360(curLon + Math.max(-25, Math.min(25, step)));
      const next = clampMs(dateForLongitude(dragging, bounded, new Date(ms), dragDir.current).getTime());
      const d = Math.sign(next - ms) as -1 | 0 | 1;
      if (d !== 0) dragDir.current = d;
      setMs(next);
    });
  };

  const endDrag = () => {
    setDragging(null);
    dragDir.current = 0;
  };

  /* ---------- layout: radial collision nudge ---------- */
  const radius = useMemo(() => {
    const sorted = [...chart].sort((a, b) => a.lon - b.lon);
    const out: Partial<Record<PointName, number>> = {};
    for (let i = 0; i < sorted.length; i++) {
      let r = 272, guard = 0;
      while (
        guard++ < 4 &&
        sorted.some((q, j) => j < i && Math.abs(wrapDiff(q.lon - sorted[i].lon)) < 5.5 && out[q.body] === r)
      ) r -= 30;
      out[sorted[i].body] = r;
    }
    return out;
  }, [chart]);

  return (
    <div>
      <div className="clock-head">
        <div className="dateline">{fmtUTC(date)}</div>
        <div className="hint">drag any planet to travel through time</div>
        <div className="clock-controls">
          <input
            type="datetime-local"
            aria-label="Set date"
            onChange={(e) => e.target.value && setMs(clampMs(new Date(e.target.value + 'Z').getTime()))}
          />
          <button onClick={() => setMs(Date.now())}>⌖ Now</button>
        </div>
      </div>

      <div className="wheel-wrap">
        <svg
          ref={svgRef}
          viewBox="0 0 800 800"
          xmlns="http://www.w3.org/2000/svg"
          onPointerMove={onMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* rhumb cross + rings */}
          {Array.from({ length: 8 }, (_, i) => {
            const [x2, y2] = pt(i * 45, 300);
            return <line key={i} x1={CX} y1={CY} x2={x2} y2={y2} stroke="var(--line-faint)" strokeWidth={i % 2 ? 0.4 : 0.7} opacity={0.5} />;
          })}
          <circle cx={CX} cy={CY} r={3} fill="var(--line-faint)" />
          {[[382, 1.6], [376, 0.6], [318, 1.1], [308, 0.6], [246, 0.5]].map(([r, w]) => (
            <circle key={r} cx={CX} cy={CY} r={r} fill="none" stroke="var(--line)" strokeWidth={w} />
          ))}

          {/* zodiac ring: divisions, glyphs, tooltips, clickthrough */}
          {SIGNS.map((sign, s) => {
            const [x1, y1] = pt(s * 30, 318);
            const [x2, y2] = pt(s * 30, 376);
            const [gx, gy] = pt(s * 30 + 15, 347);
            return (
              <g key={sign}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line)" strokeWidth={1} />
                <text x={gx} y={gy} fill="var(--gold)" fontSize={26} textAnchor="middle" dominantBaseline="central" opacity={0.9} className="glyph">
                  {T(SIGN_GLYPH[s])}
                </text>
                <circle
                  cx={gx} cy={gy} r={24} fill="transparent" className="sign-hit"
                  onPointerEnter={(e) => showSignTip(s, e)}
                  onPointerMove={moveTip}
                  onPointerLeave={hideTip}
                  onClick={() => { window.location.href = signPath(s); }}
                />
              </g>
            );
          })}

          {/* degree ticks */}
          {Array.from({ length: 360 }, (_, d) => {
            const big = d % 10 === 0, mid = d % 5 === 0;
            const [x1, y1] = pt(d, 308);
            const [x2, y2] = pt(d, big ? 296 : mid ? 300 : 304);
            return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke={big ? 'var(--line)' : 'var(--line-faint)'} strokeWidth={big ? 1 : 0.5} />;
          })}

          {/* aspect lines + fat hover/click twins */}
          {aspects.map((a) => {
            const st = ASPECT_STYLE[a.type];
            const pa = chart.find((c) => c.body === a.a)!;
            const pb = chart.find((c) => c.body === a.b)!;
            const [x1, y1] = pt(pa.lon, 240);
            const [x2, y2] = pt(pb.lon, 240);
            const key = `${a.a}-${a.type}-${a.b}`;
            const top = topKeys.has(key);
            return (
              <g key={key}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={st.color} strokeWidth={Math.max(0.6, 2.2 - a.orb / 4) + (top ? 1 : 0)} strokeDasharray={st.dash} opacity={(top ? 0.6 : 0.35) + 0.5 * (1 - a.orb / 8)} />
                <line
                  x1={x1} y1={y1} x2={x2} y2={y2} stroke="transparent" strokeWidth={14} className="asp-hit"
                  onPointerEnter={(e) => showAspectTip(a, e)}
                  onPointerMove={moveTip}
                  onPointerLeave={hideTip}
                  onClick={() => { window.location.href = aspectPath(a); }}
                />
              </g>
            );
          })}

          {/* planets & nodes: draggable, tooltip on hover (vanishes on drag) */}
          {chart.map((p) => {
            const r = radius[p.body] ?? 272;
            const [x, y] = pt(p.lon, r);
            const [tx1, ty1] = pt(p.lon, 246);
            const [tx2, ty2] = pt(p.lon, 238);
            return (
              <g
                key={p.body} className="glyph-drag"
                onPointerDown={onPlanetDown(p.body)}
                onPointerEnter={(e) => showPlanetTip(p, e)}
                onPointerMove={(e) => { if (!dragging) moveTip(e); }}
                onPointerLeave={hideTip}
              >
                <circle cx={x} cy={y} r={20} fill="transparent" />
                <line x1={tx1} y1={ty1} x2={tx2} y2={ty2} stroke="var(--planet)" strokeWidth={1.2} />
                <text
                  x={x} y={y} textAnchor="middle" dominantBaseline="central" className="glyph"
                  fontSize={GLYPH_SIZE[p.body] ?? 24}
                  fill={dragging === p.body ? 'var(--planet-bright)' : 'var(--planet)'}
                  style={{ textShadow: '0 0 8px rgba(174,185,196,.4)' }}
                >
                  {T(PLANET_GLYPH[p.body])}
                </text>
                {p.retrograde && (
                  <text x={x + 15} y={y + 14} fill="var(--line)" fontSize={12} textAnchor="middle">℞</text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* aspect table: ordered by importance (§9), strongest marked; one link
          per row, unique teaser per pair (owner rules) */}
      <section className="aspect-list">
        <h2>Aspects <span className="asp-note">strongest first</span></h2>
        {ranked.map((a) => {
          const st = ASPECT_STYLE[a.type];
          const key = `${a.a}-${a.type}-${a.b}`;
          return (
            <Link key={key} href={aspectPath(a)} className={`asp ${st.cls}${topKeys.has(key) ? ' asp-top' : ''}`}>
              <b>{T(PLANET_GLYPH[a.a])} {T(ASPECT_SYMBOL[a.type])} {T(PLANET_GLYPH[a.b])}</b>{' '}
              {displayName(a.a)} {a.type} {displayName(a.b)}{' '}
              <small>(orb {a.orb.toFixed(1)}°) · {composeAspectTeaser(a.a, a.type, a.b)}</small>
            </Link>
          );
        })}
      </section>

      {tip && (
        <div
          className="tip"
          style={{
            left: Math.min(tip.x + 14, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 275),
            top: tip.y + 14,
          }}
        >
          {tip.content}
        </div>
      )}
    </div>
  );
}

function describeRate(p: PointName): string {
  // MEAN_MOTION is the |deg/day| magnitude for every point (single source of
  // truth in astro-core); invert it for a rough "1° takes about N" phrase.
  const days = 1 / MEAN_MOTION[p];
  if (days < 0.15) return `${Math.round(days * 24)} hours`;
  if (days < 45) return `${days < 2 ? days.toFixed(1) : Math.round(days)} day${days >= 2 ? 's' : ''}`;
  if (days < 400) return `${Math.round(days / 30.4)} months`;
  return `${(days / 365).toFixed(1)} years`;
}
