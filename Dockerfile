# Stage 1: Base image
FROM oven/bun:1-alpine AS base
WORKDIR /app
RUN apk add --no-cache curl openssl openssl-dev

# Stage 2: Install production dependencies
FROM base AS deps
COPY package.json ./
COPY bun.lock* ./
RUN bun install --frozen-lockfile --production --ignore-scripts

# Stage 3: Build application
FROM base AS build
COPY package.json ./
COPY bun.lock* ./
RUN bun install --frozen-lockfile --ignore-scripts
COPY . .
# Prisma generate needs DATABASE_URL (doesn't connect, just validates schema)
ENV DATABASE_URL="postgresql://user:pass@localhost:5432/db"
RUN bunx prisma generate --schema=prisma/schema.prisma
RUN bun run build

# Stage 4: Production runtime
FROM oven/bun:1-alpine AS release
WORKDIR /app

# Install curl for healthcheck and openssl for Prisma
RUN apk add --no-cache curl openssl openssl-dev

# Copy production dependencies with ownership
COPY --chown=bun:bun --from=deps /app/node_modules ./node_modules

# Copy built application
COPY --chown=bun:bun --from=build /app/.output ./.output

# Copy Prisma schema for migrations
COPY --chown=bun:bun --from=build /app/prisma ./prisma

# Copy package.json for runtime
COPY --chown=bun:bun --from=build /app/package.json ./

# Copy and setup entrypoint script
COPY --chown=bun:bun --from=build /app/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

USER bun

# Expose application port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Setup entrypoint and command
ENTRYPOINT ["/app/docker-entrypoint.sh"]
CMD ["bun", "run", "/app/.output/server/index.mjs"]
