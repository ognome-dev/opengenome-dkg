'use strict';
// Helper: derive management wallet address from MANAGER_DKG_PK env var
// Called by entrypoint.sh via: node /opt/derive-management-wallet.js
const ethers = require('/opt/ot-node/node_modules/ethers');
const pk = process.env.MANAGER_DKG_PK;
if (!pk) { process.exit(0); }
try {
  const wallet = new ethers.Wallet(pk);
  process.stdout.write(wallet.address);
} catch (err) {
  process.stderr.write('Error: ' + err.message + '\n');
  process.exit(1);
}
