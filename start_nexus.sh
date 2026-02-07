#!/usr/bin/env bash
set -e

# ===============================
# NEXUS FULL STACK START SCRIPT
# Windows + Git Bash (MINGW64)
# ===============================

# 0. Root sabitle
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "==========================================="
echo "🚀 NEXUS FULL STACK (GIT BASH SAFE)"
echo "ROOT: $ROOT_DIR"
echo "==========================================="

# -------------------------------
# [1] Identity Generate
# -------------------------------
echo "🔑 [1/6] Identity generate ediliyor..."
cd "$ROOT_DIR/identity-gen"
node generate-identity.js
cd "$ROOT_DIR"

echo "✅ Identity hazır."

# -------------------------------
# [2] Blockchain Node (Hardhat)
# -------------------------------
echo "⛓️ [2/6] Blockchain Node başlatılıyor (Hardhat)..."
cd "$ROOT_DIR/contract-sol"

# Arka planda çalıştır
npx hardhat node > "$ROOT_DIR/data/hardhat.log" 2>&1 &

cd "$ROOT_DIR"
sleep 6
echo "✅ Blockchain Node ayakta."

# -------------------------------
# [3] Smart Contract Deploy
# -------------------------------
echo "📜 [3/6] Smart Contract deploy ediliyor..."
cd "$ROOT_DIR/contract-sol"
npx hardhat run scripts/deploy.js --network localhost
cd "$ROOT_DIR"

echo "✅ Contract deploy tamam."

# -------------------------------
# [4] Oracle C++
# -------------------------------
echo "🛠️ [4/6] Oracle derleniyor ve çalıştırılıyor..."
g++ -std=c++17 -O2 -o oracle-cpp/oracle.exe oracle-cpp/main.cpp -lssl -lcrypto
(cd oracle-cpp && ./oracle.exe 22.5 60 41.0082 28.9784) &

sleep 2
echo "✅ Oracle çalışıyor."

# -------------------------------
# [5] Gateway Server (API)
# -------------------------------
echo "🛰️ [5/6] Gateway Server başlatılıyor..."
cd "$ROOT_DIR"

# Arka planda API
npx ts-node server.ts > "$ROOT_DIR/data/gateway.log" 2>&1 &

sleep 3
echo "✅ Gateway API ayakta → http://127.0.0.1:8787/health"

# -------------------------------
# [6] Dashboard (Next.js)
# -------------------------------
echo "🌐 [6/6] Dashboard başlatılıyor..."
cd "$ROOT_DIR/dashboard-next"

npx next dev > "$ROOT_DIR/data/dashboard.log" 2>&1 &

sleep 5

# Tarayıcıyı aç
cmd.exe /c "start http://localhost:3000/gate"

cd "$ROOT_DIR"

echo "==========================================="
echo "🎉 NEXUS FULL STACK ÇALIŞIYOR"
echo "Frontend : http://localhost:3000/gate"
echo "Gateway  : http://127.0.0.1:8787"
echo "Health   : http://127.0.0.1:8787/health"
echo "==========================================="
