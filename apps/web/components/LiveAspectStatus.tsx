'use client';

/**
 * Live "Right now" status for an aspect pair. The page shell is static and
 * edge-cached (revalidate: 1 day; Cloudflare in front), this component
 * computes the CURRENT separation in the visitor's browser from astro-core,
 * so the live claim is accurate to the minute at zero server cost.
 * Renders a neutral placeholder on the server to stay hydration-safe.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { longitudeAt, separation, ASPECT_TYPES } from '@starcharts/astro-core';
import type { AspectType, PointName } from '@starcharts/astro-core';
import { displayName } from '../lib/content';

export default function LiveAspectStatus({
  a, type, b, fallback,
}: { a: PointName; type: AspectType; b: PointName; fallback: string }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Before hydration (and for anything that doesn't run JS, crawlers
  // included) show the server-computed daily snapshot, real content,
  // refreshed by ISR. After mount it silently upgrades to live.
  if (!now) {
    return (
      <p>
        {fallback} <Link href="/">Watch it move on the live clock</Link>.
      </p>
    );
  }

  const def = ASPECT_TYPES[type];
  const sep = separation(longitudeAt(a, now), longitudeAt(b, now));
  const orbNow = Math.abs(sep - def.angle);
  const inOrb = orbNow <= def.orb;

  return (
    <p>
      {displayName(a)} and {displayName(b)} currently stand {sep.toFixed(1)}° apart
      {inOrb
        ? <>, inside the {def.orb}° orb, so this {type} is <strong>active on the clock right now</strong>.</>
        : <>, {orbNow.toFixed(1)}° away from an exact {type}.</>}{' '}
      <Link href="/">Watch it move on the live clock</Link>.
    </p>
  );
}
