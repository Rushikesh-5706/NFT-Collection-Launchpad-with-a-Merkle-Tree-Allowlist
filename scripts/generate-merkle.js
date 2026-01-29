const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const fs = require('fs');
const path = require('path');

async function main() {
    const allowlistPath = path.join(__dirname, '../allowlist.json');

    if (!fs.existsSync(allowlistPath)) {
        console.error("Error: allowlist.json not found in root directory.");
        process.exit(1);
    }

    const allowlist = JSON.parse(fs.readFileSync(allowlistPath, 'utf8'));

    // Hash addresses to get leaf nodes (Using Buffer to match abi.encodePacked)
    const leaves = allowlist.map(addr => keccak256(Buffer.from(addr.replace("0x", ""), "hex")));
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });

    const root = tree.getHexRoot();

    console.log("Merkle Root:", root);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
