require("@nomicfoundation/hardhat-ethers");

const amoyRpcUrl = process.env.AMOY_RPC_URL || "https://polygon-amoy.drpc.org";
const deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;

function deploymentAccounts() {
  if (!deployerPrivateKey) return [];
  return [deployerPrivateKey.startsWith("0x") ? deployerPrivateKey : `0x${deployerPrivateKey}`];
}

module.exports = {
  solidity: "0.8.4",
  networks: {
    hardhat: { chainId: 31337 },
    localhost: { url: "http://127.0.0.1:8545" },
    amoy: {
      url: amoyRpcUrl,
      chainId: 80002,
      accounts: deploymentAccounts(),
    },
  },
};
