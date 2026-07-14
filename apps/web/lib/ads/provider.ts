import type { ResolvedSlot } from './registry';
import type { ConsentState } from './consent';
import { noneProvider } from './providers/none';
import { adsenseProvider } from './providers/adsense';

export interface AdProvider {
  name: 'adsense' | 'ezoic' | 'mediavine' | 'raptive' | 'none';
  /** Loaded once, after consent resolves. Idempotent. */
  loadScript(consent: ConsentState): Promise<void>;
  /** Fill a reserved container that is already in the DOM at its final height. */
  mount(el: HTMLElement, slot: ResolvedSlot, consent: ConsentState): void;
  /** In-policy refresh of an already-mounted slot. No-op if the provider forbids it. */
  refresh?(el: HTMLElement, slot: ResolvedSlot): void;
  unmount(el: HTMLElement): void;
}

const PROVIDERS: Record<string, AdProvider> = {
  none: noneProvider,
  adsense: adsenseProvider,
};

// 'none' is the default: a themed placeholder at the correct reserved
// height, so layout is identical in dev/preview/no-ads markets. Launch sets
// NEXT_PUBLIC_AD_PROVIDER=adsense; later migration milestones (Ezoic,
// Mediavine, Raptive) add an adapter file and flip this env var, no page or
// AdSlot change.
export const activeProvider: AdProvider =
  PROVIDERS[process.env.NEXT_PUBLIC_AD_PROVIDER ?? 'none'] ?? noneProvider;
