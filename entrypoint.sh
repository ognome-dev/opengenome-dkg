#!/bin/bash
set -e

echo "[entrypoint] starting at $(date)"
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
