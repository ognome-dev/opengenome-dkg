import { createRequire } from "module";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

const require = createRequire(import.meta.url);
const ethers = require("/opt/ot-node/node_modules/ethers").ethers;

const KEY_DIR  = "/opt/ot-node/data/libp2p";
const KEY_PATH = join(KEY_DIR, "privateKey");
const HUB_ADDR = "0x99Aa571fD5e681c2D27ee08A7b7989DB02541d13";

async function getPeerIdStr(privKeyStr) {
  const { createFromPrivKey } = await import("/opt/ot-node/node_modules/peer-id/src/index.js");
  const id = await createFromPrivKey(privKeyStr);
  return id.toB58String();
}

async function main() {
  // Write LIBP2P_PRIVATE_KEY to file if provided
  const injectedKey = process.env.LIBP2P_PRIVATE_KEY;
  if (injectedKey) {
    console.log("[pre-start] Writing LIBP2P_PRIVATE_KEY to key file...");
    mkdirSync(KEY_DIR, { recursive: true });
    writeFileSync(KEY_PATH, injectedKey);
  }

  if (!existsSync(KEY_PATH)) {
    console.log("[pre-start] No key file yet — ot-node will generate on first boot.");
    return;
  }

  const privKeyStr = readFileSync(KEY_PATH).toString().trim();
  let localPeerId;
  try {
    localPeerId = await getPeerIdStr(privKeyStr);
    console.log("[pre-start] Local peer ID:", localPeerId);
  } catch (e) {
    console.error("[pre-start] Could not derive peer ID:", e.message);
    return;
  }

  const rpc      = process.env.BASE_RPC_URL || "https://mainnet.base.org";
  const pk       = process.env.DKG_WALLET_PRIVATE_KEY;
  const mgmtKey  = process.env.EVM_MANAGEMENT_PUBLIC_KEY;
  const nodeName = "opengenome";
  if (!pk || !mgmtKey) { console.log("[pre-start] Missing DKG keys, skip on-chain check."); return; }

  const provider = new ethers.providers.JsonRpcProvider(rpc);
  const wallet   = new ethers.Wallet(pk, provider);

  const hubAbi = ["function getContractAddress(string calldata contractName) external view returns (address)"];
  const hub = new ethers.Contract(HUB_ADDR, hubAbi, provider);

  let profileAddr, psAddr, isAddr;
  try {
    [profileAddr, psAddr, isAddr] = await Promise.all([
      hub.getContractAddress("Profile"),
      hub.getContractAddress("ProfileStorage"),
      hub.getContractAddress("IdentityStorage"),
    ]);
    console.log("[pre-start] Profile:", profileAddr);
  } catch (e) { console.error("[pre-start] Hub lookup failed:", e.message); return; }

  const isAbi  = ["function getIdentityId(address addr) external view returns (uint72)"];
  const psAbi  = ["function getNodeId(uint72 identityId) external view returns (bytes memory)"];
  const is_    = new ethers.Contract(isAddr, isAbi, provider);
  const ps     = new ethers.Contract(psAddr, psAbi, provider);

  let identityId;
  try {
    identityId = Number(await is_.getIdentityId(wallet.address));
    console.log("[pre-start] Identity ID:", identityId);
  } catch (e) { console.error("[pre-start] getIdentityId failed:", e.message); return; }

  if (identityId === 0) { console.log("[pre-start] No identity yet, ot-node will createProfile."); return; }

  let onChainPeerId = "";
  try {
    const raw = await ps.getNodeId(identityId);
    onChainPeerId = Buffer.from(raw.slice(2), "hex").toString("utf8");
    console.log("[pre-start] On-chain peer ID:", onChainPeerId);
  } catch (e) { console.error("[pre-start] getNodeId failed:", e.message); }

  if (onChainPeerId === localPeerId) {
    console.log("[pre-start] Peer IDs match — no update needed.");
    return;
  }

  console.log("[pre-start] Mismatch detected — updating on-chain peer ID...");
  const profileAbi = [
    "function createProfile(address adminWallet, address[] calldata operationalWallets, string calldata nodeName, bytes calldata nodeId, uint16 initialOperatorFee) external"
  ];
  const profileContract = new ethers.Contract(profileAddr, profileAbi, wallet);
  const nodeIdBytes = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(localPeerId));
  try {
    const tx = await profileContract.createProfile(mgmtKey, [], nodeName, nodeIdBytes, 0, { gasLimit: 500000 });
    console.log("[pre-start] TX sent:", tx.hash);
    await tx.wait();
    console.log("[pre-start] On-chain peer ID updated to:", localPeerId);
  } catch (e) {
    console.error("[pre-start] createProfile failed:", e.message);
  }

  if (!injectedKey) {
    console.log("=== SAVE THIS: set LIBP2P_PRIVATE_KEY in Railway ===");
    console.log(privKeyStr);
    console.log("===");
  }
}

main().then(() => process.exit(0)).catch(e => { console.error("[pre-start] fatal:", e); process.exit(0); });
