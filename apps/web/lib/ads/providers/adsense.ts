import type { AdProvider } from '../provider';

interface AdsByGoogleArray extends Array<Record<string, unknown>> {
  requestNonPersonalizedAds?: 0 | 1;
}

declare global {
  interface Window {
    adsbygoogle?: AdsByGoogleArray;
  }
}

let scriptPromise: Promise<void> | null = null;
let unitCounter = 0;

// Launch network (E1 slot map). Requires NEXT_PUBLIC_ADSENSE_CLIENT
// (ca-pub-XXXXXXXXXXXXXXXX) and, per slot, an approved ad-unit id wired into
// registry.ts's networkUnit.adsense. Until both exist this adapter is a
// no-op and AdSlot's reserved placeholder just shows, so nothing breaks
// pre-approval.
export const adsenseProvider: AdProvider = {
  name: 'adsense',

  async loadScript(consent) {
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    if (!client || typeof document === 'undefined') return;
    if (!scriptPromise) {
      scriptPromise = new Promise((resolve, reject) => {
        window.adsbygoogle = window.adsbygoogle || [];
        // Non-personalized serving when the visitor declined personalized
        // consent (adslot-component-spec.md §7); must be set before the tag
        // script runs its first request.
        window.adsbygoogle.requestNonPersonalizedAds = consent.personalized ? 0 : 1;
        const script = document.createElement('script');
        script.async = true;
        script.crossOrigin = 'anonymous';
        script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('adsbygoogle failed to load'));
        document.head.appendChild(script);
      });
    }
    return scriptPromise;
  },

  mount(el, slot) {
    const client = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
    const unit = slot.networkUnit.adsense;
    if (!client || !unit || typeof document === 'undefined') return; // stay a placeholder

    if (slot.fixedSize) {
      // A fixed-size AdSense unit is locked to the one literal box it was
      // created at; there's no per-breakpoint sizing on AdSense's side. Only
      // fill when the active breakpoint's reserved size actually matches
      // that box (e.g. a desktop-only slot, or a slot whose mobile and
      // desktop reserved sizes happen to be the same fixed unit); otherwise
      // leave the placeholder empty rather than stretch/crop a mismatched
      // creative into the wrong shape.
      const isDesktop = window.matchMedia('(min-width: 768px)').matches;
      const active = isDesktop ? slot.reserved.desktop : slot.reserved.mobile;
      if (active[0] !== slot.fixedSize[0] || active[1] !== slot.fixedSize[1]) return;
    }

    const ins = document.createElement('ins');
    ins.className = 'adsbygoogle';
    ins.dataset.adClient = client;
    ins.dataset.adSlot = unit;
    if (slot.inArticle) {
      // AdSense's native in-article format: fluid layout, centered, sized by
      // the creative rather than a fixed or auto-responsive box.
      ins.style.display = 'block';
      ins.style.textAlign = 'center';
      ins.dataset.adLayout = 'in-article';
      ins.dataset.adFormat = 'fluid';
    } else if (slot.fixedSize) {
      ins.style.display = 'inline-block';
      ins.style.width = `${slot.fixedSize[0]}px`;
      ins.style.height = `${slot.fixedSize[1]}px`;
    } else {
      ins.style.display = 'block';
      ins.dataset.adFormat = 'auto';
      ins.dataset.fullWidthResponsive = 'true';
    }
    ins.id = `adsbygoogle-${slot.name}-${unitCounter++}`;
    el.appendChild(ins);
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // adsbygoogle not ready yet (race with loadScript); the reserved box
      // stays visible, no user-facing error.
    }
  },

  unmount(el) {
    el.replaceChildren();
  },
};
