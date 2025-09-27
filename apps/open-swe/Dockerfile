## Multi-stage Dockerfile for apps/open-swe
FROM node:20-alpine AS base
WORKDIR /usr/src/app

# Install dependencies (node-modules linker expects node_modules)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn .yarn
COPY packages/shared/package.json ./packages/shared/package.json
COPY apps/open-swe/package.json ./apps/open-swe/package.json

RUN corepack enable && corepack prepare yarn@stable --activate
RUN yarn install --immutable --check-cache || yarn install

## Build stage
FROM base AS builder
WORKDIR /usr/src/app
COPY . .
RUN yarn build

## Production image
FROM node:20-alpine AS prod
WORKDIR /usr/src/app
ENV NODE_ENV=production

# Copy production node_modules from base
COPY --from=base /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist
COPY apps/open-swe/package.json ./package.json

# Install langgraph CLI globally so we can run the runtime
RUN corepack enable && corepack prepare yarn@stable --activate && yarn global add @langchain/langgraph-cli

EXPOSE 8080
# Launch langgraph runtime using the repo langgraph.json config
CMD ["npx", "langgraphjs", "start", "--config", "./langgraph.json", "--port", "8080"]
