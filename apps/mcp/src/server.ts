import express from 'express';
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { chartAt, detectAspects, natalChart, transitAspects, synastry } from '@starcharts/astro-core';
import { chartPayload, describeAspects } from './format.js';

const PORT = Number(process.env.PORT ?? 8787);

const isoDate = z.string().datetime({ offset: true }).describe('ISO 8601 instant, e.g. 2026-07-07T12:00:00Z');

function parseDate(s: string): Date {
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d;
}

const asText = (payload: unknown) => ({
  content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
});

function buildServer(): McpServer {
  const server = new McpServer({ name: 'starcharts', version: '0.1.0' });

  server.tool(
    'get_current_chart',
    'Current planetary positions (tropical zodiac, geocentric) and the major aspects in effect right now.',
    {},
    async () => {
      const now = new Date();
      const positions = chartAt(now);
      return asText(chartPayload(now, positions, detectAspects(positions)));
    },
  );

  server.tool(
    'get_chart',
    'Planetary positions and aspects for any date/time (year 1000–3000).',
    { date: isoDate },
    async ({ date }) => {
      const d = parseDate(date);
      const positions = chartAt(d);
      return asText(chartPayload(d, positions, detectAspects(positions)));
    },
  );

  server.tool(
    'get_aspects',
    'Only the major aspects (conjunction, sextile, square, trine, opposition) for a date/time.',
    { date: isoDate },
    async ({ date }) => {
      const d = parseDate(date);
      const aspects = detectAspects(chartAt(d));
      return asText({
        date: d.toISOString(),
        aspects: aspects.map((a) => ({ a: a.a, b: a.b, type: a.type, orb: +a.orb.toFixed(2), applying: a.applying })),
        summary: describeAspects(aspects),
      });
    },
  );

  server.tool(
    'get_natal_chart',
    'Natal (birth) chart: positions and natal aspects. If birth time is unknown, use local noon and tell the user the Moon may be off by up to ~7°.',
    { birth: isoDate },
    async ({ birth }) => {
      const b = parseDate(birth);
      const n = natalChart(b);
      return asText(chartPayload(b, n.positions, n.aspects));
    },
  );

  server.tool(
    'get_transits',
    'Transiting-to-natal aspects: how the sky at `date` (default now) touches the natal chart of someone born at `birth`.',
    { birth: isoDate, date: isoDate.optional() },
    async ({ birth, date }) => {
      const b = parseDate(birth);
      const d = date ? parseDate(date) : new Date();
      const hits = transitAspects(b, d);
      return asText({
        birth: b.toISOString(),
        date: d.toISOString(),
        transits: hits.map((a) => ({ transiting: a.a, natal: a.b, type: a.type, orb: +a.orb.toFixed(2), applying: a.applying })),
        summary: describeAspects(hits, ['transiting', 'natal']),
      });
    },
  );

  server.tool(
    'get_synastry',
    'Synastry between two birth charts: inter-chart aspects for relationship analysis.',
    { birthA: isoDate, birthB: isoDate },
    async ({ birthA, birthB }) => {
      const s = synastry(parseDate(birthA), parseDate(birthB));
      return asText({
        birthA: s.a.birth.toISOString(),
        birthB: s.b.birth.toISOString(),
        aspects: s.aspects.map((a) => ({ personA: a.a, personB: a.b, type: a.type, orb: +a.orb.toFixed(2) })),
        summary: describeAspects(s.aspects, ['A', 'B']),
      });
    },
  );

  return server;
}

const app = express();
// Cloud Run terminates TLS at a front proxy; trust it so req.ip is the real
// client (used for rate limiting) rather than the proxy's address.
app.set('trust proxy', true);
// Requests are tiny JSON-RPC envelopes; cap the body to reject abuse.
app.use(express.json({ limit: '32kb' }));

// Minimal in-process, per-IP fixed-window rate limiter. No dependency, and
// good enough as a basic safeguard for a public read-only service. Limits are
// per instance (Cloud Run may run several); tune via env if needed.
const RATE_LIMIT = Number(process.env.RATE_LIMIT ?? 120); // requests per window
const RATE_WINDOW_MS = Number(process.env.RATE_WINDOW_MS ?? 60_000);
const buckets = new Map<string, { count: number; reset: number }>();
setInterval(() => {
  const now = Date.now();
  for (const [ip, b] of buckets) if (b.reset <= now) buckets.delete(ip);
}, RATE_WINDOW_MS).unref(); // don't keep the process alive for cleanup
app.use((req, res, next) => {
  if (req.path === '/healthz') return next(); // never rate-limit health checks
  const now = Date.now();
  const ip = req.ip ?? 'unknown';
  let b = buckets.get(ip);
  if (!b || b.reset <= now) { b = { count: 0, reset: now + RATE_WINDOW_MS }; buckets.set(ip, b); }
  b.count++;
  if (b.count > RATE_LIMIT) {
    res.set('Retry-After', String(Math.ceil((b.reset - now) / 1000)));
    return res.status(429).json({ error: 'Too many requests' });
  }
  next();
});

// MCP endpoint, stateless streamable HTTP: fresh server+transport per request.
app.post('/mcp', async (req, res) => {
  try {
    const server = buildServer();
    const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
    res.on('close', () => { transport.close(); server.close(); });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    if (!res.headersSent) res.status(500).json({ error: String(err) });
  }
});
app.get('/mcp', (_req, res) => res.status(405).set('Allow', 'POST').send('POST JSON-RPC to this endpoint'));

// Plain REST twin, widens the integration surface for free.
app.get('/api/chart', (req, res) => {
  try {
    const d = req.query.date ? parseDate(String(req.query.date)) : new Date();
    const positions = chartAt(d);
    res.json(chartPayload(d, positions, detectAspects(positions)));
  } catch (err) {
    res.status(400).json({ error: String(err) });
  }
});

app.get('/healthz', (_req, res) => res.json({ ok: true, service: 'starcharts-mcp' }));

app.listen(PORT, () => console.log(`starcharts MCP on :${PORT} (POST /mcp, GET /api/chart)`));
