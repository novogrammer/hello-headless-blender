FROM node:22.16.0-bookworm AS base

# RUN apt-get update && apt-get install -y \
#     lame \
#     && apt-get clean \
#     && rm -rf /var/lib/apt/lists/*


FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules


USER nextjs

EXPOSE 3000

CMD ["npm", "run", "start"]

