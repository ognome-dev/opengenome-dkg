#!/bin/bash
set -e

echo "[otnode] waiting for MySQL to accept connections..."
for i in $(seq 1 40); do
  if mysql -u root -e "SELECT 1" >/dev/null 2>&1; then
    echo "[otnode] MySQL is up after attempt $i"
    break
  fi
  echo "[otnode] MySQL not ready yet, attempt $i/40, sleeping 3s..."
  sleep 3
done

echo "[otnode] creating database and user..."
mysql -u root << SQL
CREATE DATABASE IF NOT EXISTS operationaldb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'otnode'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';
GRANT ALL PRIVILEGES ON operationaldb.* TO 'otnode'@'localhost';
FLUSH PRIVILEGES;
SQL
echo "[otnode] DB setup done"

echo "[otnode] waiting for Blazegraph on port 9999..."
for i in $(seq 1 50); do
  if nc -z localhost 9999 2>/dev/null; then
    echo "[otnode] Blazegraph is up after attempt $i"
    break
  fi
  echo "[otnode] Blazegraph not ready, attempt $i/50, sleeping 4s..."
  sleep 4
done

echo "[otnode] starting ot-node..."
exec node index.js
