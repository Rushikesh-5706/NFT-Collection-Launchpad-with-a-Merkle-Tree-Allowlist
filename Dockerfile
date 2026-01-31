# Base stage
FROM node:18-alpine AS base
WORKDIR /app

# --- Backend Dependencies Stage (Heavy) ---
FROM base AS backend-deps
# Install build tools needed for node-gyp
RUN apk add --no-cache python3 make g++
COPY package.json package-lock.json* ./
RUN npm install --omit=optional

# --- Contracts / Hardhat Node (Runtime) ---
FROM base AS contracts
# Only install runtime utils (curl for healthcheck)
RUN apk add --no-cache curl

# Copy node_modules from builder
COPY --from=backend-deps /app/node_modules ./node_modules

# Copy source code
COPY hardhat.config.js .
COPY contracts ./contracts
COPY scripts ./scripts
COPY test ./test

# Copy entrypoint
COPY scripts/entrypoint.sh ./scripts/entrypoint.sh
RUN chmod +x ./scripts/entrypoint.sh

EXPOSE 8545
CMD ["/bin/sh", "./scripts/entrypoint.sh"]

# --- Frontend Dependencies Stage (Heavy) ---
FROM base AS frontend-deps
RUN apk add --no-cache python3 make g++
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install

# --- Frontend (Runtime) ---
FROM base AS frontend
# Copy node_modules from builder
COPY --from=frontend-deps /app/node_modules ./node_modules

COPY frontend .
EXPOSE 3000
CMD ["npm", "run", "dev"]
