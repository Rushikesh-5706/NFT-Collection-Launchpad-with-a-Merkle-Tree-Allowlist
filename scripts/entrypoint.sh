#!/bin/sh

# Start Hardhat Node in background
echo "🚀 Starting Hardhat Node..."
npx hardhat node --hostname 0.0.0.0 &

# Wait for the node to be ready
echo "⏳ Waiting for Hardhat Node to be ready..."
until curl -s -X POST -H "Content-Type: application/json" --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' http://127.0.0.1:8545 >/dev/null; do
  sleep 1
done

echo "✅ Hardhat Node is active."

# Deploy Contract
echo "📜 Deploying Smart Contract..."
npx hardhat run scripts/deploy.js --network localhost

# Keep container running
wait
