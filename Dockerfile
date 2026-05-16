# ── Stage 1: Install dependencies ─────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --legacy-peer-deps

# ── Stage 2: Build the app ────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public env vars — baked directly so GitHub CI always has them.
# NEXT_PUBLIC_* keys are intentionally public (safe to commit).
ENV NEXT_PUBLIC_SUPABASE_URL="https://ycvnqrvcgwvvatzbtqrt.supabase.co"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="sb_publishable_W22YHEHc_J0v1XF_idKG0g_FWXUiCPl"
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="placeholder"
ENV NEXT_PUBLIC_APP_URL="https://brandflow.fly.dev"

RUN npm run build

# ── Stage 3: Production runner ────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# Copy only what Next.js standalone needs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
