/**
 * Create OpenGenome Paranet on OriginTrail DKG
 *
 * Run once to register the OpenGenome Biomedical Research Paranet.
 * A paranet groups related knowledge assets under a shared namespace,
 * enabling cross-asset SPARQL queries and ecosystem visibility.
 *
 * Usage:
 *   npx ts-node scripts/create-paranet.ts
 *
 * Environment variables required:
 *   DKG_WALLET_PRIVATE_KEY
 *   DKG_WALLET_ADDRESS
 *   DKG_BLOCKCHAIN
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DKG = require('dkg.js');

async function main() {
  const client = new DKG({
    environment: process.env.DKG_BLOCKCHAIN?.includes('84532') ? 'testnet' : 'mainnet',
    endpoint: process.env.DKG_ENDPOINT ?? 'https://v6-pegasus-node-02.origin-trail.network',
    port: 8900,
    blockchain: {
      name: process.env.DKG_BLOCKCHAIN ?? 'base:84532',
      publicKey: process.env.DKG_WALLET_ADDRESS,
      privateKey: process.env.DKG_WALLET_PRIVATE_KEY,
    },
  });

  const paranetMetadata = {
    '@context': { '@vocab': 'https://schema.org/' },
    '@type': 'ResearchProject',
    name: 'OpenGenome Biomedical Research Paranet',
    description:
      'A decentralized knowledge graph paranet for AI-powered biomedical research, ' +
      'connecting PubMed citations, clinical trial data, and herbal supplement evidence ' +
      'anchored on-chain via Solana NFTs.',
    url: 'https://opengenome.bio',
    keywords: ['biomedical', 'research', 'PubMed', 'clinical trials', 'herbs', 'Solana', 'DKG'],
  };

  console.log('Creating OpenGenome paranet...');
  const result = await client.paranet.create(
    { public: paranetMetadata },
    { epochsNum: 4 }
  );

  console.log('Paranet created!');
  console.log('Paranet UAL:', result.UAL);
  console.log('Save this UAL - you will need it to associate future knowledge assets with this paranet.');
}

main().catch((err) => {
  console.error('Failed to create paranet:', err);
  process.exit(1);
});
