const hre = require("hardhat");

// Testnet-only deployment script. Do not point this at a mainnet network
// config — none exists in hardhat.config.js on purpose (see comment there).
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying from:", deployer.address);

  const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
  if (!SAFE_ADDRESS) {
    throw new Error("Set SAFE_ADDRESS env var to the testnet Safe multisig address");
  }

  const Token = await hre.ethers.getContractFactory("GlubClubToken");
  const token = await Token.deploy(
    "GlubClub Token",
    "GLUB",
    hre.ethers.parseUnits("100000000", 18),
    SAFE_ADDRESS
  );
  await token.waitForDeployment();
  console.log("GlubClubToken:", await token.getAddress());

  const Membership = await hre.ethers.getContractFactory("GlubClubMembership");
  const membership = await Membership.deploy(
    "GlubClub Membership",
    "GLUBM",
    3333,
    hre.ethers.parseEther("0.01"),
    "ipfs://PLACEHOLDER/",
    SAFE_ADDRESS,
    SAFE_ADDRESS
  );
  await membership.waitForDeployment();
  console.log("GlubClubMembership:", await membership.getAddress());

  const Staking = await hre.ethers.getContractFactory("GlubClubStaking");
  const staking = await Staking.deploy(
    await token.getAddress(),
    await membership.getAddress(),
    SAFE_ADDRESS
  );
  await staking.waitForDeployment();
  console.log("GlubClubStaking:", await staking.getAddress());
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
