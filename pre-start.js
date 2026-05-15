'use strict';

const fs   = require('fs');
const path = require('path');

const KEY_DIR  = '/opt/ot-node/data/libp2p';
const KEY_PATH = path.join(KEY_DIR, 'privateKey');
const HUB_ADDR = '0x99Aa571fD5e681c2D27ee08A7b7989DB02541d13';

async function getPeerIdStr(privKeyStr) {
  try {
    const mod = await import('/opt/ot-node/node_modules/peer-id/src/index.js');
    const createFromPrivKey = mod.createFromPrivKey ?? mod.default?.createFromPrivKey;
    if (!createFromPrivKey) throw new Error('createFromPrivKey not found in module');
    const id = await createFromPrivKey(privKeyStr);
    return id.toB58String();
  } catch (e) {
    console.error('[pre-start] peer-id derive failed:', e.message);
    return null;
  }
}

async function main() {
  const ethers = require('/opt/ot-node/node_modules/ethers').ethers
              || require('/opt/ot-node/node_modules/ethers');

  const injectedKey = process.env.LIBP2P_PRIVATE_KEY;
  if (injectedKey) {
    console.log('[pre-start] Writing LIBP2P_PRIVATE_KEY to key file...');
    fs.mkdirSync(KEY_DIR, { recursive: true });
    fs.writeFileSync(KEY_PATH, injectedKey);
  }

  if (!fs.existsSync(KEY_PATH)) {
    console.log('[pre-start] No key file yet — ot-node will generate on first boot.');
    return;
  }

  const privKeyStr  = fs.readFileSync(KEY_PATH).toString().trim();
  const localPeerId = await getPeerIdStr(privKeyStr);
  if (!localPeerId) {
    console.log('[pre-start] Could not derive peer ID — skipping on-chain sync.');
    return;
  }
  console.log('[pre-start] Local peer ID:', localPeerId);

  const rpc     = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const pk      = process.env.DKG_WALLET_PRIVATE_KEY;
  const mgmtKey = process.env.EVM_MANAGEMENT_PUBLIC_KEY;
  const nName   = 'opengenome';
  if (!pk || !mgmtKey) {
    console.log('[pre-start] Missing DKG keys — skip on-chain check.');
    return;
  }

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet   = new ethers.Wallet(pk, provider);
  const hubAbi   = ['function getContractAddress(string calldata contractName) external view returns (address)'];
  const hub      = new ethers.Contract(HUB_ADDR, hubAbi, provider);

  let profileAddr, psAddr, isAddr;
  try {
    [profileAddr, psAddr, isAddr] = await Promise.all([
      hub.getContractAddress('Profile'),
      hub.getContractAddress('ProfileStorage'),
      hub.getContractAddress('IdentityStorage'),
    ]);
    console.log('[pre-start] Profile:', profileAddr);
  } catch (e) { console.error('[pre-start] Hub lookup failed:', e.message); return; }

  const isAbi = ['function getIdentityId(address addr) external view returns (uint72)'];
  const psAbi = ['function getNodeId(uint72 identityId) external view returns (bytes memory)'];
  const isMod = new ethers.Contract(isAddr, isAbi, provider);
  const psMod = new ethers.Contract(psAddr, psAbi, provider);

  let identityId;
  try {
    identityId = Number(await isMod.getIdentityId(wallet.address));
    console.log('[pre-start] Identity ID:', identityId);
  } catch (e) { console.error('[pre-start] getIdentityId failed:', e.message); return; }

  if (identityId === 0) {
    console.log('[pre-start] No identity yet — ot-node will createProfile.');
    return;
  }

  let onChainPeerId = '';
  try {
    const raw    = await psMod.getNodeId(identityId);
    onChainPeerId = Buffer.from(raw.slice(2), 'hex').toString('utf8');
    console.log('[pre-start] On-chain peer ID:', onChainPeerId);
  } catch (e) { console.error('[pre-start] getNodeId failed:', e.message); }

  if (onChainPeerId === localPeerId) {
    console.log('[pre-start] Peer IDs match — no update needed.');
    return;
  }

  console.log('[pre-start] Mismatch — calling Profile.createProfile to update on-chain peer ID...');
  const profileAbi = [
    'function createProfile(address adminWallet, address[] calldata operationalWallets, string calldata nodeName, bytes calldata nodeId, uint16 initialOperatorFee) external'
  ];
  const profileContract = new ethers.Contract(profileAddr, profileAbi, wallet);
  const nodeIdBytes     = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(localPeerId));
  try {
    const tx = await profileContract.createProfile(mgmtKey, [], nName, nodeIdBytes, 0, { gasLimit: 500000 });
    console.log('[pre-start] TX sent:', tx.hash);
    await tx.wait();
    console.log('[pre-start] On-chain peer ID updated to:', localPeerId);
  } catch (e) {
    console.error('[pre-start] createProfile failed:', e.message);
  }

  if (!injectedKey) {
    console.log('=== SAVE THIS as LIBP2P_PRIVATE_KEY in Railway ===');
    console.log(privKeyStr);
    console.log('===');
  }
}

main()
  .then(() => process.exit(0))
  .catch(e => { console.error('[pre-start] fatal:', e.message); process.exit(0); });
