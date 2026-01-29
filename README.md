# Premium NFT Launchpad

A production-grade NFT Launchpad built with Solidity, Hardhat, Next.js, and Docker.
Features ERC-721 Standard, Merkle Tree Allowlist, gas-optimized minting, and a high-fidelity dark-mode UI.

## Features

- **Smart Contract**: ERC-721 with OpenZeppelin, Merkle Allowlist, Reveal Mechanism.
- **Frontend**: Next.js 14 (App Router), RainbowKit, Wagmi, TailwindCSS.
- **Infrastructure**: Fully Dockerized (Hardhat Node + Frontend).
- **Security**: Comprehensive unit testing, Re-entrancy guards (via pattern), Ownable access control.

## Quick Start (Docker)

The entire application can be run with a single command:

```bash
docker-compose up --build
```

- **Frontend**: http://localhost:3000
- **Ethererum Node**: http://localhost:8545

## Manual Setup

### Smart Contract

1. Install dependencies:
   ```bash
   npm install
   ```
2. Compile contract:
   ```bash
   npx hardhat compile
   ```
3. Run tests:
   ```bash
   npx hardhat test
   ```
4. Deploy to local node:
   ```bash
   npx hardhat node
   # In new terminal
   npx hardhat run scripts/deploy.js --network localhost
   ```

### Frontend

1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run dev server:
   ```bash
   npm run dev
   ```

## Configuration

Environment variables are documented in `.env.example`.
- `NEXT_PUBLIC_CONTRACT_ADDRESS`: Address of the deployed contract.
- `NEXT_PUBLIC_RPC_URL`: RPC URL (default: http://localhost:8545).

## Architecture

- `contracts/`: Solidity Smart Contracts.
- `frontend/`: Next.js DApp.
- `scripts/`: Off-chain utility scripts (Merkle Root generation).
- `test/`: Hardhat unit tests.

## Allowlist

Manage whitelisted addresses in `allowlist.json`.
Generate the Merkle Root using:

```bash
node scripts/generate-merkle.js
```
