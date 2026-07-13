/**
 * Static illustrated mini-wheel for content pages (D3): the zodiac ring with
 * one sign emphasised and a point glyph seated in it. Server-rendered, no drag,
 * no client JS, palette tokens only, so every planet-in-sign page carries a
 * consistent engraving without shipping the full interactive clock 144 times.
 */
import { SIGNS, type PointName, type SignName } from '@starcharts/astro-core';
import { T, PLANET_GLYPH, SIGN_GLYPH, GLYPH_SIZE } from '../lib/content';

const C = 100;
const pt = (lon: number, r: number): [number, number] => {
  const a = ((180 - lon) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const arc = (r: number, a0: number, a1: number) => {
  const [x0, y0] = pt(a0, r);
  const [x1, y1] = pt(a1, r);
  const large = a1 - a0 > 180 ? 1 : 0;
  // atan2 y grows downward in SVG; sweep flag chosen to trace the shorter side.
  return `M ${x0} ${y0} A ${r} ${r} 0 ${large} 0 ${x1} ${y1}`;
};

export default function MiniWheel({ point, sign }: { point: PointName; sign: SignName }) {
  const s = SIGNS.indexOf(sign);
  const mid = s * 30 + 15;
  const [gx, gy] = pt(mid, 60); // sign glyph seat
  const [px, py] = pt(mid, 34); // point glyph, inside the ring

  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" role="img"
      aria-label={`${point} placed in ${sign} on the zodiac ring`}
      style={{ width: 'min(260px, 70vw)', height: 'auto', display: 'block', margin: '8px 0 4px' }}>
      {/* double ring border, astrolabe style */}
      <circle cx={C} cy={C} r={88} fill="none" stroke="var(--line)" strokeWidth={1.4} />
      <circle cx={C} cy={C} r={84} fill="none" stroke="var(--line)" strokeWidth={0.5} />
      <circle cx={C} cy={C} r={46} fill="none" stroke="var(--line-faint)" strokeWidth={0.6} />

      {/* highlighted sign arc */}
      <path d={arc(74, s * 30, s * 30 + 30)} fill="none" stroke="var(--gold)" strokeWidth={2.4} opacity={0.85} />

      {/* sign divisions + glyphs */}
      {SIGNS.map((sg, i) => {
        const [x1, y1] = pt(i * 30, 46);
        const [x2, y2] = pt(i * 30, 84);
        const [sx, sy] = pt(i * 30 + 15, 60);
        return (
          <g key={sg}>
            <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--line-faint)" strokeWidth={0.6} />
            <text x={sx} y={sy} fill="var(--gold)" fontSize={11} textAnchor="middle" dominantBaseline="central"
              opacity={i === s ? 1 : 0.55} className="glyph">{T(SIGN_GLYPH[i])}</text>
          </g>
        );
      })}

      {/* the point, seated in the sign */}
      <line {...lineProps(mid)} stroke="var(--planet)" strokeWidth={1} />
      <text x={px} y={py} fill="var(--planet-bright)" fontSize={(GLYPH_SIZE[point] ?? 24) * 0.7}
        textAnchor="middle" dominantBaseline="central" className="glyph"
        style={{ textShadow: '0 0 6px rgba(174,185,196,.5)' }}>{T(PLANET_GLYPH[point])}</text>
      {/* keep sign glyph on top for the highlighted sector */}
      <text x={gx} y={gy} fill="var(--gold-bright)" fontSize={12} textAnchor="middle" dominantBaseline="central" className="glyph">{T(SIGN_GLYPH[s])}</text>
    </svg>
  );
}

function lineProps(lon: number) {
  const [x1, y1] = pt(lon, 44);
  const [x2, y2] = pt(lon, 40);
  return { x1, y1, x2, y2 };
}
