const hre = require("hardhat");

async function main() {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", deployer.address);

    // Default values
    const name = "MyNFT";
    const symbol = "MNFT";
    const baseURI = "ipfs://QmPlaceholder/";

    const MyNFT = await hre.ethers.getContractFactory("MyNFT");
    const myNFT = await MyNFT.deploy(name, symbol, baseURI);

    await myNFT.waitForDeployment();

    const address = await myNFT.getAddress();
    console.log("----------------------------------------------------");
    console.log(`Contract Deployed to: ${address}`);
    console.log("----------------------------------------------------");
    console.log("To verify on Etherscan:");
    console.log(`npx hardhat verify --network sepolia ${address} "TestNFT" "TNFT" "ipfs://initial/"`);
    console.log("----------------------------------------------------");

    // Copy ABI to frontend
    const fs = require("fs");
    const path = require("path");
    const frontendContractsDir = path.join(__dirname, "../frontend/contracts");

    if (!fs.existsSync(frontendContractsDir)) {
        fs.mkdirSync(frontendContractsDir, { recursive: true });
    }

    const artifact = artifacts.readArtifactSync("MyNFT");
    fs.writeFileSync(
        path.join(frontendContractsDir, "MyNFT.json"),
        JSON.stringify(artifact, null, 2)
    );
    console.log("✅ ABI copied to frontend/contracts/MyNFT.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
