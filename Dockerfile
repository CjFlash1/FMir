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
# Use absolute path to ensure database is in known location
ENV DATABASE_URL="file:/app/prisma/build.db"
RUN npx prisma generate
RUN npx prisma db push

# Seed database with initial data (for build-time static pages)
RUN npx tsx prisma/seed.ts

# Build Next.js
RUN npm run build

# Rename build database to template db that will be copied if no volume exists
RUN mv /app/prisma/build.db /app/template.db

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Don't run as root - group/user creation kept for reference/file ownership
RUN groupadd --system --gid 1001 nodejs
RUN useradd --system --uid 1001 nextjs

# Copy built app FIRST
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets
COPY --from=builder /app/public ./public

# Create uploads directory structure correctly
# We are running as ROOT now to fix permission issues with Railway volumes
RUN mkdir -p /app/data/uploads

# Create symlink for uploads
RUN rm -rf ./public/uploads && ln -s /app/data/uploads ./public/uploads

# Copy Prisma schema and client for runtime
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy template database
COPY --from=builder /app/template.db ./template.db

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Database URL - points to volume mount
ENV DATABASE_URL="file:/app/data/production.db"

# Commented out USER nextjs to run as root and avoid Permission denied on Volume
# USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use entrypoint script to initialize DB if needed
ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
