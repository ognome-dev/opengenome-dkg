#!/bin/bash
set -e
echo "[otnode] waiting for MySQL..."
for i in $(seq 1 40); do
  if mysql -u root -e "SELECT 1" >/dev/null 2>&1; then
    echo "[otnode] MySQL up at attempt $i"; break
  fi
  echo "[otnode] MySQL not ready ($i/40)..."; sleep 3
done

echo "[otnode] setting up DB..."
mysql -u root -e "SET GLOBAL log_bin_trust_function_creators = 1;"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS operationaldb CHARACTER SET utf8mb4;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'otnode'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -u root -e "GRANT ALL PRIVILEGES ON operationaldb.* TO 'otnode'@'localhost'; FLUSH PRIVILEGES;"
echo "[otnode] DB ready"

echo "[otnode] waiting for Fuseki on port 3030..."
for i in $(seq 1 40); do
  if nc -z localhost 3030 2>/dev/null; then
    echo "[otnode] Fuseki up at attempt $i"; break
  fi
  echo "[otnode] Fuseki not ready ($i/40)..."; sleep 3
done

echo "[otnode] running pre-start peer ID sync..."
node /opt/pre-start.js || echo "[otnode] pre-start.js non-fatal error, continuing"
echo "[otnode] pre-start done"

# Background: wait for ot-node to generate the key, then print it clearly
# Repeats every 30s for 20 minutes so it's impossible to miss in Railway logs
if [ -z "$LIBP2P_PRIVATE_KEY" ]; then
  (
    KEY_PATH="/opt/ot-node/data/libp2p/privateKey"
    for attempt in $(seq 1 40); do
      sleep 30
      if [ -f "$KEY_PATH" ]; then
        KEY=$(cat "$KEY_PATH")
        echo ""
        echo "################################################################"
        echo "## LIBP2P_PRIVATE_KEY — SET THIS IN RAILWAY VARIABLES NOW     ##"
        echo "################################################################"
        echo "$KEY"
        echo "################################################################"
        echo "## Copy the line above. Railway → Variables → LIBP2P_PRIVATE_KEY"
        echo "################################################################"
        echo ""
        sleep 60
      fi
    done
  ) &
fi

echo "[otnode] launching ot-node..."
exec node index.js
