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
RUN apk add --no-cache curl
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
