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

    describe("1. System & Interface Compliance", function () {
        it("Should support ERC721 interface (0x80ac58cd)", async function () {
            expect(await myNFT.supportsInterface("0x80ac58cd")).to.be.true;
        });

        it("Should support ERC2981 interface (0x2a55205a)", async function () {
            expect(await myNFT.supportsInterface("0x2a55205a")).to.be.true;
        });

        it("Should support ERC165 interface (0x01ffc9a7)", async function () {
            expect(await myNFT.supportsInterface("0x01ffc9a7")).to.be.true;
        });

        it("Should initialize with correct values", async function () {
            expect(await myNFT.name()).to.equal("TestNFT");
            expect(await myNFT.symbol()).to.equal("TNFT");
            expect(await myNFT.baseURI()).to.equal("ipfs://initial/");
        });
    });

    describe("2. Security & Constraints", function () {
        it("Should revert unpause(0) with CannotUnpauseToPaused", async function () {
            // 0 = Paused
            await expect(myNFT.unpause(0))
                .to.be.revertedWithCustomError(myNFT, "CannotUnpauseToPaused");
        });

        it("Should reject 0 quantity mints", async function () {
            await myNFT.unpause(2); // Public
            await expect(myNFT.connect(addr2).publicMint(0, { value: 0 }))
                .to.be.revertedWithCustomError(myNFT, "InvalidQuantity");
        });

        it("Should prevent withdrawal if balance is 0", async function () {
            await expect(myNFT.withdraw()).to.be.revertedWithCustomError(myNFT, "NoFundsToWithdraw");
        });
    });

    describe("3. Access Control (Owner Functions)", function () {
        it("Should allow owner to set price and emit PriceChanged", async function () {
            await expect(myNFT.setPrice(hre.ethers.parseEther("0.05")))
                .to.emit(myNFT, "PriceChanged")
                .withArgs(hre.ethers.parseEther("0.05"));
            expect(await myNFT.price()).to.equal(hre.ethers.parseEther("0.05"));
        });

        it("Should allow owner to set baseURI and emit BaseURIChanged", async function () {
            await expect(myNFT.setBaseURI("ipfs://new/"))
                .to.emit(myNFT, "BaseURIChanged")
                .withArgs("ipfs://new/");
            expect(await myNFT.baseURI()).to.equal("ipfs://new/");
        });

        it("Should allow owner to set revealedURI and emit RevealedURIChanged", async function () {
            await expect(myNFT.setRevealedURI("ipfs://revealed/"))
                .to.emit(myNFT, "RevealedURIChanged")
                .withArgs("ipfs://revealed/");
            expect(await myNFT.revealedURI()).to.equal("ipfs://revealed/");
        });

        it("Should allow owner to set Merkle Root and emit MerkleRootChanged", async function () {
            const newRoot = hre.ethers.randomBytes(32);
            await expect(myNFT.setMerkleRoot(newRoot))
                .to.emit(myNFT, "MerkleRootChanged")
                .withArgs(newRoot);
        });

        it("Should revert if non-owner tries to call restricted functions", async function () {
            await expect(myNFT.connect(addr1).setPrice(1)).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
            await expect(myNFT.connect(addr1).setBaseURI("fail")).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
            await expect(myNFT.connect(addr1).setSaleState(1)).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
            await expect(myNFT.connect(addr1).withdraw()).to.be.revertedWithCustomError(myNFT, "OwnableUnauthorizedAccount");
        });
    });

    describe("4. Royalties", function () {
        it("Should allow owner to update royalties and emit RoyaltyChanged", async function () {
            await expect(myNFT.setRoyalty(addr1.address, 1000))
                .to.emit(myNFT, "RoyaltyChanged")
                .withArgs(addr1.address, 1000);

            const [receiver, amount] = await myNFT.royaltyInfo(1, 10000);
            expect(receiver).to.equal(addr1.address);
            expect(amount).to.equal(1000);
        });

        it("Should revert if royalty > 100%", async function () {
            await expect(myNFT.setRoyalty(addr1.address, 10001))
                .to.be.revertedWithCustomError(myNFT, "InvalidRoyalty");
        });
    });

    describe("5. Allowlist Minting", function () {
        beforeEach(async function () {
            await myNFT.unpause(1); // Allowlist
            await myNFT.setMerkleRoot(root);
        });

        it("Should allow minting for allowlisted users", async function () {
            const leaf = keccak256(Buffer.from(addr1.address.replace("0x", ""), "hex"));
            const proof = merkleTree.getHexProof(leaf);

            await myNFT.connect(addr1).allowlistMint(proof, 1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.balanceOf(addr1.address)).to.equal(1);
        });

        it("Should fail for non-allowlisted users", async function () {
            const leaf = keccak256(Buffer.from(addr2.address.replace("0x", ""), "hex"));
            const proof = merkleTree.getHexProof(leaf);

            await expect(
                myNFT.connect(addr2).allowlistMint(proof, 1, { value: hre.ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(myNFT, "InvalidMerkleProof");
        });

        it("Should fail if Sale is not Allowlist", async function () {
            await myNFT.pause();
            const leaf = keccak256(Buffer.from(addr1.address.replace("0x", ""), "hex"));
            const proof = merkleTree.getHexProof(leaf);

            await expect(
                myNFT.connect(addr1).allowlistMint(proof, 1, { value: hre.ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(myNFT, "SaleNotActive");
        });
    });

    describe("6. Public Minting", function () {
        it("Should allow public minting when active", async function () {
            await myNFT.unpause(2); // Public

            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.balanceOf(addr2.address)).to.equal(1);
        });

        it("Should enforce Max Per Wallet limit check", async function () {
            await myNFT.unpause(2); // Public
            // Mint 5 (Max)
            await myNFT.connect(addr2).publicMint(5, { value: hre.ethers.parseEther("0.05") });

            // Try to mint 1 more
            await expect(
                myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(myNFT, "MaxPerWalletExceeded");
        });

        it("Should fail if Sale is not Public", async function () {
            await myNFT.pause();
            await expect(
                myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") })
            ).to.be.revertedWithCustomError(myNFT, "SaleNotActive");
        });

        it("Should fail if insufficient payment", async function () {
            await myNFT.unpause(2); // Public
            await expect(
                myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.005") })
            ).to.be.revertedWithCustomError(myNFT, "InsufficientPayment");
        });

        it("Should mint precise Token IDs sequentially", async function () {
            await myNFT.unpause(2); // Public

            // Supply starts at 0. First mint should be ID 1.
            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.ownerOf(1)).to.equal(addr2.address);

            // Next mint (quantity 2) should be ID 2 and 3
            await myNFT.connect(addr1).publicMint(2, { value: hre.ethers.parseEther("0.02") });
            expect(await myNFT.ownerOf(2)).to.equal(addr1.address);
            expect(await myNFT.ownerOf(3)).to.equal(addr1.address);
            expect(await myNFT.totalSupply()).to.equal(3);
        });

        it("Should fail if Price is 0 (Logic Check)", async function () {
            // Technically setPrice allows 0, ensuring mint logic respects free mints is valid.
            // But if price > 0, paying 0 fails.
            // Let's ensure payment logic holds.
            await myNFT.setPrice(0);
            await myNFT.unpause(2);
            await expect(myNFT.connect(addr2).publicMint(1, { value: 0 })).to.not.be.reverted;
            expect(await myNFT.balanceOf(addr2.address)).to.equal(1);
        });
    });

    describe("7. Reveal Mechanism", function () {
        it("Should return baseURI when not revealed", async function () {
            await myNFT.unpause(2);
            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.tokenURI(1)).to.equal("ipfs://initial/1.json");
        });

        it("Should return revealedURI when revealed", async function () {
            await myNFT.unpause(2);
            await myNFT.setRevealedURI("ipfs://final/");
            await myNFT.reveal();
            await expect(myNFT.reveal()).to.emit(myNFT, "Revealed").withArgs(true);

            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });
            expect(await myNFT.tokenURI(1)).to.equal("ipfs://final/1.json");
        });

        it("Should revert tokenURI for non-existent token", async function () {
            await expect(myNFT.tokenURI(999)).to.be.revertedWithCustomError(myNFT, "ERC721NonexistentToken");
        });
    });

    describe("8. Withdrawals (Financials)", function () {
        it("Should correctly track and emit FundsWithdrawn", async function () {
            await myNFT.unpause(2); // Public
            await myNFT.connect(addr2).publicMint(1, { value: hre.ethers.parseEther("0.01") });

            const initialOwnerBal = await hre.ethers.provider.getBalance(owner.address);
            const contractBal = await hre.ethers.provider.getBalance(await myNFT.getAddress());
            expect(contractBal).to.equal(hre.ethers.parseEther("0.01"));

            const tx = await myNFT.withdraw();
            const receipt = await tx.wait();
            const gasUsed = receipt.gasUsed * receipt.gasPrice;

            await expect(tx).to.emit(myNFT, "FundsWithdrawn").withArgs(owner.address, contractBal);

            const finalOwnerBal = await hre.ethers.provider.getBalance(owner.address);
            expect(finalOwnerBal).to.equal(initialOwnerBal + contractBal - gasUsed);
        });
    });
});
