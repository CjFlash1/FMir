# Base image
FROM node:20-alpine AS base

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

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
# Disable type checks for faster build in specific envs if needed, but normally keep them
# ENV NEXT_IGNORE_ESLINT=1
# ENV NEXT_IGNORE_TYPECHECKS=1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy public assets (including logo.png etc)
COPY --from=builder /app/public ./public
# Note: creating uploads dir for permission setting
RUN mkdir -p ./public/uploads && chown nextjs:nodejs ./public/uploads

# Copy built app
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema and migrations for runtime check/deploy
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

# Set user
USER nextjs

EXPOSE 3000
ENV PORT=3000
# Update hostname to 0.0.0.0 for Docker networking
ENV HOSTNAME="0.0.0.0"

# Start the application (migrate and start)
# Note: For SQLite, we might want to run migrations on startup
CMD ["node", "server.js"]
