# Base image - Using slim (Debian-based) for Prisma compatibility
FROM node:20-slim AS base

# Install OpenSSL for Prisma
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* .npmrc* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma Client and create database schema
ENV DATABASE_URL="file:./dev.db"
RUN npx prisma generate
RUN npx prisma db push

# Seed database with initial data
RUN npx tsx prisma/seed.ts

# Build Next.js
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Don't run as root
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy public assets (including logo.png etc)
COPY --from=builder /app/public ./public
# Note: creating uploads dir for permission setting
RUN mkdir -p ./public/uploads && chown nextjs:nodejs ./public/uploads

# Copy built app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and client for runtime
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/dev.db ./dev.db

# Database URL for runtime
ENV DATABASE_URL="file:./dev.db"

# Set user
USER nextjs

EXPOSE 3000
ENV PORT=3000
# Update hostname to 0.0.0.0 for Docker networking
ENV HOSTNAME="0.0.0.0"

# Start the application
CMD ["node", "server.js"]
