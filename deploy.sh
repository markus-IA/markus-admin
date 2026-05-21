#!/bin/bash
set -e

echo "=== Markus Admin Deploy ==="
cd /root/markus-admin

echo "[1/3] Atualizando código..."
git fetch origin
git reset --hard origin/main

echo "[2/3] Build da imagem..."
docker compose build markus-admin

echo "[3/3] Reiniciando container..."
docker compose up -d --no-deps markus-admin

echo ""
echo "=== Deploy concluído ==="
docker compose ps markus-admin
