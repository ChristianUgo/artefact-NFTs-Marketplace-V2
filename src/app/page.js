"use client";

/* User-selected local data URLs cannot use the Next.js image optimizer. */
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from "react";
import { CONTRACT_ADDRESS, NETWORK, connectWallet, createListing, currentAccount, fetchListings, fetchOwnedNFTs, purchaseListing, shortAddress } from "@/lib/marketplace";

function readFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function Home() {
  const [view, setView] = useState("market");
  const [account, setAccount] = useState("");
  const [items, setItems] = useState([]);
  const [ownedItems, setOwnedItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [portfolioLoading, setPortfolioLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [notice, setNotice] = useState(null);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "" });
  const [image, setImage] = useState("");
  const [fileName, setFileName] = useState("");

  const load = async () => {
    setLoading(true);
    try { setItems(await fetchListings()); }
    catch { setItems([]); }
    finally { setLoading(false); }
  };

  const loadOwned = async () => {
    if (!account) return setOwnedItems([]);
    setPortfolioLoading(true);
    try { setOwnedItems(await fetchOwnedNFTs()); }
    catch { setOwnedItems([]); }
    finally { setPortfolioLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    currentAccount()
      .then((address) => {
        if (!cancelled) {
          setPortfolioLoading(Boolean(address));
          setAccount(address);
        }
      })
      .catch(() => {});
    fetchListings()
      .then((listings) => { if (!cancelled) setItems(listings); })
      .catch(() => { if (!cancelled) setItems([]); })
      .finally(() => { if (!cancelled) setLoading(false); });

    const updateAccount = window.ethereum
      ? (accounts) => {
          const address = accounts[0] || "";
          setPortfolioLoading(Boolean(address));
          setAccount(address);
        }
      : null;
    if (updateAccount) window.ethereum.on("accountsChanged", updateAccount);
    return () => {
      cancelled = true;
      if (updateAccount) window.ethereum.removeListener("accountsChanged", updateAccount);
    };
  }, []);

  useEffect(() => {
    if (!account) return;
    let cancelled = false;
    fetchOwnedNFTs()
      .then((owned) => { if (!cancelled) setOwnedItems(owned); })
      .catch(() => { if (!cancelled) setOwnedItems([]); })
      .finally(() => { if (!cancelled) setPortfolioLoading(false); });
    return () => { cancelled = true; };
  }, [account]);

  const results = useMemo(() => items.filter((item) => item.name.toLowerCase().includes(search.toLowerCase())), [items, search]);

  async function wallet() {
    try { const address = await connectWallet(); setPortfolioLoading(true); setAccount(address); setNotice({ type: "success", text: `Wallet ${shortAddress(address)} connected.` }); await load(); }
    catch (error) { setNotice({ type: "error", text: error.message }); }
  }

  async function chooseImage(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setNotice({ type: "error", text: "Choose an image file: JPG, PNG, WebP, or GIF." });
    if (file.size > 2 * 1024 * 1024) return setNotice({ type: "error", text: "Keep local test images below 2 MB." });
    setImage(await readFile(file));
    setFileName(file.name);
  }

  async function submit(event) {
    event.preventDefault();
    if (!account) return wallet();
    if (!image || !form.name || !form.description || !form.price) return setNotice({ type: "error", text: "Add an image, title, description, and price." });
    setBusy(true); setNotice({ type: "info", text: "Confirm the mint and listing transaction in MetaMask." });
    try {
      await createListing({ ...form, image });
      setForm({ name: "", description: "", price: "" }); setImage(""); setFileName("");
      setNotice({ type: "success", text: `NFT minted and listed on ${NETWORK.name}.` }); setView("market"); await load();
    } catch (error) { setNotice({ type: "error", text: error.shortMessage || error.message || "Transaction was not completed." }); }
    finally { setBusy(false); }
  }

  async function buy(item) {
    if (!account) return wallet();
    if (item.seller.toLowerCase() === account.toLowerCase()) return setNotice({ type: "error", text: "Switch to another wallet account to buy your own listing." });
    setBusy(true); setNotice({ type: "info", text: "Confirm the purchase in MetaMask." });
    try { await purchaseListing(item); setSelected(null); setNotice({ type: "success", text: "Purchase confirmed. Ownership has changed." }); await Promise.all([load(), loadOwned()]); }
    catch (error) { setNotice({ type: "error", text: error.shortMessage || error.message || "Purchase was not completed." }); }
    finally { setBusy(false); }
  }

  return <main>
    <header className="header">
      <button className="brand" onClick={() => setView("market")}><span>Æ</span> Artefact</button>
      <nav>
        <button className={view === "market" ? "active" : ""} onClick={() => setView("market")}>Marketplace</button>
        <button className={view === "create" ? "active" : ""} onClick={() => setView("create")}>Create</button>
        <button className={view === "portfolio" ? "active" : ""} onClick={() => setView("portfolio")}>Portfolio</button>
      </nav>
      <button className="wallet" onClick={wallet}>{account ? shortAddress(account) : "Connect wallet"}</button>
    </header>
    <div className="network"><i /> {NETWORK.name} network <span>Chain {NETWORK.chainIdDecimal}</span><b>Contract {shortAddress(CONTRACT_ADDRESS)}</b></div>
    {notice && <div className={`notice ${notice.type}`}><span>{notice.text}</span><button onClick={() => setNotice(null)}>Close</button></div>}

    {view === "market" && <>
      <section className="hero">
        <div><p className="eyebrow">A TESTNET NFT STUDIO</p><h1>Make the work. <em>Keep the signal.</em></h1><p className="lede">An original marketplace interface for testing digital collections on {NETWORK.name}.</p><div className="actions"><button className="primary" onClick={() => setView("create")}>Create an NFT</button><button className="link" onClick={load}>Refresh marketplace</button></div></div>
        <aside><small>LIVE CONTRACT STATE</small><strong>{loading ? "Syncing" : `${items.length} listed`}</strong><p>{account ? `Connected as ${shortAddress(account)}` : "Connect your test wallet to begin."}</p></aside>
      </section>
      <section className="market-section"><div className="section-title"><div><p className="eyebrow">MARKETPLACE</p><h2>Collectible listings</h2></div><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search NFT listings" /></div>
      {loading ? <Empty text="Loading contract listings..." /> : results.length ? <div className="grid">{results.map((item) => <Card key={item.tokenId} item={item} choose={setSelected} />)}</div> : <Empty text="No NFTs are listed yet." button={() => setView("create")} />}</section>
    </>}

    {view === "create" && <section className="create-page"><div className="create-copy"><p className="eyebrow">NEW LISTING</p><h1>Publish a piece with a point of view.</h1><p>Images are held locally during testing while the contract stores compact NFT metadata. The preview is immediate; MetaMask opens only when you are ready to mint.</p><dl><dt>Royalties</dt><dd>Not enabled by the Version 1 contract</dd><dt>File size</dt><dd>Maximum 2 MB for local testing</dd></dl></div>
      <form onSubmit={submit} className="form"><label className={`dropzone ${image ? "filled" : ""}`}>{image ? <img src={image} alt="Selected NFT preview" /> : <><strong>Drop an image here</strong><span>or browse your computer (up to 2 MB)</span></>}<input type="file" accept="image/*" onChange={(event) => chooseImage(event.target.files?.[0])} /></label>{fileName && <p className="file">Ready to mint: {fileName}</p>}<div className="two"><label>Title<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="A name for the work" /></label><label>Price in {NETWORK.currency}<input value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} inputMode="decimal" placeholder="1" /></label></div><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What should a collector know?" /></label><button className="primary full" disabled={busy}>{busy ? "Waiting for confirmation..." : "Mint and list NFT"}</button></form>
    </section>}

    {view === "portfolio" && <section className="portfolio"><p className="eyebrow">YOUR WALLET</p><h1>{account ? "NFTs owned by this wallet" : "Connect to see your collection"}</h1>{account && <p className="address">{account}</p>}{!account ? <Empty text="Connect MetaMask to inspect your collection." /> : portfolioLoading ? <Empty text="Loading owned NFTs from the network..." /> : ownedItems.length ? <div className="grid">{ownedItems.map((item) => <Card key={item.tokenId} item={item} choose={setSelected} owned />)}</div> : <Empty text="This wallet does not own any purchased NFTs yet." />}</section>}
    {selected && <Dialog item={selected} account={account} close={() => setSelected(null)} buy={buy} busy={busy} />}
  </main>;
}

