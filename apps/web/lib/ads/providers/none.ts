import type { AdProvider } from '../provider';

// Default provider: no network request, no script, just the reserved
// placeholder AdSlot already renders. Used in dev, preview, and any market
// where NEXT_PUBLIC_AD_PROVIDER is unset.
export const noneProvider: AdProvider = {
  name: 'none',
  async loadScript() {},
  mount() {},
  unmount() {},
};
