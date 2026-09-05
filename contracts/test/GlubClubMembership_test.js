const { expect } = require("chai");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { ethers } = require("hardhat");

describe("GlubClubMembership", function () {
  async function deployFixture() {
    const [owner, safe, alice, bob] = await ethers.getSigners();

    const Membership = await ethers.getContractFactory("GlubClubMembership");
    const membership = await Membership.deploy(
      "GlubClub Membership",
      "GLUBM",
      3, // maxSupply — small on purpose, to make cap enforcement easy to hit
      ethers.parseEther("0.1"),
      "ipfs://base/",
      safe.address, // proceedsRecipient
      safe.address // owner
    );
    await membership.waitForDeployment();

    return { membership, owner, safe, alice, bob };
  }

  describe("mint cap enforcement", function () {
    it("allows minting up to maxSupply", async function () {
      const { membership, safe, alice, bob } = await loadFixture(deployFixture);
      await membership.connect(safe).setPublicMintOpen(true);

      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });
      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });
      await membership.connect(bob).publicMint({ value: ethers.parseEther("0.1") });

      expect(await membership.totalSupply()).to.equal(3);
    });

    it("reverts once maxSupply is reached", async function () {
      const { membership, safe, alice } = await loadFixture(deployFixture);
      await membership.connect(safe).setPublicMintOpen(true);

      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });
      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });
      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });

      await expect(
        membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("GlubClubMembership: sold out");
    });

    it("reverts public mint below mintPrice", async function () {
      const { membership, safe, alice } = await loadFixture(deployFixture);
      await membership.connect(safe).setPublicMintOpen(true);

      await expect(
        membership.connect(alice).publicMint({ value: ethers.parseEther("0.01") })
      ).to.be.revertedWith("GlubClubMembership: insufficient payment");
    });

    it("reverts public mint while closed", async function () {
      const { membership, alice } = await loadFixture(deployFixture);
      await expect(
        membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("GlubClubMembership: public mint closed");
    });

    it("enforces the allowlist merkle root and single-claim-per-address", async function () {
      const { membership, safe, owner, alice, bob } = await loadFixture(deployFixture);

      const leafAlice = ethers.keccak256(ethers.solidityPacked(["address"], [alice.address]));
      const leafBob = ethers.keccak256(ethers.solidityPacked(["address"], [bob.address]));
      const [first, second] = leafAlice < leafBob ? [leafAlice, leafBob] : [leafBob, leafAlice];
      const root = ethers.keccak256(ethers.concat([first, second]));

      await membership.connect(safe).setAllowlistMerkleRoot(root);

      await expect(
        membership.connect(owner).allowlistMint([leafAlice], { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("GlubClubMembership: not on allowlist");

      await membership.connect(bob).allowlistMint([leafAlice], { value: ethers.parseEther("0.1") });
      expect(await membership.balanceOf(bob.address)).to.equal(1);

      await membership.connect(alice).allowlistMint([leafBob], { value: ethers.parseEther("0.1") });
      expect(await membership.balanceOf(alice.address)).to.equal(1);

      await expect(
        membership.connect(alice).allowlistMint([leafBob], { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("GlubClubMembership: already claimed");
    });
  });

  describe("pause / unpause", function () {
    it("blocks transfers while paused, allows them again after unpause", async function () {
      const { membership, safe, alice, bob } = await loadFixture(deployFixture);
      await membership.connect(safe).setPublicMintOpen(true);
      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });

      await membership.connect(safe).pause();
      await expect(
        membership.connect(alice).transferFrom(alice.address, bob.address, 1)
      ).to.be.revertedWithCustomError(membership, "EnforcedPause");

      await expect(
        membership.connect(bob).publicMint({ value: ethers.parseEther("0.1") })
      ).to.be.revertedWithCustomError(membership, "EnforcedPause");

      await membership.connect(safe).unpause();
      await membership.connect(alice).transferFrom(alice.address, bob.address, 1);
      expect(await membership.ownerOf(1)).to.equal(bob.address);
    });

    it("only the owner can pause/unpause", async function () {
      const { membership, alice } = await loadFixture(deployFixture);
      await expect(membership.connect(alice).pause()).to.be.revertedWithCustomError(
        membership,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("value can only leave via withdrawProceeds()", function () {
    it("only mint functions accept ETH in", async function () {
      const { membership } = await loadFixture(deployFixture);
      const payableFns = membership.interface.fragments
        .filter((f) => f.type === "function" && f.stateMutability === "payable")
        .map((f) => f.name)
        .sort();
      expect(payableFns).to.deep.equal(["allowlistMint", "publicMint"]);
    });

    it("accumulates ETH from mints and only the owner can withdraw it, to proceedsRecipient", async function () {
      const { membership, safe, alice } = await loadFixture(deployFixture);
      await membership.connect(safe).setPublicMintOpen(true);
      await membership.connect(alice).publicMint({ value: ethers.parseEther("0.1") });

      expect(await ethers.provider.getBalance(await membership.getAddress())).to.equal(
        ethers.parseEther("0.1")
      );

      await expect(membership.connect(alice).withdrawProceeds()).to.be.revertedWithCustomError(
        membership,
        "OwnableUnauthorizedAccount"
      );

      const before = await ethers.provider.getBalance(safe.address);
      const tx = await membership.connect(safe).withdrawProceeds();
      const receipt = await tx.wait();
      const gasCost = receipt.gasUsed * receipt.gasPrice;
      const after = await ethers.provider.getBalance(safe.address);

      expect(after - before + gasCost).to.equal(ethers.parseEther("0.1"));
      expect(await ethers.provider.getBalance(await membership.getAddress())).to.equal(0);
    });
  });
});
