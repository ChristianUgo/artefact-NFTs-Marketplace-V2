const fs = require("fs");
const path = require("path");
const hre = require("hardhat");

async function main() {
  if (hre.network.name === "amoy" && !process.env.DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY is required for an Amoy deployment. Use a funded test-only wallet.");
  }

  const Marketplace = await hre.ethers.getContractFactory("NFTMarketplace");
  const marketplace = await Marketplace.deploy();
  await marketplace.waitForDeployment();

  const address = await marketplace.getAddress();
  const projectRoot = path.join(__dirname, "..");
  const deploymentDirectory = path.join(projectRoot, "deployments");
  const deploymentFile = path.join(deploymentDirectory, `${hre.network.name}.json`);
  const network = await hre.ethers.provider.getNetwork();

  fs.mkdirSync(deploymentDirectory, { recursive: true });
  fs.writeFileSync(deploymentFile, `${JSON.stringify({
    network: hre.network.name,
    chainId: Number(network.chainId),
    contractAddress: address,
    deployedAt: new Date().toISOString(),
  }, null, 2)}\n`);

  if (hre.network.name === "localhost") {
    const addressFile = path.join(projectRoot, "src", "lib", "contract-address.js");
    fs.writeFileSync(addressFile, `export const CONTRACT_ADDRESS = "${address}";\n`);
  }

  console.log(`NFTMarketplace deployed to ${address} on ${hre.network.name}`);
  console.log(`Deployment record written to ${deploymentFile}`);
  if (hre.network.name === "amoy") {
    console.log(`Set NEXT_PUBLIC_CONTRACT_ADDRESS=${address} in Vercel before rebuilding the frontend.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
