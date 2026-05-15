// Patches ot-node.js: when local peer ID != on-chain peer ID,
// log a warning but DON'T remove the blockchain implementation.
// Without this patch, ot-node shuts down if the libp2p key changes
// but the on-chain profile can't be updated (createProfile reverts).
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'ot-node.js');
let code = fs.readFileSync(filePath, 'utf8');

// Target: inside "if (peerId !== onChainPeerId)" block only.
// The warn log text is unique enough to anchor the replacement.
const before = code;

code = code.replace(
  /(doesn't match on chain peer id[\s\S]{0,300}?)\n(\s+)(blockchainModuleManager\.removeImplementation\(blockchain\);)(\s*\n\s*\})/,
  (match, p1, indent, removeLine, closing) => {
    return `${p1}\n${indent}// PATCHED: peer ID mismatch no longer fatal — node continues\n${indent}// ${removeLine}${closing}`;
  }
);

if (code === before) {
  console.error('PATCH FAILED: pattern not found in ot-node.js');
  process.exit(1);
}

fs.writeFileSync(filePath, code, 'utf8');
console.log('ot-node.js patched successfully: peer ID mismatch will no longer shut down the node.');
