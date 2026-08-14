# Security Policy

## Project status

Artefact NFT Marketplace V2 is a local Hardhat demonstration. It is not audited, production-ready, or intended to custody real assets. Do not use real private keys, seed phrases, NFTs, or funds.

## Supported environment

Security fixes target the latest commit on the default branch and local chain ID `31337`. No public testnet or mainnet deployment is supported.

## Reporting a vulnerability

Please use GitHub's private vulnerability reporting or Security Advisory feature for the repository. Include:

- the affected contract or application file;
- reproduction steps or a minimal proof of concept;
- the expected and observed behavior;
- the potential impact;
- any suggested mitigation.

Do not publish an exploitable report in a public issue before a fix is available.

## Known security limitations

- The contract has not received an independent audit.
- Payment settlement uses `transfer` rather than a pull-payment pattern.
- Collection reads use linear scans and target small local datasets.
- Uploaded images remain in browser `localStorage` and are not integrity-pinned.
- The frontend's seller/buyer checks are usability controls, not contract-level authorization boundaries.
- Restarting the Hardhat node destroys the local chain state.
