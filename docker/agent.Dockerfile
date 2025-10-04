# syntax=docker/dockerfile:1
FROM langchain/langgraphjs-api:20 AS agent-base

WORKDIR /deps/open-swe

# Copy root workspace manifests first for better layer caching
COPY package.json yarn.lock turbo.json tsconfig.json langgraph.json .yarnrc.yml ./
COPY apps/cli/package.json apps/cli/package.json
COPY apps/docs/package.json apps/docs/package.json
COPY apps/open-swe/package.json apps/open-swe/package.json
COPY apps/open-swe-v2/package.json apps/open-swe-v2/package.json
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json

# Install workspace dependencies
RUN yarn install --immutable

# Copy the remaining source code
COPY apps ./apps
COPY packages ./packages
COPY static ./static

# Build the TypeScript projects so shared dist artifacts are available
RUN yarn build

# Prune down to the production dependencies needed for the agent runtime
RUN yarn workspaces focus @openswe/agent --production

ENV LANGSERVE_GRAPHS='{"programmer":"./apps/open-swe/src/graphs/programmer/index.ts:graph","planner":"./apps/open-swe/src/graphs/planner/index.ts:graph","manager":"./apps/open-swe/src/graphs/manager/index.ts:graph"}'
ENV LANGGRAPH_AUTH='{"path":"./apps/open-swe/src/security/auth.ts:auth","disable_studio_auth":false}'
ENV LANGGRAPH_CONFIG_PATH=./langgraph.json
ENV PORT=2024

EXPOSE 2024

# The base image provides the entrypoint that boots the LangGraph server
