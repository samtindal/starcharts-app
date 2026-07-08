# Build from the REPO ROOT: docker build -f apps/mcp/Dockerfile .
FROM node:22-slim

WORKDIR /app

# Install with just the manifests first so Docker layer-caches node_modules.
COPY package.json ./
COPY packages/astro-core/package.json packages/astro-core/
COPY apps/mcp/package.json apps/mcp/
RUN npm install --no-audit --no-fund

COPY packages ./packages
COPY apps/mcp ./apps/mcp

ENV NODE_ENV=production
# Cloud Run injects PORT (8080); server.ts reads process.env.PORT.
EXPOSE 8080

CMD ["npx", "tsx", "apps/mcp/src/server.ts"]
