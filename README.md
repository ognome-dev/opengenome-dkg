# opengenome-dkg

DKG Edge Node for [OpenGenome](https://opengenome.bio) — anchors clinical research reports on the OriginTrail Decentralized Knowledge Graph, Base mainnet.

## What this does

Each time a user mints a research report on OpenGenome, this node publishes the structured JSON-LD metadata as a Knowledge Asset to the DKG. The resulting UAL (Universal Asset Locator) is stored on-chain and linked to the mint NFT, making the research provenance permanently verifiable.

## Stack

| Component | Purpose |
|-----------|---------|
| ot-node v8 | DKG Edge Node engine |
| MySQL 8 | Operational database |
| Redis | Cache and queue |
| Blazegraph | RDF triple store |
| Supervisord | Process manager |

## Deploy to Railway

### 1. Fork or clone this repo

Connect the repository to a new Railway project.

### 2. Set environment variables in Railway

| Variable | Description |
|----------|-------------|
| `BASE_RPC_URL` | Base mainnet RPC (e.g. `https://mainnet.base.org` or Alchemy URL) |
| `DKG_WALLET_ADDRESS` | EVM address of the operational wallet |
| `DKG_WALLET_PRIVATE_KEY` | Private key for the operational wallet (keep secret) |
| `EVM_MANAGEMENT_PUBLIC_KEY` | Management wallet public address |
| `MYSQL_PASSWORD` | Password for the internal MySQL user |

See `.env.example` for the full template.

### 3. Deploy

Railway detects the `Dockerfile` automatically. Build takes 10-15 min on first deploy (Blazegraph jar download + ot-node npm install).

### 4. Note the public URL

Railway assigns a URL like `https://opengenome-dkg-production.up.railway.app`. Set this as `DKG_ENDPOINT` in your main application.

## Ports

| Port | Service |
|------|---------|
| `8900` | ot-node HTTP API |
| `9100` | ot-node P2P network |
| `9999` | Blazegraph (internal only) |

## Notes

- This node runs on **Base mainnet** only.
- The operational wallet must hold TRAC (Base mainnet) to pay for DKG publish transactions.
- Hub contract: `0x99Aa571fD5e681c2D27ee08A7b7989DB02541d13`
- TRAC contract: `0xA81a52B4dda010896cDd386C7fBdc5CDc835ba23`

## License

MIT