function Card({ item, choose, owned = false }) { return <article className="card"><button className="art" onClick={() => choose(item)}>{item.image ? <img src={item.image} alt={item.name} /> : <span>#{item.tokenId}</span>}</button><div><small>EDITION #{item.tokenId}</small><h3>{item.name}</h3><p>{owned ? "Owned by connected wallet" : `Listed by ${shortAddress(item.seller)}`}</p><footer><strong>{item.price} {NETWORK.currency}</strong><button onClick={() => choose(item)}>View</button></footer></div></article>; }
function Empty({ text, button }) { return <div className="empty"><p>{text}</p>{button && <button className="primary" onClick={button}>Create the first listing</button>}</div>; }
function Dialog({ item, account, close, buy, busy }) { const ownListing = !item.sold && account && item.seller.toLowerCase() === account.toLowerCase(); return <div className="backdrop" onMouseDown={close}><article className="dialog" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={close}>Close</button><div className="dialog-art">{item.image ? <img src={item.image} alt={item.name} /> : <span>#{item.tokenId}</span>}</div><div className="details"><p className="eyebrow">EDITION #{item.tokenId}</p><h2>{item.name}</h2><p>{item.description}</p><div className="facts"><span>{item.sold ? "Owned by" : "Listed by"} <b>{shortAddress(item.sold ? item.owner : item.seller)}</b></span><strong>{item.price} {NETWORK.currency}</strong></div>{item.sold ? <p className="owner">Owned by the connected wallet. Resale is not enabled in this interface yet.</p> : ownListing ? <p className="owner">This is your listing. Switch to another wallet account to test a purchase.</p> : <button className="primary full" disabled={busy} onClick={() => buy(item)}>{busy ? "Waiting..." : `Buy for ${item.price} ${NETWORK.currency}`}</button>}</div></article></div>; }
