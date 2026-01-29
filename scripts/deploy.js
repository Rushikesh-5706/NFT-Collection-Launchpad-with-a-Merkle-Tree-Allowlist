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
    console.log("MyNFT deployed to:", address);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
