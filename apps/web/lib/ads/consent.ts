// Consent wrapper (adslot-component-spec.md §7, tasks/e4-privacy-policy.md).
// Not an IAB TCF certified CMP by itself: EEA/UK personalized-ad serving
// needs one of those. Owner decision (2026-07-13): use Google's own consent
// tool (Funding Choices, enabled from the AdSense console) rather than a
// third-party vendor. See fundingChoices.ts for that seam. This module is
// the shared consent state both that CMP and the fallback banner read from
// and write to, plus the region-aware default and GPC handling that apply
// regardless of which CMP is active.

import { setConsentModeDefault, updateConsentMode } from './consentMode';

export type ConsentState = { ready: boolean; personalized: boolean };

const STORAGE_KEY = 'starcharts-consent';
type Listener = (c: ConsentState) => void;
const listeners = new Set<Listener>();
const reviewListeners = new Set<() => void>();

function hasGpc(): boolean {
  return typeof navigator !== 'undefined' && (navigator as { globalPrivacyControl?: boolean }).globalPrivacyControl === true;
}

function readStored(): ConsentState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    return typeof parsed.ready === 'boolean' && typeof parsed.personalized === 'boolean' ? parsed : null;
  } catch {
    return null;
  }
}

let current: ConsentState = { ready: false, personalized: false };
let initialized = false;

function init() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  setConsentModeDefault(); // before any Google script (Funding Choices/AdSense) can load
  const stored = readStored();
  if (stored) {
    current = stored;
  } else if (hasGpc()) {
    // A Global Privacy Control signal is a standing opt-out everywhere,
    // regardless of region: resolve immediately, no banner needed.
    current = { ready: true, personalized: false };
  }
  // No stored choice and no GPC: stays { ready: false, personalized: false }
  // (safe default, banner shows) until initRegionDefault() below resolves
  // whether this visitor is even in a regulated region.
}

export function getConsent(): ConsentState {
  init();
  return current;
}

let regionChecked = false;

/**
 * CCPA/CPRA and most non-EEA/UK/CH regimes are opt-out, not opt-in: ads and
 * analytics may run by default there, gated behind the persistent "manage
 * privacy choices" control (openPreferences) rather than a blocking
 * first-visit banner. Region comes from a small dynamic API route reading
 * Cloudflare's cf-ipcountry header (regions.ts), not from this module or the
 * root layout, so the hundreds of statically-generated content pages stay
 * static; only this fetch is dynamic. Never persisted to storage, since a
 * visitor's region can change between sessions and re-derives each time
 * something explicit (GPC, a stored choice) hasn't already settled it.
 */
export async function initRegionDefault(): Promise<void> {
  if (typeof window === 'undefined' || regionChecked) return;
  regionChecked = true;
  init();
  if (current.ready) return; // already resolved via storage or GPC
  try {
    const res = await fetch('/api/region', { cache: 'no-store' });
    const data = (await res.json()) as { region?: string };
    if (!current.ready && data.region === 'open') {
      current = { ready: true, personalized: true };
      updateConsentMode(current);
      for (const l of listeners) l(current);
    }
  } catch {
    // Route unreachable: stay in the safe unresolved state, banner shows.
  }
}

export function setConsent(personalized: boolean) {
  init();
  current = { ready: true, personalized: personalized && !hasGpc() };
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
    } catch {
      // localStorage unavailable (private mode, quota); consent still holds
      // for this session via the in-memory value.
    }
  }
  updateConsentMode(current);
  for (const l of listeners) l(current);
}

/** Subscribe to consent resolution/changes. Returns an unsubscribe function. */
export function onConsent(cb: Listener): () => void {
  init();
  listeners.add(cb);
  if (current.ready) cb(current);
  return () => listeners.delete(cb);
}

/** Footer "manage privacy choices" control: re-opens the banner even after auto-resolving. */
export function openPreferences() {
  for (const l of reviewListeners) l();
}

/** Subscribe to openPreferences() calls. Returns an unsubscribe function. */
export function onOpenPreferences(cb: () => void): () => void {
  reviewListeners.add(cb);
  return () => reviewListeners.delete(cb);
}
