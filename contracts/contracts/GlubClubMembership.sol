// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721Enumerable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import {ERC721Burnable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import {ERC721Pausable} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import {ERC2981} from "@openzeppelin/contracts/token/common/ERC2981.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {MerkleProof} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

/// @title GlubClub Membership Pass (community/access pass)
/// @notice ERC-721 access pass. Ownership grants community membership,
/// roles, and eligibility for token-staking tiers. It is not an investment
/// product: it carries no claim on company reserves, no entitlement to
/// treasury performance, and no payout of any kind. See
/// /content/WORDING-RULES.md.
contract GlubClubMembership is
    ERC721,
    ERC721Enumerable,
    ERC721Burnable,
    ERC721Pausable,
    ERC2981,
    Ownable
{
    uint256 public immutable maxSupply;
    uint256 public mintPrice;
    string private _baseTokenURI;

    /// @notice Destination for mint proceeds — set once at deployment to
    /// the project's Safe{Wallet} multisig address. Proceeds only move
    /// when the owner explicitly calls withdrawProceeds(); nothing here
    /// moves funds automatically.
    address payable public immutable proceedsRecipient;

    bool public publicMintOpen;
    bytes32 public allowlistMerkleRoot;
    mapping(address => bool) public allowlistClaimed;

    uint256 private _nextTokenId = 1;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        uint256 mintPrice_,
        string memory baseTokenURI_,
        address payable proceedsRecipient_,
        address initialOwner
    ) ERC721(name_, symbol_) Ownable(initialOwner) {
        maxSupply = maxSupply_;
        mintPrice = mintPrice_;
        _baseTokenURI = baseTokenURI_;
        proceedsRecipient = proceedsRecipient_;
        // Standard ERC-2981 secondary-market royalty (5%) paid to the same
        // recipient as mint proceeds. This is an ordinary NFT creator
        // royalty, not a treasury-performance-linked payment.
        _setDefaultRoyalty(proceedsRecipient_, 500);
    }

    // --- Minting ---

    function allowlistMint(bytes32[] calldata proof) external payable {
        require(!allowlistClaimed[msg.sender], "GlubClubMembership: already claimed");
        require(
            MerkleProof.verify(proof, allowlistMerkleRoot, keccak256(abi.encodePacked(msg.sender))),
            "GlubClubMembership: not on allowlist"
        );
        allowlistClaimed[msg.sender] = true;
        _mintPass(msg.sender);
    }

    function publicMint() external payable {
        require(publicMintOpen, "GlubClubMembership: public mint closed");
        _mintPass(msg.sender);
    }

    function _mintPass(address to) internal {
        require(msg.value >= mintPrice, "GlubClubMembership: insufficient payment");
        require(_nextTokenId <= maxSupply, "GlubClubMembership: sold out");
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
    }

    // --- Admin (owner should be the Safe{Wallet} multisig) ---

    function setPublicMintOpen(bool open) external onlyOwner {
        publicMintOpen = open;
    }

    function setAllowlistMerkleRoot(bytes32 root) external onlyOwner {
        allowlistMerkleRoot = root;
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function setBaseURI(string calldata baseURI_) external onlyOwner {
        _baseTokenURI = baseURI_;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    /// @notice Sends all accumulated mint proceeds to proceedsRecipient.
    /// Requires an explicit owner (multisig) transaction every time.
    function withdrawProceeds() external onlyOwner {
        uint256 balance = address(this).balance;
        (bool sent, ) = proceedsRecipient.call{value: balance}("");
        require(sent, "GlubClubMembership: withdraw failed");
    }

    // --- Required overrides for multiple inheritance (OZ v5 pattern) ---

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721, ERC721Enumerable, ERC721Pausable)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721, ERC721Enumerable)
    {
        super._increaseBalance(account, value);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
