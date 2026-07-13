import Link from 'next/link';
import type { Metadata } from 'next';
import MoonPanel from '../../components/MoonPanel';
import Crumbs from '../../components/Crumbs';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Moon phase & void-of-course Moon, explained',
  description:
    'What the current moon phase and a void-of-course Moon mean, with the live values for right now. Tradition-framed, computed from a real ephemeris.',
};

export default function MoonExplainer() {
  const now = new Date();
  return (
    <div className="prose">
      <Crumbs items={[{ label: 'The sky today', href: '/sky' }, { label: 'The Moon' }]} />
      <h1>The Moon right now</h1>
      <p className="lede">The fastest body on the wheel, and the one people track most.</p>

      <MoonPanel initialMs={now.getTime()} />

      <h2>Moon phase</h2>
      <p>
        The phase is simply how far the Moon has moved ahead of the Sun around the zodiac. At the new moon the two
        sit together and the disc is dark; a quarter turn later the Moon is half lit; opposite the Sun it is full.
        The percentage above is the illuminated fraction, computed from the real geometry, not an approximation.
      </p>
      <p>
        The full cycle from one new moon to the next runs about twenty-nine and a half days, the synodic month.
        Because that is slightly longer than the Moon&rsquo;s roughly twenty-seven-day loop through the twelve
        signs, the phase and the sign drift apart over the year rather than repeating in lockstep, so a full moon
        in one sign will fall in a different sign next month.
      </p>

      <h2>How long does a void-of-course Moon last?</h2>
      <p>
        The Moon is called void of course from the moment it makes its last major aspect (conjunction, sextile,
        square, trine, or opposition) to one of the ten bodies, Sun through Pluto, until it crosses into the next
        sign. Traditionally it is a fallow stretch: a poor time to start something you want to stick, a fine time to
        rest, finish, or let things settle. Starcharts uses the modern ten-body set, and every time shown is UTC.
      </p>
      <p>
        There is no fixed length. Because the Moon can make its last aspect early or late in a sign, a void period
        can run minutes or run most of a day; the calendar on the <Link href="/sky">sky-today page</Link> lists the
        actual computed windows for the next thirty days rather than a rule of thumb.
      </p>

      <h2>Waxing vs waning</h2>
      <p>
        Waxing means the illuminated fraction is growing, from new toward full; waning means it is shrinking, from
        full back toward new. Tradition reads the waxing half as a building, planting phase and the waning half as a
        releasing, finishing one, though this, like the rest of the page, is interpretation rather than a claim
        about outcomes.
      </p>

      <p className="muted">
        Tradition and interpretation, not prediction. See the <Link href="/sky">full sky-today view</Link> or watch
        the Moon move on the <Link href="/">live clock</Link>.
      </p>
    </div>
  );
}
