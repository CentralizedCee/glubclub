const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("GlubClubStaking", function () {
  async function deployFixture() {
    const [owner, safe, alice, bob] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GlubClubToken");
    const token = await Token.deploy(
      "GlubClub Token",
      "GLUB",
      ethers.parseUnits("1000000", 18),
      safe.address
    );
    await token.waitForDeployment();

    const Membership = await ethers.getContractFactory("GlubClubMembership");
    const membership = await Membership.deploy(
      "GlubClub Membership",
      "GLUBM",
      10,
      0,
      "ipfs://base/",
      safe.address,
      safe.address
    );
    await membership.waitForDeployment();

    const Staking = await ethers.getContractFactory("GlubClubStaking");
    const staking = await Staking.deploy(
      await token.getAddress(),
      await membership.getAddress(),
      safe.address
    );
    await staking.waitForDeployment();

    await token.connect(safe).mint(alice.address, ethers.parseUnits("1000", 18));
    await token.connect(safe).mint(bob.address, ethers.parseUnits("1000", 18));
    await token.connect(alice).approve(await staking.getAddress(), ethers.MaxUint256);
    await token.connect(bob).approve(await staking.getAddress(), ethers.MaxUint256);

    await membership.connect(safe).setPublicMintOpen(true);
    await membership.connect(alice).publicMint();
    await membership.connect(alice).setApprovalForAll(await staking.getAddress(), true);

    return { staking, token, membership, owner, safe, alice, bob };
  }

  describe("weighted-average duration clock", function () {
    it("starts the clock at `since = now` on a first stake", async function () {
      const { staking, alice } = await loadFixture(deployFixture);
      const t0 = (await time.latest()) + 100;
      await time.setNextBlockTimestamp(t0);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      const s = await staking.tokenStakes(alice.address);
      expect(s.since).to.equal(t0);
      expect(s.amount).to.equal(ethers.parseUnits("100", 18));
    });

    it("pulls `since` forward proportionally on top-up, instead of wiping it", async function () {
      const { staking, alice } = await loadFixture(deployFixture);

      const t0 = (await time.latest()) + 100;
      await time.setNextBlockTimestamp(t0);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      const t1 = t0 + 100;
      await time.setNextBlockTimestamp(t1);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      const s = await staking.tokenStakes(alice.address);
      expect(s.since).to.equal(t1 - 50);
      expect(s.amount).to.equal(ethers.parseUnits("200", 18));
      expect(s.since).to.not.equal(t1);
    });

    it("leaves `since` untouched on a partial unstake", async function () {
      const { staking, alice } = await loadFixture(deployFixture);

      const t0 = (await time.latest()) + 100;
      await time.setNextBlockTimestamp(t0);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      await time.increase(500);
      await staking.connect(alice).unstakeTokens(ethers.parseUnits("40", 18));

      const s = await staking.tokenStakes(alice.address);
      expect(s.since).to.equal(t0);
      expect(s.amount).to.equal(ethers.parseUnits("60", 18));
    });

    it("resets `since` to 0 once fully unstaked, and restarts cleanly on re-stake", async function () {
      const { staking, alice } = await loadFixture(deployFixture);

      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));
      await staking.connect(alice).unstakeTokens(ethers.parseUnits("100", 18));

      let s = await staking.tokenStakes(alice.address);
      expect(s.since).to.equal(0);
      expect(s.amount).to.equal(0);

      const t2 = (await time.latest()) + 1000;
      await time.setNextBlockTimestamp(t2);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("50", 18));

      s = await staking.tokenStakes(alice.address);
      expect(s.since).to.equal(t2);
    });
  });

  describe("tierOf correctness (amount + duration thresholds)", function () {
    async function withTiers() {
      const fixture = await deployFixture();
      await fixture.staking.connect(fixture.safe).setTiers([
        { minAmount: ethers.parseUnits("100", 18), minDuration: 0 },
        { minAmount: ethers.parseUnits("100", 18), minDuration: 1000 },
        { minAmount: ethers.parseUnits("300", 18), minDuration: 2000 },
      ]);
      return fixture;
    }

    it("returns tier 0 for an address with no stake", async function () {
      const { staking, bob } = await loadFixture(withTiers);
      expect(await staking.tierOf(bob.address)).to.equal(0);
    });

    it("walks up tiers as amount and duration thresholds are met, and a top-up correctly reduces duration credit rather than wiping it", async function () {
      const { staking, alice } = await loadFixture(withTiers);

      const t0 = (await time.latest()) + 100;
      await time.setNextBlockTimestamp(t0);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      expect(await staking.tierOf(alice.address)).to.equal(1);

      await time.increaseTo(t0 + 1000);
      expect(await staking.tierOf(alice.address)).to.equal(2);

      const t1 = t0 + 1000 + 1;
      const oldAmount = ethers.parseUnits("100", 18);
      const added = ethers.parseUnits("200", 18);
      const elapsed = BigInt(t1) - BigInt(t0);
      const expectedSince = BigInt(t1) - (elapsed * oldAmount) / (oldAmount + added);

      await time.setNextBlockTimestamp(t1);
      await staking.connect(alice).stakeTokens(added);

      const s = await staking.tokenStakes(alice.address);
      expect(s.since).to.equal(expectedSince);

      const creditAfterTopUp = BigInt(t1) - s.since;
      expect(creditAfterTopUp).to.be.greaterThan(0n);
      expect(creditAfterTopUp).to.be.lessThan(1000n);
      expect(await staking.tierOf(alice.address)).to.equal(1);

      await time.increaseTo(Number(s.since) + 1000);
      expect(await staking.tierOf(alice.address)).to.equal(2);

      await time.increaseTo(Number(s.since) + 2000);
      expect(await staking.tierOf(alice.address)).to.equal(3);
    });
  });

  describe("pause / unpause", function () {
    it("blocks new staking while paused, but never blocks unstaking", async function () {
      const { staking, safe, alice } = await loadFixture(deployFixture);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      await staking.connect(safe).pause();
      await expect(
        staking.connect(alice).stakeTokens(ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(staking, "EnforcedPause");

      await expect(staking.connect(alice).unstakeTokens(ethers.parseUnits("100", 18))).to.not.be
        .reverted;

      await staking.connect(safe).unpause();
      await staking.connect(alice).stakeTokens(ethers.parseUnits("1", 18));
    });

    it("only the owner can pause/unpause", async function () {
      const { staking, alice } = await loadFixture(deployFixture);
      await expect(staking.connect(alice).pause()).to.be.revertedWithCustomError(
        staking,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("no function moves out more value than was staked, and the contract holds no ETH path at all", function () {
    it("exposes zero payable functions — GLUB/NFT bookkeeping only, never touches ETH", async function () {
      const { staking } = await loadFixture(deployFixture);
      const payableFns = staking.interface.fragments.filter(
        (f) => f.type === "function" && f.stateMutability === "payable"
      );
      expect(payableFns).to.have.length(0);
    });

    it("unstakeTokens returns exactly the amount requested, never more", async function () {
      const { staking, token, alice } = await loadFixture(deployFixture);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("100", 18));

      const before = await token.balanceOf(alice.address);
      await staking.connect(alice).unstakeTokens(ethers.parseUnits("30", 18));
      const after = await token.balanceOf(alice.address);

      expect(after - before).to.equal(ethers.parseUnits("30", 18));
    });

    it("reverts an unstake for more than is currently staked", async function () {
      const { staking, alice } = await loadFixture(deployFixture);
      await staking.connect(alice).stakeTokens(ethers.parseUnits("10", 18));
      await expect(
        staking.connect(alice).unstakeTokens(ethers.parseUnits("11", 18))
      ).to.be.revertedWith("GlubClubStaking: invalid amount");
    });

    it("only the address that staked an NFT can unstake it", async function () {
      const { staking, membership, alice, bob } = await loadFixture(deployFixture);
      await staking.connect(alice).stakeNFT(1);
      expect(await membership.ownerOf(1)).to.equal(await staking.getAddress());

      await expect(staking.connect(bob).unstakeNFT(1)).to.be.revertedWith(
        "GlubClubStaking: not staker"
      );

      await staking.connect(alice).unstakeNFT(1);
      expect(await membership.ownerOf(1)).to.equal(alice.address);
    });
  });
});
