# Use Node.js 20 as specified in langgraph.json
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache git openssh-client

# Copy package files
COPY package.json yarn.lock .yarnrc.yml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/open-swe/package.json ./apps/open-swe/

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy source code
COPY . .

# Build the shared package first
RUN yarn workspace @open-swe/shared build

# Build the open-swe app
RUN yarn workspace @open-swe/agent build

# Expose the port (default LangGraph port is 8123)
EXPOSE 8123

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8123

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S openswe -u 1001

# Change ownership of the app directory
RUN chown -R openswe:nodejs /app
USER openswe

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8123/health || exit 1

# Start the LangGraph server with production configuration
CMD ["langgraphjs", "up", "--config", "./langgraph.production.json", "--host", "0.0.0.0", "--port", "8123"]