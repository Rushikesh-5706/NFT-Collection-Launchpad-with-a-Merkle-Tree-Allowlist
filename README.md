# NFT Collection Launchpad

This repository contains a full-stack NFT launchpad implementation. It consists of an optimization-focused ERC-721 smart contract, a Merkle Tree allowlist mechanism, and a Next.js frontend application.

The system is containerized using Docker Compose for deterministic local development and deployment.

## Repository Architecture

### Smart Contract (`contracts/MyNFT.sol`)
- **Standard**: ERC-721 implementation using OpenZeppelin.
- **Access Control**: Ownable pattern for administrative functions.
- **Optimizations**: 
  - `ReentrancyGuard` applied to all state-changing external functions.
  - Custom errors (`error Name()`) used instead of string revert messages to reduce gas costs.
  - Manual `totalSupply` tracking to avoid the overhead of `ERC721Enumerable`.
- **Sale Phases**:
  1. `Paused`: No interactions allowed.
  2. `Allowlist`: Minting restricted to addresses in the Merkle Tree.
  3. `Public`: Open minting with per-wallet limits.

### Frontend (`frontend/`)
- **Framework**: Next.js 14 (App Router).
- **Web3 Integration**: Wagmi and Viem hooks.
- **UI Components**: RainbowKit for wallet connection.
- **Testing**: UI elements include `data-testid` attributes for integration testing.

### Scripts (`scripts/`)
- `generate-merkle.js`: Generates the Merkle Root and JSON proofs from an allowlist file.
- `deploy.js`: Deploys the smart contract to the local network.
- `upload-ipfs.js`: Helper utility for uploading metadata to IPFS (requires Pinata credentials).
- `entrypoint.sh`: Docker entrypoint for orchestrating node startup and contract deployment.

## Interface Support
The smart contract explicitly supports the following interfaces:
- **ERC-721**: Core NFT standard.
- **ERC-2981**: NFT Royalty Standard.
- **ERC-165**: Standard Interface Detection.

## Installation & Usage

### Prerequisites
- Docker and Docker Compose installed.
- Git.

### Running the Application

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Start Services**:
   Execute the following command to start the local blockchain node and frontend:
   ```bash
   docker-compose up --build
   ```

   **Note**: The initialization process involves:
   - Starting `hardhat-node`.
   - Waiting for the JSON-RPC interface to become available.
   - Automatically deploying the smart contract.
   - Starting the Next.js frontend.

3. **Access the DApp**:
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Local Node: [http://localhost:8545](http://localhost:8545)

### Configuration
Environment variables can be configured in `.env`. A template is provided in `.env.example`.

## Testing

The project includes a Hardhat test suite ensuring contract logic correctness.

To run tests:
```bash
npx hardhat test
```

### Test Coverage
- **Access Control**: Verifies owner-only restriction on administrative functions.
- **Minting Constraints**: Validates `quantity > 0`, `MAX_PER_WALLET`, and `MAX_SUPPLY` logic.
- **Sale State**: Ensures minting reverts correctly when paused or when phases mismatch.
- **Financials**: Verifies withdrawal logic and exact balance transfers.
- **Interface**: Confirms ERC-165 support for required standards.

## Deployment Notes

- **Docker**: The `entrypoint.sh` script ensures the contract is deployed only after the node is reachable via JSON-RPC.
- **Gas**: Gas usage is optimized for end-users by avoiding on-chain enumeration. Token enumeration should be handled by an off-chain indexer for production use cases.

## License

MIT
