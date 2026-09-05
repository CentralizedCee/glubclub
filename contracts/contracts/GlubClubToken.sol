// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import {ERC20Votes} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import {Nonces} from "@openzeppelin/contracts/utils/Nonces.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

/// @title GlubClub Utility & Governance Token (GLUB)
/// @notice Utility + governance token only. Holding GLUB grants voting
/// weight and, via the staking contract, tier/perk access — nothing else.
/// This contract contains no dividend, buyback, or treasury-linked payout
/// logic, and none should be added to it. See /content/WORDING-RULES.md
/// and /contracts/CLAUDE.md ("Out of scope") for why.
contract GlubClubToken is ERC20, ERC20Burnable, ERC20Permit, ERC20Votes, Ownable, Pausable {
    /// @notice Hard cap on total supply, fixed at deployment.
    uint256 public immutable maxSupply;

    constructor(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        address initialOwner
    ) ERC20(name_, symbol_) ERC20Permit(name_) Ownable(initialOwner) {
        maxSupply = maxSupply_;
    }

    /// @notice Owner-gated mint, capped at maxSupply. Intended for initial
    /// distribution (community allocation, liquidity, governance
    /// operations) — not a recurring rewards faucet. The owner should be
    /// the project's Safe{Wallet} multisig, so every mint requires an
    /// explicit multisig transaction.
    function mint(address to, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "GlubClubToken: exceeds max supply");
        _mint(to, amount);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // --- Required overrides for multiple inheritance (OZ v5 pattern) ---

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Votes)
        whenNotPaused
    {
        super._update(from, to, value);
    }

    function nonces(address owner)
        public
        view
        override(ERC20Permit, Nonces)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}
