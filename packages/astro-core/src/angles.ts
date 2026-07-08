/** Normalize any angle to [0, 360). */
export function norm360(deg: number): number {
  const d = deg % 360;
  return d < 0 ? d + 360 : d;
}

/** Shortest signed angular difference a→b... wrap (b) into (-180, 180]. */
export function wrapDiff(deg: number): number {
  const d = norm360(deg);
  return d > 180 ? d - 360 : d;
}

/** Unsigned angular separation between two longitudes, in [0, 180]. */
export function separation(lonA: number, lonB: number): number {
  return Math.abs(wrapDiff(lonA - lonB));
}
