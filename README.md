# opengenome-dkg

Dual-anchor biomedical research NFTs on Solana + OriginTrail Decentralized Knowledge Graph (Base).

## What This Does

Every time a user mints a research NFT on [OpenGenome](https://opengenome.bio) (Solana), the system
automatically publishes the same research data to the OriginTrail DKG on Base blockchain.

Each research report gets two anchors:

- **Solana**: NFT ownership proof
- **OriginTrail DKG**: verifiable, queryable knowledge asset with a UAL (Universal Asset Locator)

The process runs in the background. Users do not need any extra steps.

## Stack

- Runtime: Node.js + TypeScript
- DKG SDK: [dkg.js](https://github.com/OriginTrail/dkg.js)
- Blockchain: Base Mainnet / Base Sepolia (testnet)
- Schema: schema.org/MedicalStudy + custom OpenGenome vocabulary
- NFT chain: Solana (via compressed NFT / cNFT)

## Repository Structure

```
src/
  lib/
    dkg.ts                   DKG client wrapper
schema/
  biomedical.jsonld          JSON-LD schema for MedicalStudy assets
scripts/
  create-paranet.ts          One-time script to register OpenGenome paranet
examples/
  biomedical-research.js     Example: publish a biomedical research asset to DKG
docs/
  integration.md             Full integration documentation
```

## How It Works

```
Solana mint (existing)
    |
    +-- save NFT address to DB
    |
    +-- publishToDKG(analysis)     [async, non-blocking]
              |
              v
         Format as JSON-LD
         (MedicalStudy + PubMed citations + herbs)
              |
              v
         DkgClient.asset.create()
              |
              v
         Receive UAL
         e.g. did:dkg/base:8453/0x99Aa.../12345
              |
              v
         Store UAL in mints table
         column: dkg_ual TEXT
              |
              v
         Frontend shows "View on DKG" button
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DKG_WALLET_PRIVATE_KEY` | EVM private key for DKG publish transactions |
| `DKG_WALLET_ADDRESS` | EVM address for the above wallet |
| `DKG_BLOCKCHAIN` | `base:84532` (testnet) or `base:8453` (mainnet) |
| `DKG_ENDPOINT` | Public DKG node endpoint |
| `DKG_EPOCHS` | Number of epochs to store asset (1 epoch ~3 months) |

## Links

- DKG Explorer: https://dkg.origintrail.io
- OriginTrail Docs: https://docs.origintrail.io
- DKG.js SDK: https://github.com/OriginTrail/dkg.js
- OpenGenome: https://opengenome.bio

## Author

[ognome-dev](https://github.com/ognome-dev)
