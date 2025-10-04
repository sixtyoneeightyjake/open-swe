# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim AS deps

ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

# Provide defaults for the build-time public environment variables.
# These can be overridden at build time via `--build-arg`.
ARG NEXT_PUBLIC_API_URL=http://localhost:3000/api
ARG NEXT_PUBLIC_ALLOWED_USERS_LIST=[]
ARG NEXT_PUBLIC_GITHUB_APP_CLIENT_ID=""
ARG NEXT_PUBLIC_ASSISTANT_ID=""

ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_ALLOWED_USERS_LIST=$NEXT_PUBLIC_ALLOWED_USERS_LIST
ENV NEXT_PUBLIC_GITHUB_APP_CLIENT_ID=$NEXT_PUBLIC_GITHUB_APP_CLIENT_ID
ENV NEXT_PUBLIC_ASSISTANT_ID=$NEXT_PUBLIC_ASSISTANT_ID

# Copy workspace manifests to maximize install caching
COPY package.json yarn.lock turbo.json tsconfig.json .yarnrc.yml ./
COPY apps/cli/package.json apps/cli/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/open-swe/package.json apps/open-swe/package.json
COPY apps/open-swe-v2/package.json apps/open-swe-v2/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

RUN yarn install --immutable

# Copy the rest of the source tree
COPY . .

# Build shared artifacts before building the web app
RUN yarn workspace @openswe/shared build
RUN yarn workspace @openswe/web build

# Prune dependencies to only what the web app needs in production
RUN yarn workspaces focus @openswe/web --production

FROM node:20-bookworm-slim AS runner

ENV NODE_ENV=production
WORKDIR /app

RUN corepack enable

# Copy the built application with production dependencies
COPY --from=deps /app /app

ENV PORT=3000
EXPOSE 3000

CMD ["yarn", "workspace", "@openswe/web", "start"]
