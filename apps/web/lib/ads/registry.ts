// Slot registry: single source of sizes and behavior for every ad unit
// (adslot-component-spec.md §4). Adding a slot means adding a row here, not
// touching AdSlot or any page.

export type SlotName =
  | 'content-in-article'
  | 'content-footer'
  | 'content-in-content-3'
  | 'content-sidebar'
  | 'clock-below-table'
  | 'clock-sidebar'
  | 'sky-below-fold'
  | 'mobile-anchor';

export type ProviderName = 'adsense' | 'ezoic' | 'mediavine' | 'raptive' | 'none';

export interface ResolvedSlot {
  name: SlotName;
  reserved: { mobile: [w: number, h: number]; desktop: [w: number, h: number] };
  lazyDefault: boolean;
  refreshDefault: boolean;
  desktopOnly?: boolean;
  mobileOnly?: boolean;
  /** AdSense's native in-article format (fluid layout, centered) instead of a plain responsive display unit. */
  inArticle?: boolean;
  /**
   * Set when the AdSense unit was created as Fixed size rather than
   * Responsive: AdSense has no per-breakpoint sizing, so a fixed unit is
   * locked to this one literal pixel box. Only mounted when the active
   * breakpoint's `reserved` size matches this exactly; otherwise the slot
   * stays an empty placeholder rather than force a mismatched creative.
   */
  fixedSize?: [w: number, h: number];
  networkUnit: Partial<Record<ProviderName, string>>;
}

// Sizes follow common IAB units (300x250 mid, 320x50 mobile banner, 160x600
// skyscraper); adjust once the AdSense account's actual units are approved.
export const REGISTRY: Record<SlotName, ResolvedSlot> = {
  'content-in-article': {
    name: 'content-in-article',
    reserved: { mobile: [300, 250], desktop: [336, 280] },
    lazyDefault: false,
    refreshDefault: false,
    inArticle: true,
    networkUnit: { adsense: '9538914408' },
  },
  'content-footer': {
    name: 'content-footer',
    reserved: { mobile: [300, 250], desktop: [728, 90] },
    lazyDefault: true,
    refreshDefault: false,
    networkUnit: { adsense: '8581055950' },
  },
  'content-in-content-3': {
    name: 'content-in-content-3',
    reserved: { mobile: [300, 250], desktop: [336, 280] },
    lazyDefault: true,
    refreshDefault: false,
    networkUnit: { adsense: '6641856545' },
  },
  'content-sidebar': {
    name: 'content-sidebar',
    // AdSense created this as a fixed 160x900 (large skyscraper), not the
    // 160x600 originally assumed; reserved matches what was actually made.
    reserved: { mobile: [0, 0], desktop: [160, 900] },
    lazyDefault: true,
    refreshDefault: false,
    desktopOnly: true,
    fixedSize: [160, 900],
    networkUnit: { adsense: '7076402590' },
  },
  'clock-below-table': {
    name: 'clock-below-table',
    reserved: { mobile: [300, 250], desktop: [728, 90] },
    lazyDefault: true,
    refreshDefault: true,
    networkUnit: { adsense: '1476591554' },
  },
  'clock-sidebar': {
    name: 'clock-sidebar',
    reserved: { mobile: [0, 0], desktop: [160, 600] },
    lazyDefault: true,
    refreshDefault: true,
    desktopOnly: true,
    fixedSize: [160, 600],
    networkUnit: { adsense: '8197912578' },
  },
  'sky-below-fold': {
    name: 'sky-below-fold',
    reserved: { mobile: [300, 250], desktop: [728, 90] },
    lazyDefault: true,
    refreshDefault: false,
    networkUnit: { adsense: '9163509887' },
  },
  'mobile-anchor': {
    name: 'mobile-anchor',
    reserved: { mobile: [320, 50], desktop: [0, 0] },
    lazyDefault: false,
    refreshDefault: false,
    mobileOnly: true,
    fixedSize: [320, 50],
    networkUnit: { adsense: '8030959832' },
  },
};
