"use client";

import { CONTRACT_ADDRESS } from "./contract-address";

export { CONTRACT_ADDRESS };

const abi = [
  "function getListingPrice() view returns (uint256)",
  "function createToken(string tokenURI, uint256 price) payable",
  "function createMarketSale(uint256 tokenId) payable",
  "function fetchMarketItems() view returns ((uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])",
  "function fetchMyNFTs() view returns ((uint256 tokenId, address seller, address owner, uint256 price, bool sold)[])",
  "function tokenURI(uint256 tokenId) view returns (string)",
];

const ethers = () => import("ethers");

function ethereumProvider() {
  try {
    return window.ethereum || null;
  } catch {
    return null;
  }
}

export const shortAddress = (address = "") => address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "";

export async function currentAccount() {
  const provider = ethereumProvider();
  if (!provider) return "";
  return (await provider.request({ method: "eth_accounts" }))[0] || "";
}

export async function connectWallet() {
  const provider = ethereumProvider();
  if (!provider) throw new Error("MetaMask is unavailable. Unlock or reload the MetaMask extension, then try again.");
  const accounts = await provider.request({ method: "eth_requestAccounts" });
  if (await provider.request({ method: "eth_chainId" }) !== "0x7a69") {
    throw new Error("Switch MetaMask to Hardhat Local (chain ID 31337).");
  }
  return accounts[0] || "";
}

async function hydrateItems(contract, items) {
  const { formatEther } = await ethers();
  return Promise.all(items.map(async (item) => {
    let metadata = {};
    try { metadata = JSON.parse(atob((await contract.tokenURI(item.tokenId)).split(",")[1])); } catch {}
    const image = metadata.localImageKey
      ? window.localStorage.getItem(metadata.localImageKey) || ""
      : metadata.image || "";
    return { tokenId: Number(item.tokenId), seller: item.seller, owner: item.owner, price: formatEther(item.price), sold: item.sold, name: metadata.name || `Untitled #${item.tokenId}`, description: metadata.description || "No description provided.", image };
  }));
}

export async function fetchListings() {
  const { Contract, JsonRpcProvider } = await ethers();
  const contract = new Contract(CONTRACT_ADDRESS, abi, new JsonRpcProvider("http://127.0.0.1:8545"));
  return hydrateItems(contract, await contract.fetchMarketItems());
}

async function signerContract() {
  const injectedProvider = ethereumProvider();
  if (!injectedProvider) throw new Error("MetaMask is unavailable. Unlock or reload the extension, then try again.");
  const { BrowserProvider, Contract } = await ethers();
  const provider = new BrowserProvider(injectedProvider);
  return new Contract(CONTRACT_ADDRESS, abi, await provider.getSigner());
}

export async function fetchOwnedNFTs() {
  const contract = await signerContract();
  return hydrateItems(contract, await contract.fetchMyNFTs());
}

export async function createListing({ name, description, price, image }) {
  const contract = await signerContract();
  const { parseEther } = await ethers();
  const localImageKey = `artefact-image-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(localImageKey, image);
  const tokenUri = `data:application/json;base64,${btoa(JSON.stringify({ name, description, localImageKey }))}`;
  return (await contract.createToken(tokenUri, parseEther(price), { value: await contract.getListingPrice() })).wait();
}

export async function purchaseListing(item) {
  const contract = await signerContract();
  const { parseEther } = await ethers();
  return (await contract.createMarketSale(item.tokenId, { value: parseEther(item.price) })).wait();
}
