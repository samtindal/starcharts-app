import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Starcharts | Astrology Clock',
    short_name: 'Starcharts',
    description: 'Drag the planets to travel through time.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0A1628',
    theme_color: '#0A1628',
    icons: [],
  };
}
