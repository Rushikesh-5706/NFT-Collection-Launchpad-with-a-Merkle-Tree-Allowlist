# NFT Collection Launchpad

This repository features a complete, production-grade NFT launchpad solution. It integrates an optimized ERC-721 smart contract, a secure Merkle Tree allowlist mechanism, and a responsive Next.js frontend application.

The project is designed for robustness, security, and ease of use, providing a seamless experience for both administrators and end-users.

## Key Features

| Feature | Description |
| :--- | :--- |
| **Optimized Smart Contract** | Gas-efficient ERC-721 implementation with `ReentrancyGuard` and custom errors. |
| **Merkle Tree Allowlist** | Secure and gas-efficient presale validation using cryptographic proofs. |
| **Dynamic Sale Phases** | Configurable states: `Paused`, `Allowlist Only`, and `Public Sale`. |
| **Comprehensive Testing** | Rigorous Hardhat test suite ensuring security and logic integrity (27+ tests). |
| **Modern Frontend** | Built with Next.js 14, RainbowKit, and Wagmi for a premium user experience. |
| **Dockerized Deployment** | Full containerization for consistent local development and deployment. |
| **IPFS Integration** | Automated, authenticated metadata upload scripts for Pinata. |

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Smart Contract** | Solidity (0.8.20), OpenZeppelin Contracts v5.0 |
| **Development Env** | Hardhat, Ethers.js |
| **Frontend Framework** | Next.js 14, React, Tailwind CSS |
| **Web3 Libraries** | Wagmi, Viem, RainbowKit |
| **Storage** | IPFS (via Pinata) |
| **Containerization** | Docker, Docker Compose |

## Prerequisites

Before you begin, ensure you have the following installed:

*   **Docker & Docker Compose**: For containerized execution.
*   **Node.js (v18+)**: For local development (optional if using Docker).
*   **Git**: For version control.
*   **MetaMask**: Or any Web3-enabled wallet.

## Quick Start (Docker)

The easiest way to run the application is using the pre-built Docker image or building locally.

### Option 1: Using Pre-built Image

The official image is optimized for performance and size (~168MB).

**Docker Hub URL**: [https://hub.docker.com/r/rushi5706/nft-collection-launchpad](https://hub.docker.com/r/rushi5706/nft-collection-launchpad)

```bash
docker pull rushi5706/nft-collection-launchpad:latest
```

### Option 2: Running Locally with Docker Compose

This method spins up a local blockchain node, deploys the contract, and starts the frontend automatically.

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/Rushikesh-5706/NFT-Collection-Launchpad-with-a-Merkle-Tree-Allowlist.git
    cd NFT-Collection-Launchpad-with-a-Merkle-Tree-Allowlist
    ```

2.  **Start Services**
    ```bash
    docker-compose up --build
    ```

    **Expected Output:**
    *   `Starting Hardhat Node...`
    *   `Deploying Smart Contract...`
    *   `Contract Deployed to: 0x...`
    *   `Frontend ready on http://localhost:3000`

3.  **Access the Application**
    *   **Frontend**: [http://localhost:3000](http://localhost:3000)
    *   **JSON-RPC Node**: [http://localhost:8545](http://localhost:8545)

## Configuration

Create a `.env` file in the root directory to configure the environment. A template is available in `.env.example`.

### Essential Variables

| Variable | Description | Default (Local) |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | Required for RainbowKit. Get one from WalletConnect Cloud. | *None* |
| `NEXT_PUBLIC_CONTRACT_ADDRESS` | The deployed contract address. | `0x5FbDB2315678afecb367f032d93F642f64180aa3` |
| `NEXT_PUBLIC_RPC_URL` | RPC URL for the blockchain network. | `http://localhost:8545` |
| `SEPOLIA_RPC_URL` | (Deployment Only) Infura/Alchemy endpoint for Sepolia. | *None* |
| `PRIVATE_KEY` | (Deployment Only) Deployer wallet private key. | *None* |

## Testing

The repository includes an extensive test suite covering:
*   Access Control & Security (Reentrancy, Unauthorized Access)
*   Minting Logic (Allowlist, Public, Limits)
*   Financials (Withdrawals, Royalties)
*   Edge Cases (Zero Price, Sequence Checks)

**To run tests locally:**

```bash
npx hardhat test
```

**Expected Output:**
```text
  MyNFT (Production Grade)
    ✔ Should support ERC721 interface...
    ✔ Should revert unpause(0) with CannotUnpauseToPaused...
    ✔ Should mint precise Token IDs sequentially...
    ...
  27 passing
```

## Testnet Deployment (Sepolia)

Follow these steps to deploy your own instance to the Sepolia testnet.

1.  **Configure Environment**:
    Update your `.env` file with your Sepolia RPC and Private Key.
    ```bash
    SEPOLIA_RPC_URL=https://rpc.sepolia.org
    PRIVATE_KEY=your_private_key_without_0x_prefix
    ```

2.  **Deploy Contract**:
    Run the deployment script targeting the Sepolia network.
    ```bash
    npx hardhat run scripts/deploy.js --network sepolia
    ```

3.  **Live Status (Verified)**:
    
    | Parameter | Value |
    | :--- | :--- |
    | **Network** | Sepolia Testnet |
    | **Contract Address** | `0x2dbbDDadb90a897d059D63767FAc676DBB5c39Ca` |
    | **Etherscan Verification** | [View Contract](https://sepolia.etherscan.io/address/0x2dbbDDadb90a897d059D63767FAc676DBB5c39Ca) |

4.  **Verify Contract**:
    Verify source code on Etherscan for full transparency.
    ```bash
    npx hardhat verify --network sepolia <DEPLOYED_ADDRESS> "TestNFT" "TNFT" "ipfs://initial/"
    ```

5.  **Update Frontend**:
    Set `NEXT_PUBLIC_CONTRACT_ADDRESS` in your `.env` to the new Sepolia address and restart the application.

## 📂 Repository Structure

```text
.
├── contracts/          # Solidity Smart Contracts
├── frontend/           # Next.js Frontend Application
├── scripts/            # Deployment and Utility Scripts
├── test/               # Hardhat Test Suite
├── Dockerfile          # Multi-stage Docker Build
├── docker-compose.yml  # Container Orchestration
└── README.md           # Project Documentation
```

## License

MIT
