import type { MetadataRoute } from 'next';
import { SIGNS, POINTS, ASPECT_TYPES } from '@starcharts/astro-core';
import { allAspectSlugs, kebab } from '../lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://starcharts.me';
  return [
    { url: base, changeFrequency: 'hourly', priority: 1 },
    { url: `${base}/aspects`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/signs`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/planets`, changeFrequency: 'monthly', priority: 0.8 },
    ...Object.keys(ASPECT_TYPES).map((t) => ({
      url: `${base}/aspects/${t}`, changeFrequency: 'monthly' as const, priority: 0.7,
    })),
    ...allAspectSlugs().map((slug) => ({
      url: `${base}/aspects/${slug}`, changeFrequency: 'weekly' as const, priority: 0.6,
    })),
    ...SIGNS.map((s) => ({
      url: `${base}/signs/${s.toLowerCase()}`, changeFrequency: 'daily' as const, priority: 0.7,
    })),
    ...POINTS.map((p) => ({
      url: `${base}/planets/${kebab(p)}`,
      changeFrequency: p === 'Moon' ? ('hourly' as const) : ('daily' as const),
      priority: 0.7,
    })),
    // Planet-in-sign pages (D3): 12 points x 12 signs = 144.
    ...POINTS.flatMap((p) =>
      SIGNS.map((s) => ({
        url: `${base}/planets/${kebab(p)}/${s.toLowerCase()}`,
        changeFrequency: 'weekly' as const,
        priority: 0.55,
      })),
    ),
    // Sky-today aspect reading (D4).
    { url: `${base}/sky`, changeFrequency: 'hourly', priority: 0.7 },
    { url: `${base}/about`, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
