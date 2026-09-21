FROM oven/bun:1 AS build
WORKDIR /app
COPY package.json bun.lock ./
COPY apps/server/package.json apps/server/
COPY apps/web/package.json apps/web/
COPY apps/atlas/package.json apps/atlas/
COPY packages/shared/package.json packages/shared/
COPY packages/legend/package.json packages/legend/
COPY packages/design/package.json packages/design/
RUN bun install --frozen-lockfile
COPY . .
ARG VITE_CLERK_PUBLISHABLE_KEY
ENV VITE_CLERK_PUBLISHABLE_KEY=$VITE_CLERK_PUBLISHABLE_KEY
RUN bun run generate
RUN bun --cwd apps/web build
RUN bun --cwd apps/atlas build

FROM oven/bun:1 AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/bun.lock ./bun.lock
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps ./apps
COPY --from=build /app/packages ./packages
EXPOSE 3000
CMD ["bun", "apps/server/src/main.ts"]
