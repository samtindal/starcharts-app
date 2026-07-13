import Link from 'next/link';
import type { Metadata } from 'next';
import { voidOfCourse, positionAt } from '@starcharts/astro-core';
import MoonPanel from '../../components/MoonPanel';
import Crumbs from '../../components/Crumbs';
import { fmtUTC } from '../../lib/content';

export const revalidate = 3600; // hourly; the live values upgrade in-browser

export const metadata: Metadata = {
  title: 'The sky today: moon phase & void-of-course',
  description:
    'The Moon right now: current phase, illumination, sign and degree, next new and full moons, and whether the Moon is void of course. Computed live from a real ephemeris.',
};

/** Void-of-course periods over the next ~30 days (server-rendered, ISR-fresh). */
function voidCalendar(from: Date) {
  const rows: { since: Date; until: Date; sign: string }[] = [];
  const end = from.getTime() + 30 * 86_400_000;
  let cursor = from;
  for (let guard = 0; guard < 40 && cursor.getTime() < end; guard++) {
    const v = voidOfCourse(cursor);
    if (v.since && v.since.getTime() < v.until.getTime() && v.until.getTime() > from.getTime()) {
      rows.push({ since: v.since, until: v.until, sign: positionAt('Moon', v.until).sign });
    }
    cursor = new Date(v.until.getTime() + 60_000); // step into the next sign
  }
  // Drop duplicates that share an ingress time.
  return rows.filter((r, i) => i === 0 || r.until.getTime() !== rows[i - 1].until.getTime());
}

export default function SkyToday() {
  const now = new Date();
  const periods = voidCalendar(now);

  return (
    <div className="prose">
      <Crumbs items={[{ label: 'Clock', href: '/' }, { label: 'The sky today' }]} />
      <h1>The sky today</h1>
      <p className="lede">Where the Moon is, how full it is, and whether it is void of course, right now.</p>

      <MoonPanel initialMs={now.getTime()} />

      <p>
        Watch the Moon and every other body move on the <Link href="/">live clock</Link>, or read what a{' '}
        <Link href="/moon">void-of-course Moon</Link> means.
      </p>

      <h2>Void-of-course periods, next 30 days</h2>
      <p className="muted">Each period runs from the Moon&rsquo;s last major aspect until it enters the next sign (UTC).</p>
      <table><tbody>
        {periods.map((r) => (
          <tr key={r.until.toISOString()}>
            <td>{fmtUTC(r.since)}</td>
            <td className="muted">until {fmtUTC(r.until)}</td>
            <td>enters {r.sign}</td>
          </tr>
        ))}
      </tbody></table>
    </div>
  );
}
