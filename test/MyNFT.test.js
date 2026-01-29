const { expect } = require("chai");
const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MyNFT", function () {
    let MyNFT;
    let myNFT;
    let owner;
    let addr1;
    let addr2;
    let addrs;
    let merkleTree;
    let root;

    beforeEach(async function () {
        [owner, addr1, addr2, ...addrs] = await hre.ethers.getSigners();

        // Setup Merkle Tree (Use Buffer to match abi.encodePacked)
        const allowlist = [owner.address, addr1.address];
        const leaves = allowlist.map((addr) => keccak256(Buffer.from(addr.replace("0x", ""), "hex")));
        merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        root = merkleTree.getHexRoot();

        MyNFT = await hre.ethers.getContractFactory("MyNFT");
        myNFT = await MyNFT.deploy("TestNFT", "TNFT", "ipfs://initial/");
        await myNFT.waitForDeployment();
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await myNFT.owner()).to.equal(owner.address);
        });

        it("Should have correct initial state", async function () {
            expect(await myNFT.saleState()).to.equal(0); // Paused
            expect(await myNFT.isRevealed()).to.equal(false);
        });
    });

    describe("Allowlist Minting", function () {
        it("Should allow minting for allowlisted users", async function () {
            await myNFT.unpause(1); // Allowlist
            await myNFT.setMerkleRoot(root);

            const leaf = keccak256(Buffer.from(addr1.address.replace("0x", ""), "hex"));
            const proof = merkleTree.getHexProof(leaf);

            await myNFT.connect(addr1).allowlistMint(proof, 1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
        });

        it("Should fail for non-allowlisted users", async function () {
            await myNFT.unpause(1); // Allowlist
            await myNFT.setMerkleRoot(root);

            const leaf = keccak256(Buffer.from(addr2.address.replace("0x", ""), "hex"));
            const proof = merkleTree.getHexProof(leaf);

            await expect(
                myNFT.connect(addr2).allowlistMint(proof, 1, { value: hre.ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(myNFT, "InvalidMerkleProof");
        });
    });

    describe("Public Minting", function () {
        it("Should allow public minting when active", async function () {
            await myNFT.unpause(2); // Public

            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.balanceOf(addr2.address)).to.equal(1);
        });
    });
});
