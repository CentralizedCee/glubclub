// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title GlubClub Tier Staking
/// @notice Locks GLUB tokens and/or a Membership Pass to unlock access
/// tiers, perks, and governance standing.
///
/// IMPORTANT — this contract is bookkeeping only. It does NOT mint,
/// transfer, or distribute any reward token, ETH, or other value to
/// stakers, and it never reads a treasury balance or price feed. Do not
/// add payout/reward logic here — see /contracts/CLAUDE.md ("Out of
/// scope") and /content/WORDING-RULES.md. Tiers unlock perks; they are not
/// a payout mechanism.
contract GlubClubStaking is Ownable, Pausable, ReentrancyGuard, IERC721Receiver {
    using SafeERC20 for IERC20;

    IERC20 public immutable stakingToken;
    IERC721 public immutable membershipNFT;

    struct TokenStake {
        uint256 amount;
        uint256 since; // timestamp the current stake began (resets on top-up)
    }

    struct TierThreshold {
        uint256 minAmount;
        uint256 minDuration; // seconds the stake must have been held
    }

    mapping(address => TokenStake) public tokenStakes;
    mapping(address => uint256[]) private _stakedNFTs; // owner => tokenIds
    mapping(uint256 => address) public nftStaker; // tokenId => owner

    /// @dev Ascending order; tiers[0] is the lowest paid tier (tier index 1).
    TierThreshold[] public tiers;

    event TokensStaked(address indexed user, uint256 amount, uint256 newTotal);
    event TokensUnstaked(address indexed user, uint256 amount, uint256 newTotal);
    event NFTStaked(address indexed user, uint256 indexed tokenId);
    event NFTUnstaked(address indexed user, uint256 indexed tokenId);
    event TiersUpdated();

    constructor(address stakingToken_, address membershipNFT_, address initialOwner)
        Ownable(initialOwner)
    {
        stakingToken = IERC20(stakingToken_);
        membershipNFT = IERC721(membershipNFT_);
    }

    // --- Token staking ---

    function stakeTokens(uint256 amount) external whenNotPaused nonReentrant {
        require(amount > 0, "GlubClubStaking: amount is zero");
        TokenStake storage s = tokenStakes[msg.sender];
        stakingToken.safeTransferFrom(msg.sender, address(this), amount);

        // Weighted-average entry time: a top-up pulls the effective start
        // time forward proportionally to how much new stake it adds,
        // instead of wiping accumulated duration credit outright. A first
        // stake (s.amount == 0) simply starts the clock now.
        if (s.amount == 0) {
            s.since = block.timestamp;
        } else {
            uint256 elapsed = block.timestamp - s.since;
            s.since = block.timestamp - (elapsed * s.amount) / (s.amount + amount);
        }
        s.amount += amount;

        emit TokensStaked(msg.sender, amount, s.amount);
    }

    function unstakeTokens(uint256 amount) external nonReentrant {
        TokenStake storage s = tokenStakes[msg.sender];
        require(amount > 0 && amount <= s.amount, "GlubClubStaking: invalid amount");
        s.amount -= amount;
        if (s.amount == 0) {
            s.since = 0;
        }
        stakingToken.safeTransfer(msg.sender, amount);
        emit TokensUnstaked(msg.sender, amount, s.amount);
    }

    // --- NFT staking ---

    function stakeNFT(uint256 tokenId) external whenNotPaused nonReentrant {
        membershipNFT.safeTransferFrom(msg.sender, address(this), tokenId);
        nftStaker[tokenId] = msg.sender;
        _stakedNFTs[msg.sender].push(tokenId);
        emit NFTStaked(msg.sender, tokenId);
    }

    function unstakeNFT(uint256 tokenId) external nonReentrant {
        require(nftStaker[tokenId] == msg.sender, "GlubClubStaking: not staker");
        delete nftStaker[tokenId];
        _removeStakedNFT(msg.sender, tokenId);
        membershipNFT.safeTransferFrom(address(this), msg.sender, tokenId);
        emit NFTUnstaked(msg.sender, tokenId);
    }

    function stakedNFTsOf(address user) external view returns (uint256[] memory) {
        return _stakedNFTs[user];
    }

    function _removeStakedNFT(address user, uint256 tokenId) internal {
        uint256[] storage list = _stakedNFTs[user];
        uint256 len = list.length;
        for (uint256 i = 0; i < len; i++) {
            if (list[i] == tokenId) {
                list[i] = list[len - 1];
                list.pop();
                break;
            }
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata)
        external
        pure
        override
        returns (bytes4)
    {
        return IERC721Receiver.onERC721Received.selector;
    }

    // --- Tier lookup (view-only access-level signal; never moves value) ---

    /// @notice Current tier index for `user` (0 = no tier), based on staked
    /// GLUB amount and how long the current stake has been held. The
    /// frontend and any off-chain role bot read this to grant access
    /// levels — it is informational only.
    function tierOf(address user) external view returns (uint256) {
        TokenStake memory s = tokenStakes[user];
        uint256 tier = 0;
        uint256 len = tiers.length;
        for (uint256 i = 0; i < len; i++) {
            if (
                s.amount >= tiers[i].minAmount &&
                s.since != 0 &&
                block.timestamp - s.since >= tiers[i].minDuration
            ) {
                tier = i + 1;
            }
        }
        return tier;
    }

    function setTiers(TierThreshold[] calldata newTiers) external onlyOwner {
        delete tiers;
        for (uint256 i = 0; i < newTiers.length; i++) {
            tiers.push(newTiers[i]);
        }
        emit TiersUpdated();
    }

    function tiersLength() external view returns (uint256) {
        return tiers.length;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }
}
