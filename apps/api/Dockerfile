FROM node:24-alpine AS base
RUN npm install -g pnpm@9.15.4

FROM base AS builder
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
# Generate Prisma Client and build the api package
RUN pnpm exec prisma generate --schema=apps/api/prisma/schema.prisma
RUN pnpm --filter=api build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy node_modules and built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/package.json
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/packages ./packages

EXPOSE 3001
ENV PORT=3001
CMD ["node", "apps/api/dist/main.js"]
