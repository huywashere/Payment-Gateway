# syntax=docker/dockerfile:1.7
FROM node:22-alpine AS dependencies

WORKDIR /workspace/frontend-portal
COPY frontend-portal/package.json frontend-portal/package-lock.json ./
RUN npm ci

FROM node:22-alpine AS builder

WORKDIR /workspace/frontend-portal
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=postgresql://build_only:build_only@127.0.0.1:5432/build_only

COPY --from=dependencies /workspace/frontend-portal/node_modules ./node_modules
COPY frontend-portal/package.json frontend-portal/package-lock.json ./
COPY frontend-portal/prisma ./prisma
RUN npx prisma generate

COPY frontend-portal/public ./public
COPY frontend-portal/src ./src
COPY frontend-portal/next.config.ts frontend-portal/tsconfig.json frontend-portal/eslint.config.mjs ./
RUN npm run build

FROM node:22-alpine AS runtime

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs \
    && rm -rf /usr/local/lib/node_modules/npm \
    && rm -f /usr/local/bin/npm /usr/local/bin/npx
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

COPY --from=builder --chown=nextjs:nodejs /workspace/frontend-portal/public ./public
COPY --from=builder --chown=nextjs:nodejs /workspace/frontend-portal/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/frontend-portal/.next/static ./.next/static
COPY --chown=nextjs:nodejs infra/docker/frontend-entrypoint.sh /app/frontend-entrypoint.sh

RUN chmod 0555 /app/frontend-entrypoint.sh
USER nextjs
EXPOSE 3000

ENTRYPOINT ["/app/frontend-entrypoint.sh"]
