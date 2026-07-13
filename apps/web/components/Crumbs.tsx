import Link from 'next/link';

export interface Crumb {
  label: string;
  /** Omit on the last (current-page) crumb. */
  href?: string;
}

const BASE = 'https://starcharts.me';

/**
 * Breadcrumb trail: the visible ".crumbs" row plus matching BreadcrumbList
 * JSON-LD, one source so the two can never disagree. Server component.
 */
export default function Crumbs({ items }: { items: Crumb[] }) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((c, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${BASE}${c.href}` } : {}),
    })),
  };
  return (
    <>
      <p className="crumbs">
        {items.map((c, i) => (
          <span key={i}>
            {i > 0 && ' › '}
            {c.href ? <Link href={c.href}>{c.label}</Link> : c.label}
          </span>
        ))}
      </p>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
