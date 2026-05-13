/**
 * OpenGenome DKG Client
 *
 * Publishes biomedical research data to OriginTrail Decentralized Knowledge Graph.
 * Called automatically after a Solana NFT mint. Non-blocking — failures are logged
 * but never interrupt the mint flow.
 *
 * Docs: https://docs.origintrail.io
 * SDK:  https://github.com/OriginTrail/dkg.js
 */

// eslint-disable-next-line @typescript-eslint/no-require-imports
const DKG = require('dkg.js');

export interface AnalysisData {
  id: number;
  primarySignal: string;
  confidenceScore: number;
  signalStrength: number;
  solanaMint: string;
  herbs: Array<{
    name: string;
    latinName: string;
    pmid?: string;
  }>;
  citations: Array<{
    pmid: string;
    url: string;
  }>;
  createdAt: string;
}

let _client: InstanceType<typeof DKG> | null = null;

function getClient() {
  if (_client) return _client;

  const endpoint = process.env.DKG_ENDPOINT ?? 'https://v6-pegasus-node-02.origin-trail.network';
  const blockchain = process.env.DKG_BLOCKCHAIN ?? 'base:84532';
  const walletKey = process.env.DKG_WALLET_PRIVATE_KEY;
  const walletAddress = process.env.DKG_WALLET_ADDRESS;

  if (!walletKey || !walletAddress) {
    throw new Error('DKG_WALLET_PRIVATE_KEY and DKG_WALLET_ADDRESS must be set');
  }

  _client = new DKG({
    environment: blockchain.includes('84532') ? 'testnet' : 'mainnet',
    endpoint,
    port: 8900,
    blockchain: {
      name: blockchain,
      publicKey: walletAddress,
      privateKey: walletKey,
    },
  });

  return _client;
}

function buildJsonLd(analysis: AnalysisData): object {
  return {
    '@context': {
      '@vocab': 'https://schema.org/',
      og: 'https://opengenome.bio/schema/v1/',
    },
    '@id': `urn:opengenome:analysis:${analysis.id}`,
    '@type': 'MedicalStudy',
    name: `${analysis.primarySignal} - OpenGenome Research #${analysis.id}`,
    'og:analysisId': analysis.id,
    'og:primarySignal': analysis.primarySignal,
    'og:confidenceScore': analysis.confidenceScore,
    'og:signalStrength': analysis.signalStrength,
    'og:solanaMint': analysis.solanaMint,
    'og:platform': 'https://opengenome.bio',
    dateCreated: analysis.createdAt,
    studySubject: {
      '@type': 'MedicalCondition',
      name: analysis.primarySignal,
    },
    'og:herbs': analysis.herbs.map((h) => ({
      '@type': 'Drug',
      name: h.name,
      alternateName: h.latinName,
      ...(h.pmid ? { 'og:pmid': h.pmid } : {}),
    })),
    citation: analysis.citations.map((c) => ({
      '@type': 'ScholarlyArticle',
      identifier: `PMID:${c.pmid}`,
      url: c.url,
    })),
  };
}

/**
 * Publish an analysis to the DKG.
 * Returns the UAL (Universal Asset Locator) on success, or null on failure.
 */
export async function publishToDkg(analysis: AnalysisData): Promise<string | null> {
  try {
    const client = getClient();
    const epochs = parseInt(process.env.DKG_EPOCHS ?? '2', 10);
    const jsonLd = buildJsonLd(analysis);

    const result = await client.asset.create(
      { public: jsonLd },
      { epochsNum: epochs }
    );

    const ual: string = result?.UAL ?? result?.ual ?? null;
    if (ual) {
      console.log(`[DKG] Published analysis ${analysis.id} -> UAL: ${ual}`);
    } else {
      console.warn('[DKG] Publish succeeded but no UAL returned:', JSON.stringify(result));
    }

    return ual;
  } catch (err) {
    console.error(`[DKG] Failed to publish analysis ${analysis.id}:`, err);
    return null;
  }
}
