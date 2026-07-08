# Build from the REPO ROOT: docker build -f apps/web/Dockerfile .
FROM node:22-slim AS builder
WORKDIR /app
COPY package.json ./
COPY packages/astro-core/package.json packages/astro-core/
COPY apps/web/package.json apps/web/
RUN npm install --no-audit --no-fund
COPY packages ./packages
COPY apps/web ./apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN cd apps/web && npx next build

# Runtime: Next standalone output only (~150MB total image)
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
# Cloud Run injects PORT (8080)
ENV PORT=8080 HOSTNAME=0.0.0.0
EXPOSE 8080
CMD ["node", "apps/web/server.js"]
