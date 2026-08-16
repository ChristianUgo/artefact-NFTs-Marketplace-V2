const fs = require("fs");
const path = require("path");

const projectRoot = path.join(__dirname, "..");
const source = path.join(projectRoot, "artifacts", "contracts", "NFTMarketplace.sol", "NFTMarketplace.json");
const destination = path.join(projectRoot, "public", "NFTMarketplace.json");

if (!fs.existsSync(source)) {
  throw new Error("Contract artifact is missing. Run Hardhat compile before exporting it.");
}

fs.copyFileSync(source, destination);
console.log(`Browser deployment artifact updated at ${destination}`);
