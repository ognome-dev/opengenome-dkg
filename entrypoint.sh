#!/bin/bash
set -e

echo "[entrypoint] starting at $(date)"

# Derive management wallet public address from private key
if [ -n "$MANAGER_DKG_PK" ]; then
  echo "[entrypoint] deriving management wallet address from MANAGER_DKG_PK..."
  EVM_MANAGEMENT_PUBLIC_KEY=$(node /opt/derive-management-wallet.js 2>/tmp/mgmt-err.txt) || true
  if [ -z "$EVM_MANAGEMENT_PUBLIC_KEY" ]; then
    echo "[entrypoint] WARNING: could not derive management wallet: $(cat /tmp/mgmt-err.txt 2>/dev/null)"
  else
    export EVM_MANAGEMENT_PUBLIC_KEY
    echo "[entrypoint] management wallet set: $EVM_MANAGEMENT_PUBLIC_KEY"
  fi
fi

# Write LIBP2P_PRIVATE_KEY to key file if provided (stable peer ID across deployments)
if [ -n "$LIBP2P_PRIVATE_KEY" ]; then
  echo "[entrypoint] writing LIBP2P_PRIVATE_KEY to key file..."
  mkdir -p /opt/ot-node/data/libp2p
  printf '%s' "$LIBP2P_PRIVATE_KEY" > /opt/ot-node/data/libp2p/privateKey
  echo "[entrypoint] key file written."
fi

echo "[entrypoint] injecting env vars into noderc..."
envsubst < /opt/ot-node/.origintrail_noderc.template > /opt/ot-node/.origintrail_noderc
echo "[entrypoint] noderc generated"

echo "[entrypoint] running pre-start peer ID sync (entrypoint pass)..."
node /opt/pre-start.js || echo "[entrypoint] pre-start.js non-fatal exit, continuing"

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
