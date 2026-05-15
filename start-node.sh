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
mysql -u root -e "CREATE DATABASE IF NOT EXISTS operationaldb CHARACTER SET utf8mb4;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'otnode'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';"
mysql -u root -e "GRANT ALL PRIVILEGES ON operationaldb.* TO 'otnode'@'localhost'; FLUSH PRIVILEGES;"
echo "[otnode] DB ready"

echo "[otnode] waiting for Blazegraph on port 9999..."
for i in $(seq 1 40); do
  if nc -z localhost 9999 2>/dev/null; then
    echo "[otnode] Blazegraph up at attempt $i"; break
  fi
  echo "[otnode] Blazegraph not ready ($i/40)..."; sleep 3
done

echo "[otnode] starting ot-node..."
exec node index.js