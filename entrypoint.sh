#!/bin/bash
set -e

echo "[startup] injecting env vars into node config..."
envsubst < /opt/ot-node/.origintrail_noderc.template > /opt/ot-node/.origintrail_noderc

echo "[startup] initializing MySQL data directory..."
if [ ! -d "/var/lib/mysql/mysql" ]; then
  mysqld --initialize-insecure --user=mysql --datadir=/var/lib/mysql
fi

echo "[startup] starting all services via supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
