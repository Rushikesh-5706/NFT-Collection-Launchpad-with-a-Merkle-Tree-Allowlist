// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MyNFT is ERC721, Ownable, ERC2981 {
    using Strings for uint256;

    enum SaleState {
        Paused,
        Allowlist,
        Public
    }

    SaleState public saleState;
    bytes32 public merkleRoot;
    
    // Constants
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 5;
    
    // State
    uint256 public totalSupply;
    uint256 public price = 0.01 ether;
    string public baseURI;
    string public revealedURI;
    bool public isRevealed;

    mapping(address => uint256) public mintedPerWallet;

    // Custom Errors
    error SaleNotActive();
    error MaxSupplyExceeded();
    error MaxPerWalletExceeded();
    error InsufficientPayment();
    error InvalidMerkleProof();
    error TransferFailed();

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _initialBaseURI
    ) ERC721(_name, _symbol) Ownable(msg.sender) {
        baseURI = _initialBaseURI;
        // Set default royalty to 5%
        _setDefaultRoyalty(msg.sender, 500);
    }

    // --- Minting Functions ---

    function allowlistMint(bytes32[] calldata merkleProof, uint256 quantity) external payable {
        if (saleState != SaleState.Allowlist) revert SaleNotActive();
        if (totalSupply + quantity > MAX_SUPPLY) revert MaxSupplyExceeded();
        if (mintedPerWallet[msg.sender] + quantity > MAX_PER_WALLET) revert MaxPerWalletExceeded();
        if (msg.value != price * quantity) revert InsufficientPayment();

        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(merkleProof, merkleRoot, leaf)) revert InvalidMerkleProof();

        _mintTokens(msg.sender, quantity);
    }

    function publicMint(uint256 quantity) external payable {
        if (saleState != SaleState.Public) revert SaleNotActive();
        if (totalSupply + quantity > MAX_SUPPLY) revert MaxSupplyExceeded();
        // Note: MAX_PER_WALLET applies to total minted, including allowlist
        if (mintedPerWallet[msg.sender] + quantity > MAX_PER_WALLET) revert MaxPerWalletExceeded();
        if (msg.value != price * quantity) revert InsufficientPayment();

        _mintTokens(msg.sender, quantity);
    }

    function _mintTokens(address to, uint256 quantity) internal {
        // Optimization: Use locally cached total supply
        uint256 _totalSupply = totalSupply;
        
        mintedPerWallet[to] += quantity;
        totalSupply += quantity;

        for (uint256 i = 0; i < quantity; i++) {
            _safeMint(to, _totalSupply + 1 + i);
        }
    }

    // --- View Functions ---

    function tokenURI(uint256 tokenId) public view virtual override returns (string memory) {
        _requireOwned(tokenId);

        if (isRevealed) {
             return string(abi.encodePacked(revealedURI, tokenId.toString(), ".json"));
        } 
        
        // If not revealed, return the baseURI (placeholder)
        // Adjust logic if baseURI should be a direct link to a single JSON vs folder
        return string(abi.encodePacked(baseURI, tokenId.toString(), ".json"));
    }

    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // --- Owner Functions ---

    function setPrice(uint256 newPrice) external onlyOwner {
        price = newPrice;
    }

    function setBaseURI(string calldata newBaseURI) external onlyOwner {
        baseURI = newBaseURI;
    }

    function setRevealedURI(string calldata newRevealedURI) external onlyOwner {
        revealedURI = newRevealedURI;
    }

    function setMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        merkleRoot = newMerkleRoot;
    }

    function setSaleState(SaleState newState) external onlyOwner {
        saleState = newState;
    }

    function reveal() external onlyOwner {
        isRevealed = true;
    }

    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool success, ) = payable(owner()).call{value: balance}("");
        if (!success) revert TransferFailed();
    }
}
