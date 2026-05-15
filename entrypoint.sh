#!/bin/bash
set -e

echo "[entrypoint] starting at $(date)"

# Derive management wallet public address from private key if provided
if [ -n "$MANAGER_DKG_PK" ]; then
  echo "[entrypoint] deriving management wallet address from MANAGER_DKG_PK..."
  EVM_MANAGEMENT_PUBLIC_KEY=$(node -e "
    try {
      const e = require('/opt/ot-node/node_modules/ethers');
      const pk = process.env.MANAGER_DKG_PK;
      const wallet = new e.Wallet(pk);
      process.stdout.write(wallet.address);
    } catch(err) {
      process.stderr.write('Error: ' + err.message + '\n');
      process.exit(1);
    }
  " 2>/dev/null)
  export EVM_MANAGEMENT_PUBLIC_KEY
  echo "[entrypoint] management wallet set: $EVM_MANAGEMENT_PUBLIC_KEY"
fi

echo "[entrypoint] injecting env vars into noderc..."
envsubst < /opt/ot-node/.origintrail_noderc.template > /opt/ot-node/.origintrail_noderc
echo "[entrypoint] noderc generated"

echo "[entrypoint] preparing MySQL data directory..."
mkdir -p /var/lib/mysql /var/run/mysqld
chown -R mysql:mysql /var/lib/mysql /var/run/mysqld

if [ ! -d "/var/lib/mysql/mysql" ]; then
  echo "[entrypoint] initializing MySQL data dir..."
  mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql 2>&1
  echo "[entrypoint] MySQL data dir initialized"
else
  echo "[entrypoint] MySQL data dir already exists, skipping init"
fi

echo "[entrypoint] handing off to supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
