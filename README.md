# NFT Collection Launchpad

A production-grade NFT launchpad implementation featuring a hardened ERC-721 smart contract, Merkle Tree allowlist, and a resilient Next.js DApp.

## 🏗 Architecture & Features

| Component | Technology | Key Features |
| :--- | :--- | :--- |
| **Smart Contract** | Solidity 0.8.20 | ERC-721, `ReentrancyGuard`, `Ownable`, Custom Errors, Manual Supply Tracking |
| **Frontend** | Next.js 14, Wagmi | Wallet Connection, Real-time State Polling, Merkle Proof Generation |
| **Allowlist** | Merkle Tree | Gas-efficient verification, Off-chain proof generation (JSON) |
| **Metadata** | IPFS | Decentralized storage, Robust upload script with validation |
| **Infrastructure** | Docker Compose | Deterministic Auto-Deployment, Service Orchestration |

---

## 🚀 Quick Start

The system creates a fully completely environment (Blockchain Node + Contract + DApp) with a single command.

### 1. Start Environment
```bash
docker-compose up --build
```
> **Note**: This command automatically starts the Hardhat node, waits for it to come online, deploys the smart contract, and launches the frontend.

### 2. Access Services
*   **Frontend**: [http://localhost:3000](http://localhost:3000)
*   **JSON-RPC Node**: [http://localhost:8545](http://localhost:8545)

### 3. Verification & Testing

To run the comprehensive test suite (covering Security, Logic, and Boundaries):

```bash
npx hardhat test
```

**Expected Output:**
```
  MyNFT (Production Grade)
    System & Interface Compliance
      ✔ Should support ERC721 interface (0x80ac58cd)
      ✔ Should support ERC2981 interface (0x2a55205a)
    Security & Constraints
      ✔ Should revert minting when Sale is Paused
      ✔ Should reject 0 quantity mints
      ✔ Should prevent withdrawal if balance is 0
      ✔ Should correctly track withdrawals (Balance Delta)
    Public Minting
      ✔ Should check Max Per Wallet limit
      ✔ Should prevent minting beyond MAX_SUPPLY
```

---

## 🛡 Security & Hardening Report

| Vulnerability Category | Mitigation Strategy | Implementation Details |
| :--- | :--- | :--- |
| **Reentrancy** | `nonReentrant` Modifier | Applied to all state-changing external functions (`mint`, `withdraw`). |
| **Bot Sniping** | Phase Gating | Strict `SaleState` Enum (Paused -> Allowlist -> Public). |
| **Gas Griefing** | Custom Errors | Uses `error Name()` (e.g., `SaleNotActive`) instead of strings to save gas. |
| **Allowlist Integrity** | Merkle Proofs | Verifies inclusion without storing addresses on-chain. |
| **Supply Inflation** | Strict Checks | `totalSupply` and `MAX_PER_WALLET` enforced on every mint. |
| **Empty Withdrawals** | Balance Check | `withdraw` function reverts explicitly if `address(this).balance == 0`. |

---

## ⛽ Gas Optimization Rationale

| Implementation | Trade-off | Rationale |
| :--- | :--- | :--- |
| **Manual Supply Tracking** | No `ERC721Enumerable` | Saves ~20k gas per mint. Enumeration is handled off-chain via indexers. |
| **Custom Errors** | No revert strings | Reduces deployment cost and runtime gas for failure states. |
| **Merkle Allowlist** | No on-chain storage | O(1) verification cost vs O(n) storage cost for mapping-based allowlists. |

---

## 📜 Project Structure

```
.
├── contracts/
│   └── MyNFT.sol          # The Reference Implementation
├── frontend/
│   ├── app/               # Next.js App Router
│   └── components/        # RainbowKit Integration
├── scripts/
│   ├── deploy.js          # Deployment
│   ├── generate-merkle.js # Proof Generation
│   ├── upload-ipfs.js     # Metadata Management
│   └── entrypoint.sh      # Docker Orchestration
├── test/
│   └── MyNFT.test.js      # 14+ Test Cases
└── docker-compose.yml     # Infrastructure Definition
```

## License

MIT
