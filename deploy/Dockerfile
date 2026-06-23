FROM node:24-alpine AS build

WORKDIR /app
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY assets ./assets
COPY scripts ./scripts
RUN pnpm install --frozen-lockfile

ARG APP
ENV APP=${APP}
RUN pnpm sync:brand && pnpm --filter "@quantflow/${APP}" build

FROM node:24-alpine AS runtime

ARG APP
ENV APP=${APP}
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable
COPY --from=build /app /app
CMD ["sh", "-c", "pnpm --filter @quantflow/${APP} start"]
