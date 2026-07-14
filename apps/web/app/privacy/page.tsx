import Link from 'next/link';
import type { Metadata } from 'next';
import Crumbs from '../../components/Crumbs';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What Starcharts collects, why, and how to control it.',
};

const EFFECTIVE_DATE = '2026-07-13';

export default function Privacy() {
  return (
    <div className="prose">
      <Crumbs items={[{ label: 'Privacy' }]} />
      <h1>Privacy policy</h1>
      <p className="lede">
        Starcharts collects no birth data. The clock and every content page work from the current date and time, or
        a date you type in, none of it is stored on our side or tied to you.
      </p>

      <h2>What is collected</h2>
      <p>
        Two categories of data may be collected while you use the site, both described below. Neither is active
        until consent resolves, one way or the other; declining or being in a region that requires opt-in keeps
        only the essential storage needed to remember your choice.
      </p>
      <ul>
        <li>
          <b>Product analytics</b>: anonymous, aggregate events such as a planet drag starting, the clock jumping to
          a new date, an aspect being tapped, or a page view. Used to understand which parts of the site are
          useful, not to build a profile of any one visitor.
        </li>
        <li>
          <b>Advertising cookies</b>: once ads are live, our ad provider (currently AdSense) may set cookies to
          serve and measure ads, personalized only if you consent, contextual otherwise. See Google&rsquo;s{' '}
          <a href="https://policies.google.com/technologies/partner-sites" target="_blank" rel="noreferrer noopener">
            how Google uses data from partner sites
          </a>{' '}
          for what AdSense itself collects.
        </li>
      </ul>

      <h2>Consent</h2>
      <p>
        Visitors in the EU, UK, or Switzerland see a consent message before any non-essential (analytics or ad)
        storage is set, handled by Google&rsquo;s consent management tool where enabled, our own banner otherwise,
        and can decline. Elsewhere, non-essential storage may be on by default, with an opt-out described below. If
        your browser sends a{' '}
        <a href="https://globalprivacycontrol.org" target="_blank" rel="noreferrer noopener">
          Global Privacy Control
        </a>{' '}
        signal, we treat that as a decline everywhere, automatically and without a prompt.
      </p>

      <h2>Your choices</h2>
      <p>
        Every page has a &ldquo;manage privacy choices&rdquo; link in the footer that reopens the consent message
        at any time, to accept, decline, or change your mind. California and other US-state visitors: that same
        link, and the GPC signal above, serve as a Do Not Sell/Share opt-out; we do not sell personal information.
        You can also reach us at the address below to ask what, if anything, is held about your session.
      </p>

      <h2>Cookies and local storage, by name</h2>
      <table><tbody>
        <tr><td>Consent choice</td><td className="muted">Essential, remembers accept/decline so the banner does not repeat.</td></tr>
        <tr><td>Analytics events</td><td className="muted">Non-essential, off until consent, no birth or account data.</td></tr>
        <tr><td>Ad cookies (AdSense)</td><td className="muted">Non-essential, off until consent, set by Google, not by us.</td></tr>
      </tbody></table>

      <h2>Referrer and headers</h2>
      <p>
        The site sends a trimmed referrer (strict-origin-when-cross-origin) and standard security headers on every
        response, part of keeping what leaves your browser to a minimum by default.
      </p>

      <h2>Changes</h2>
      <p>
        If this policy changes materially, the effective date below updates. Effective date: {EFFECTIVE_DATE}.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about this policy or your data: <a href="mailto:hello@starcharts.me">hello@starcharts.me</a>. See
        also <Link href="/about">about Starcharts</Link>.
      </p>
    </div>
  );
}
