# OpenGenome x OriginTrail DKG Integration

Full documentation for the dual-anchor system: Solana NFT + OriginTrail DKG knowledge asset.

## Overview

When a user runs an AI-powered diagnosis on OpenGenome and mints a research NFT, the platform
performs two operations in parallel:

1. Mint compressed NFT on Solana (existing flow)
2. Publish JSON-LD knowledge asset to OriginTrail DKG on Base (new, async)

The result is a research report with two verifiable anchors:
- Solana address for NFT ownership
- DKG UAL (Universal Asset Locator) for queryable, linked knowledge

## Phases

### Phase 1 - Testnet Setup

1. Create a new EVM wallet (dedicated, not personal)
2. Get testnet TRAC from https://faucet.origintrail.io
3. Get Base Sepolia ETH from https://www.alchemy.com/faucets/base-sepolia
4. Set environment variables (see below)

### Phase 2 - Implementation

Files to create:
- `src/lib/dkg.ts` - DKG client wrapper (this repo)
- `artifacts/api-server/src/routes/analyze.ts` - add publishToDkg after mint
- `lib/db/src/schema/mints.ts` - add dkg_ual column

### Phase 3 - Testing

1. Trigger a test mint
2. Verify UAL is created and stored in DB
3. Open UAL in DKG Explorer: https://dkg.origintrail.io
4. Run a SPARQL query to verify data is readable

### Phase 4 - Mainnet

1. Buy TRAC on Coinbase, KuCoin, or Uniswap
2. Send to DKG wallet
3. Update DKG_BLOCKCHAIN to `base:8453`
4. Deploy to production

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DKG_WALLET_PRIVATE_KEY` | Yes | EVM private key for signing DKG transactions |
| `DKG_WALLET_ADDRESS` | Yes | EVM address for the DKG wallet |
| `DKG_BLOCKCHAIN` | Yes | `base:84532` (testnet) or `base:8453` (mainnet) |
| `DKG_ENDPOINT` | No | DKG node URL (default: Pegasus node) |
| `DKG_EPOCHS` | No | Storage epochs, default 2 (1 epoch ~3 months) |

## Cost Estimate (Mainnet)

| Item | Estimate |
|------|----------|
| TRAC per publish | 1-5 TRAC |
| ETH gas per tx | ~$0.001 (Base is cheap) |
| Cost per year (4 epochs) | 4-20 TRAC |

## JSON-LD Schema

Assets are published using `schema.org/MedicalStudy` with a custom `og:` prefix:

```json
{
  "@context": {
    "@vocab": "https://schema.org/",
    "og": "https://opengenome.bio/schema/v1/"
  },
  "@type": "MedicalStudy",
  "og:platform": "https://opengenome.bio"
}
```

See `schema/biomedical.jsonld` for the full schema definition.

## SPARQL Query Example

Query all OpenGenome research assets published to the DKG:

```sparql
SELECT ?id ?signal ?mint WHERE {
  ?s a <https://schema.org/MedicalStudy> .
  ?s <https://opengenome.bio/schema/v1/analysisId> ?id .
  ?s <https://opengenome.bio/schema/v1/primarySignal> ?signal .
  ?s <https://opengenome.bio/schema/v1/solanaMint> ?mint .
}
```

## Links

- DKG Explorer: https://dkg.origintrail.io
- OriginTrail Docs: https://docs.origintrail.io
- DKG.js SDK: https://github.com/OriginTrail/dkg.js
- OpenGenome: https://opengenome.bio
