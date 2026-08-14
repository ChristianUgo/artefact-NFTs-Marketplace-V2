const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  const addressFile = path.join(__dirname, "..", "src", "lib", "contract-address.js");
  fs.writeFileSync(
    addressFile,
    `export const CONTRACT_ADDRESS = "${address}";\n`
  );

  console.log(`NFTMarketplace deployed to ${address}`);
  console.log("Version 2 contract address updated in src/lib/contract-address.js");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
