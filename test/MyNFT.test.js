const { expect } = require("chai");
const hre = require("hardhat");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("MyNFT (Production Grade)", function () {
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

        const allowlist = [owner.address, addr1.address];
        const leaves = allowlist.map((addr) => keccak256(Buffer.from(addr.replace("0x", ""), "hex")));
        merkleTree = new MerkleTree(leaves, keccak256, { sortPairs: true });
        root = merkleTree.getHexRoot();

        MyNFT = await hre.ethers.getContractFactory("MyNFT");
        myNFT = await MyNFT.deploy("TestNFT", "TNFT", "ipfs://initial/");
        await myNFT.waitForDeployment();
    });

    describe("System & Interface Compliance", function () {
        it("Should support ERC721 interface (0x80ac58cd)", async function () {
            expect(await myNFT.supportsInterface("0x80ac58cd")).to.be.true;
        });

        it("Should support ERC2981 interface (0x2a55205a)", async function () {
            expect(await myNFT.supportsInterface("0x2a55205a")).to.be.true;
        });

        it("Should support ERC165 interface (0x01ffc9a7)", async function () {
            expect(await myNFT.supportsInterface("0x01ffc9a7")).to.be.true;
        });
    });

    describe("Security & Constraints", function () {
        it("Should revert minting when Sale is Paused", async function () {
            // Explicitly pause (though it is paused by default)
            await myNFT.pause();
            await expect(myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") }))
                .to.be.revertedWithCustomError(myNFT, "SaleNotActive");
        });

        it("Should reject 0 quantity mints", async function () {
            await myNFT.unpause(2); // Public
            await expect(myNFT.connect(addr2).publicMint(0, { value: 0 }))
                .to.be.revertedWithCustomError(myNFT, "InvalidQuantity");
        });

        it("Should prevent withdrawal if balance is 0", async function () {
            await expect(myNFT.withdraw()).to.be.revertedWithCustomError(myNFT, "NoFundsToWithdraw");
        });

        it("Should allow owner to update royalties", async function () {
            await myNFT.setRoyalty(addr1.address, 1000); // 10%
            const [receiver, amount] = await myNFT.royaltyInfo(1, 10000);
            expect(receiver).to.equal(addr1.address);
            expect(amount).to.equal(1000);
        });

        it("Should correctly track withdrawals (Balance Delta)", async function () {
            await myNFT.unpause(2); // Public
            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });

            const initialOwnerBal = await hre.ethers.provider.getBalance(owner.address);
            const contractBal = await hre.ethers.provider.getBalance(await myNFT.getAddress());
            expect(contractBal).to.equal(hre.ethers.parseEther("0.01"));

            const tx = await myNFT.withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            const finalOwnerBal = await hre.ethers.provider.getBalance(owner.address);

            // Final = Initial + ContractBal - Gas
            expect(finalOwnerBal).to.equal(initialOwnerBal + contractBal - gasUsed);
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

        it("Should check Max Per Wallet limit", async function () {
            await myNFT.unpause(2); // Public
            // Mint 5 (Max)
            await myNFT.connect(addr2).publicMint(5, { value: hre.ethers.parseEther("0.05") });

            // Try to mint 1 more
            await expect(
                myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(myNFT, "MaxPerWalletExceeded");
        });
    });
});
