/**
 * Example: Publish a biomedical research asset to OriginTrail DKG
 *
 * This example demonstrates how OpenGenome publishes research data
 * as a verifiable knowledge asset on the DKG after a Solana NFT mint.
 *
 * Prerequisites:
 *   npm install dkg.js
 *
 * Environment variables required:
 *   DKG_WALLET_PRIVATE_KEY  - EVM private key (0x...)
 *   DKG_WALLET_ADDRESS      - EVM address (0x...)
 *   DKG_BLOCKCHAIN          - base:84532 (testnet) or base:8453 (mainnet)
 */

const DKG = require('dkg.js');

const client = new DKG({
  environment: 'testnet',
  endpoint: 'https://v6-pegasus-node-02.origin-trail.network',
  port: 8900,
  blockchain: {
    name: process.env.DKG_BLOCKCHAIN || 'base:84532',
    publicKey: process.env.DKG_WALLET_ADDRESS,
    privateKey: process.env.DKG_WALLET_PRIVATE_KEY,
  },
});

const researchAsset = {
  '@context': {
    '@vocab': 'https://schema.org/',
    og: 'https://opengenome.bio/schema/v1/',
  },
  '@id': 'urn:opengenome:analysis:1',
  '@type': 'MedicalStudy',
  name: 'Hantavirus Pulmonary Syndrome - OpenGenome Research #1',
  'og:analysisId': 1,
  'og:primarySignal': 'Hantavirus Pulmonary Syndrome',
  'og:confidenceScore': 87,
  'og:signalStrength': 82,
  'og:solanaMint': 'ExampleSolanaAddressHere',
  'og:platform': 'https://opengenome.bio',
  dateCreated: new Date().toISOString(),
  studySubject: {
    '@type': 'MedicalCondition',
    name: 'Hantavirus Pulmonary Syndrome',
  },
  'og:herbs': [
    {
      '@type': 'Drug',
      name: 'Ginger',
      alternateName: 'Zingiber officinale',
      'og:pmid': '21945235',
    },
    {
      '@type': 'Drug',
      name: 'Turmeric',
      alternateName: 'Curcuma longa',
      'og:pmid': '37105214',
    },
  ],
  citation: [
    {
      '@type': 'ScholarlyArticle',
      identifier: 'PMID:21945235',
      url: 'https://pubmed.ncbi.nlm.nih.gov/21945235/',
    },
    {
      '@type': 'ScholarlyArticle',
      identifier: 'PMID:37105214',
      url: 'https://pubmed.ncbi.nlm.nih.gov/37105214/',
    },
  ],
};

async function main() {
  console.log('Publishing biomedical research asset to DKG...');

  const result = await client.asset.create(
    { public: researchAsset },
    { epochsNum: 2 }
  );

  console.log('Published successfully!');
  console.log('UAL:', result.UAL);
  console.log('View on DKG Explorer: https://dkg.origintrail.io/explore?ual=' + result.UAL);
}

main().catch(console.error);
