#!/bin/bash
set -e

echo "[otnode] waiting for MySQL to be ready..."
for i in $(seq 1 30); do
  if mysql -u root --skip-password -e "SELECT 1" >/dev/null 2>&1; then
    echo "[otnode] MySQL is up"
    break
  fi
  echo "[otnode] attempt $i/30 — retrying in 3s..."
  sleep 3
done

echo "[otnode] setting up database and user..."
mysql -u root --skip-password << SQL
  CREATE DATABASE IF NOT EXISTS operationaldb CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER IF NOT EXISTS 'otnode'@'localhost' IDENTIFIED BY '${MYSQL_PASSWORD}';
  GRANT ALL PRIVILEGES ON operationaldb.* TO 'otnode'@'localhost';
  FLUSH PRIVILEGES;
SQL

echo "[otnode] waiting for Blazegraph on port 9999..."
for i in $(seq 1 40); do
  if nc -z localhost 9999 2>/dev/null; then
    echo "[otnode] Blazegraph is up"
    break
  fi
  echo "[otnode] attempt $i/40 — retrying in 4s..."
  sleep 4
done

echo "[otnode] launching ot-node..."
exec node index.js
