'use client';

import { useEffect, useRef, useState } from 'react';
import { REGISTRY, type SlotName } from '../../lib/ads/registry';
import { activeProvider } from '../../lib/ads/provider';
import { onConsent, type ConsentState } from '../../lib/ads/consent';
import { msSinceLastInteraction } from '../../lib/analytics';

export type { SlotName };

export interface AdSlotProps {
  slot: SlotName;
  /** Template the slot renders on; drives targeting + which registry entry applies. */
  template: 'aspect' | 'sign' | 'planet' | 'planet-in-sign' | 'clock' | 'sky';
  /** Below-fold slots lazy-load; above-fold slots render eagerly. Defaults from registry. */
  lazy?: boolean;
  /** Opt into in-policy refresh (clock only). Defaults from registry; ignored elsewhere. */
  refresh?: boolean;
  className?: string;
}

// Conservative floor; confirm against the live network's refresh policy
// before relying on it (adslot-component-spec.md §8 says "implement
// carefully within network/AdSense policy").
const MIN_REFRESH_INTERVAL_MS = 30_000;
const INTERACTION_WINDOW_MS = 60_000;

let scriptLoadStarted: Promise<void> | null = null;

export default function AdSlot({ slot, template, lazy, refresh, className }: AdSlotProps) {
  const resolved = REGISTRY[slot];
  const rootRef = useRef<HTMLElement | null>(null);
  const mountRef = useRef<HTMLDivElement | null>(null);
  const filledRef = useRef(false);
  const lastRefreshRef = useRef(0);
  const [inView, setInView] = useState(false);

  const wantsLazy = lazy ?? resolved.lazyDefault;
  const wantsRefresh = resolved.refreshDefault && (refresh ?? true);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    if (process.env.NODE_ENV !== 'production') {
      let node: HTMLElement | null = el;
      const siblings = [el.previousElementSibling, el.nextElementSibling];
      if (siblings.some((s) => s?.hasAttribute('data-wheel'))) {
        throw new Error(`AdSlot "${slot}" is an immediate sibling of the wheel. Owner rule: nothing on or adjacent to the wheel.`);
      }
      while (node) {
        if (node.hasAttribute('data-wheel')) {
          throw new Error(`AdSlot "${slot}" is nested inside the wheel. Owner rule: nothing on or adjacent to the wheel.`);
        }
        node = node.parentElement;
      }
    }
  }, [slot]);

  useEffect(() => {
    if (!wantsLazy) {
      setInView(true);
      return;
    }
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setInView(true);
      },
      { rootMargin: '200px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [wantsLazy]);

  useEffect(() => {
    if (!inView) return;
    return onConsent((consent: ConsentState) => {
      if (!consent.ready || filledRef.current) return;
      const mountEl = mountRef.current;
      if (!mountEl) return;
      if (!scriptLoadStarted) scriptLoadStarted = activeProvider.loadScript(consent);
      scriptLoadStarted
        .then(() => {
          if (filledRef.current) return;
          filledRef.current = true;
          lastRefreshRef.current = Date.now();
          activeProvider.mount(mountEl, resolved, consent);
        })
        .catch(() => {
          // Script failed to load (network/ad-blocker); the reserved
          // placeholder stays visible, no layout shift either way.
        });
    });
  }, [inView, resolved]);

  useEffect(() => {
    if (!wantsRefresh || !activeProvider.refresh) return;
    const el = rootRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let viewable = false;
    const observer = new IntersectionObserver((entries) => {
      viewable = entries[0]?.isIntersecting ?? false;
    });
    observer.observe(el);
    const interval = window.setInterval(() => {
      const mountEl = mountRef.current;
      if (!mountEl || !filledRef.current || !viewable) return;
      const sinceRefresh = Date.now() - lastRefreshRef.current;
      const sinceInteraction = msSinceLastInteraction();
      if (sinceRefresh >= MIN_REFRESH_INTERVAL_MS && sinceInteraction <= INTERACTION_WINDOW_MS) {
        lastRefreshRef.current = Date.now();
        activeProvider.refresh?.(mountEl, resolved);
      }
    }, 5_000);
    return () => {
      observer.disconnect();
      window.clearInterval(interval);
    };
  }, [wantsRefresh, resolved]);

  return (
    <aside
      ref={rootRef}
      className={`adslot adslot--${slot}${resolved.desktopOnly ? ' adslot--desktop-only' : ''}${resolved.mobileOnly ? ' adslot--mobile-only' : ''}${className ? ` ${className}` : ''}`}
      style={{
        ['--adslot-w-mobile' as string]: `${resolved.reserved.mobile[0]}px`,
        ['--adslot-h-mobile' as string]: `${resolved.reserved.mobile[1]}px`,
        ['--adslot-w-desktop' as string]: `${resolved.reserved.desktop[0]}px`,
        ['--adslot-h-desktop' as string]: `${resolved.reserved.desktop[1]}px`,
      }}
      aria-label="Advertisement"
      data-template={template}
    >
      <span className="adslot__label">Advertisement</span>
      <div ref={mountRef} className="adslot__mount" />
    </aside>
  );
}
