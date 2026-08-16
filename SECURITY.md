# Security Policy

## Project status

Artefact NFT Marketplace V2 is a local and Polygon Amoy testnet demonstration. It is not audited, production-ready, or intended to custody real assets. Do not use production private keys, seed phrases, valuable NFTs, or real funds.

## Supported environment

Security fixes target the latest commit on the default branch, local chain ID `31337`, and Polygon Amoy chain ID `80002`. Mainnet deployment is not supported.

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
- Payment settlement uses checked `call` operations with a reentrancy guard rather than a pull-payment pattern.
- Collection reads use linear scans and target small local datasets.
- Uploaded images remain in browser `localStorage` and are not integrity-pinned.
- The contract rejects seller self-purchases and purchases of inactive listings; other frontend validations remain usability controls.
- Restarting the Hardhat node destroys the local chain state.
