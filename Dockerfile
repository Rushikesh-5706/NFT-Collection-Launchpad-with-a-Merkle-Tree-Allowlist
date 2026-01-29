# Base stage
FROM node:18-alpine AS base
WORKDIR /app

# Contracts Setup
FROM base AS contracts
WORKDIR /app
COPY package.json package-lock.json* ./
# Install only dev dependencies needed for hardhat if they are in devDeps, or all
RUN npm install
# Install curl for healthcheck
# Install curl for healthcheck
RUN apk add --no-cache curl

# JSON-RPC Healthcheck script
HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=5 \
    CMD curl -X POST -H 'Content-Type: application/json' \
    --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
    http://localhost:8545 || exit 1
COPY hardhat.config.js .
COPY contracts ./contracts
COPY scripts ./scripts
COPY test ./test
# Expose hardhat node port
EXPOSE 8545
CMD ["npx", "hardhat", "node", "--hostname", "0.0.0.0"]

# Frontend Setup
FROM base AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend .
EXPOSE 3000
CMD ["npm", "run", "dev"]
