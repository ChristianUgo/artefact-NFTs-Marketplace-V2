const assert = require("node:assert/strict");
const { ethers } = require("hardhat");

describe("NFTMarketplace", function () {
  let marketplace;
  let seller;
  let buyer;
  let listingFee;
  const askingPrice = ethers.parseEther("1");
  const tokenUri = "data:application/json;base64,e30=";

  beforeEach(async function () {
    [seller, buyer] = await ethers.getSigners();
    const Marketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await Marketplace.deploy();
    await marketplace.waitForDeployment();
    listingFee = await marketplace.getListingPrice();
  });

  async function mintAndList() {
    await marketplace.createToken(tokenUri, askingPrice, { value: listingFee });
  }

  it("mints an NFT and escrows it as an active listing", async function () {
    await mintAndList();

    const contractAddress = await marketplace.getAddress();
    const listings = await marketplace.fetchMarketItems();

    assert.equal(await marketplace.ownerOf(1), contractAddress);
    assert.equal(listings.length, 1);
    assert.equal(listings[0].tokenId, 1n);
    assert.equal(listings[0].seller, seller.address);
    assert.equal(listings[0].owner, contractAddress);
    assert.equal(listings[0].price, askingPrice);
    assert.equal(listings[0].sold, false);
  });

  it("transfers payment and NFT ownership to a different buyer", async function () {
    await mintAndList();
    const sellerBalanceBefore = await ethers.provider.getBalance(seller.address);

    await marketplace.connect(buyer).createMarketSale(1, { value: askingPrice });

    const sellerBalanceAfter = await ethers.provider.getBalance(seller.address);
    const activeListings = await marketplace.fetchMarketItems();
    const buyerItems = await marketplace.connect(buyer).fetchMyNFTs();

    assert.equal(await marketplace.ownerOf(1), buyer.address);
    assert.equal(sellerBalanceAfter - sellerBalanceBefore, askingPrice + listingFee);
    assert.equal(await ethers.provider.getBalance(await marketplace.getAddress()), 0n);
    assert.equal(activeListings.length, 0);
    assert.equal(buyerItems.length, 1);
    assert.equal(buyerItems[0].owner, buyer.address);
    assert.equal(buyerItems[0].sold, true);
  });

  it("rejects a purchase that does not pay the asking price", async function () {
    await mintAndList();

    let purchaseError;
    try {
      await marketplace.connect(buyer).createMarketSale(1, { value: ethers.parseEther("0.5") });
    } catch (error) {
      purchaseError = error;
    }

    assert.ok(purchaseError);
    assert.match(purchaseError.message, /Please submit the asking price in order to complete the purchase/);
  });

  it("rejects a seller buying their own active listing", async function () {
    await mintAndList();

    await assert.rejects(
      marketplace.createMarketSale(1, { value: askingPrice }),
      /Seller cannot buy their own listing/
    );
  });

  it("rejects purchasing an item that is no longer listed", async function () {
    await mintAndList();
    await marketplace.connect(buyer).createMarketSale(1, { value: askingPrice });

    await assert.rejects(
      marketplace.createMarketSale(1, { value: askingPrice }),
      /Item is not listed for sale/
    );
  });
});
