import { describe, it, expect } from 'vitest';
import {
  POINTS, SIGNS, ASPECT_TYPES,
  composeAspectParagraphs, composeAspectTeaser,
  composePlanetInSignParagraphs,
  composeSignParagraphs, composePlanetParagraphs,
} from '../src/index.js';
import type { PointName, AspectType, SignName } from '../src/index.js';

const TYPES = Object.keys(ASPECT_TYPES) as AspectType[];
const isNode = (p: PointName) => p === 'NorthNode' || p === 'SouthNode';

/** Every canonical aspect page: POINTS-ordered pairs x 5 types, minus node-node. */
function allAspectTriples(): [PointName, AspectType, PointName][] {
  const out: [PointName, AspectType, PointName][] = [];
  for (let i = 0; i < POINTS.length; i++)
    for (let j = i + 1; j < POINTS.length; j++) {
      if (isNode(POINTS[i]) && isNode(POINTS[j])) continue;
      for (const t of TYPES) out.push([POINTS[i], t, POINTS[j]]);
    }
  return out;
}

const NO_EM_DASH = /—/;
const DOUBLE_SPACE = / {2}/;

describe('interpret: aspect pages', () => {
  const triples = allAspectTriples();

  it('covers exactly the 325 canonical aspect pages', () => {
    expect(triples.length).toBe(325);
  });

  it('every opener is unique (no two pages share a teaser)', () => {
    const seen = new Map<string, string>();
    for (const [a, t, b] of triples) {
      const teaser = composeAspectTeaser(a, t, b);
      const dup = seen.get(teaser);
      expect(dup, `duplicate opener: ${a}-${t}-${b} == ${dup}`).toBeUndefined();
      seen.set(teaser, `${a}-${t}-${b}`);
    }
    expect(seen.size).toBe(325);
  });

  it('each aspect type draws on more than one opener template', () => {
    for (const t of TYPES) {
      const openers = new Set(
        triples.filter(([, tt]) => tt === t).map(([a, , b]) => composeAspectTeaser(a, t, b)),
      );
      // distinct openers should reflect real template variety, not one string
      expect(openers.size, `type ${t} looks templated`).toBeGreaterThan(1);
    }
  });

  it('pages are deep: >= 4 paragraphs (5 for non-node), substantial length', () => {
    for (const [a, t, b] of triples) {
      const paras = composeAspectParagraphs(a, t, b);
      const expectMin = isNode(a) || isNode(b) ? 4 : 5;
      expect(paras.length, `${a}-${t}-${b}`).toBe(expectMin);
      const full = paras.join(' ');
      expect(full.length, `too thin: ${a}-${t}-${b}`).toBeGreaterThan(400);
    }
  });

  it('every paragraph is clean prose (no em dash, no double space, ends with a period)', () => {
    for (const [a, t, b] of triples) {
      for (const p of composeAspectParagraphs(a, t, b)) {
        expect(p, `em dash in ${a}-${t}-${b}`).not.toMatch(NO_EM_DASH);
        expect(p, `double space in ${a}-${t}-${b}`).not.toMatch(DOUBLE_SPACE);
        expect(p.trim().endsWith('.'), `no end stop: ${a}-${t}-${b}: ${p}`).toBe(true);
        expect(p.length).toBeGreaterThan(0);
      }
    }
  });

  it('is deterministic (same input, same output)', () => {
    for (const [a, t, b] of triples.slice(0, 40)) {
      expect(composeAspectParagraphs(a, t, b)).toEqual(composeAspectParagraphs(a, t, b));
    }
  });
});

describe('interpret: planet-in-sign pages', () => {
  const pairs: [PointName, SignName][] = [];
  for (const p of POINTS) for (const s of SIGNS) pairs.push([p, s]);

  it('covers 144 planet-in-sign pages (12 points x 12 signs)', () => {
    expect(pairs.length).toBe(144);
  });

  it('every full text is unique', () => {
    const seen = new Set<string>();
    for (const [p, s] of pairs) seen.add(composePlanetInSignParagraphs(p, s).join(' '));
    expect(seen.size).toBe(144);
  });

  it('is deep (3 paragraphs) and clean (no em dash, ends with a period)', () => {
    for (const [p, s] of pairs) {
      const paras = composePlanetInSignParagraphs(p, s);
      expect(paras.length).toBe(3);
      for (const par of paras) {
        expect(par, `em dash in ${p}-${s}`).not.toMatch(NO_EM_DASH);
        expect(par.trim().endsWith('.')).toBe(true);
      }
      expect(paras.join(' ').length).toBeGreaterThan(180);
    }
  });
});

describe('interpret: sign pages (D5)', () => {
  it('all 12 sign texts are unique, deep (3 paragraphs), and clean', () => {
    const seen = new Set<string>();
    for (const s of SIGNS) {
      const paras = composeSignParagraphs(s);
      expect(paras.length).toBe(3);
      for (const par of paras) {
        expect(par, `em dash in ${s}`).not.toMatch(NO_EM_DASH);
        expect(par, `double space in ${s}`).not.toMatch(DOUBLE_SPACE);
        expect(par.trim().endsWith('.'), `no end stop: ${s}: ${par}`).toBe(true);
      }
      expect(paras.join(' ').length, `too thin: ${s}`).toBeGreaterThan(250);
      seen.add(paras.join(' '));
    }
    expect(seen.size).toBe(12);
  });

  it('is deterministic', () => {
    for (const s of SIGNS) expect(composeSignParagraphs(s)).toEqual(composeSignParagraphs(s));
  });
});

describe('interpret: planet/point pages (D5)', () => {
  it('all 12 point texts are unique, deep (3 paragraphs), and clean', () => {
    const seen = new Set<string>();
    for (const p of POINTS) {
      const paras = composePlanetParagraphs(p);
      expect(paras.length).toBe(3);
      for (const par of paras) {
        expect(par, `em dash in ${p}`).not.toMatch(NO_EM_DASH);
        expect(par, `double space in ${p}`).not.toMatch(DOUBLE_SPACE);
        expect(par.trim().endsWith('.'), `no end stop: ${p}: ${par}`).toBe(true);
      }
      expect(paras.join(' ').length, `too thin: ${p}`).toBeGreaterThan(250);
      seen.add(paras.join(' '));
    }
    expect(seen.size).toBe(12);
  });

  it('is deterministic', () => {
    for (const p of POINTS) expect(composePlanetParagraphs(p)).toEqual(composePlanetParagraphs(p));
  });
});
