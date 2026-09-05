const { expect } = require("chai");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("GlubClubToken", function () {
  const MAX_SUPPLY = ethers.parseUnits("1000", 18);

  async function deployFixture() {
    const [owner, safe, alice] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("GlubClubToken");
    const token = await Token.deploy("GlubClub Token", "GLUB", MAX_SUPPLY, safe.address);
    await token.waitForDeployment();

    return { token, owner, safe, alice };
  }

  describe("mint cap enforcement", function () {
    it("allows minting up to maxSupply", async function () {
      const { token, safe, alice } = await loadFixture(deployFixture);
      await token.connect(safe).mint(alice.address, MAX_SUPPLY);
      expect(await token.totalSupply()).to.equal(MAX_SUPPLY);
    });

    it("reverts a mint that would exceed maxSupply", async function () {
      const { token, safe, alice } = await loadFixture(deployFixture);
      await token.connect(safe).mint(alice.address, MAX_SUPPLY);
      await expect(token.connect(safe).mint(alice.address, 1)).to.be.revertedWith(
        "GlubClubToken: exceeds max supply"
      );
    });

    it("only the owner can mint", async function () {
      const { token, alice } = await loadFixture(deployFixture);
      await expect(token.connect(alice).mint(alice.address, 1)).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("pause / unpause", function () {
    it("blocks transfers while paused, allows them again after unpause", async function () {
      const { token, safe, alice, owner } = await loadFixture(deployFixture);
      await token.connect(safe).mint(alice.address, ethers.parseUnits("10", 18));

      await token.connect(safe).pause();
      await expect(
        token.connect(alice).transfer(owner.address, ethers.parseUnits("1", 18))
      ).to.be.revertedWithCustomError(token, "EnforcedPause");

      await token.connect(safe).unpause();
      await token.connect(alice).transfer(owner.address, ethers.parseUnits("1", 18));
      expect(await token.balanceOf(owner.address)).to.equal(ethers.parseUnits("1", 18));
    });

    it("only the owner can pause/unpause", async function () {
      const { token, alice } = await loadFixture(deployFixture);
      await expect(token.connect(alice).pause()).to.be.revertedWithCustomError(
        token,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("no value-moving function besides ordinary ERC-20 transfer", function () {
    it("exposes no payable functions at all — GLUB never touches ETH", async function () {
      const { token } = await loadFixture(deployFixture);
      const payableFns = token.interface.fragments.filter(
        (f) => f.type === "function" && f.stateMutability === "payable"
      );
      expect(payableFns).to.have.length(0);
    });
  });
});
