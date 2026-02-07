#!/bin/bash

echo "--------------------------------------------------"
echo "🚀 NEXUS DIGITAL SEAL PROTOCOL INITIALIZING..."
echo "--------------------------------------------------"

# 1. Identity Generation
echo "🆔 [1/4] Generating Asset Identity..."
cd identity-gen && python3 generator.py
cd ..

# 2. C++ Oracle Compilation & Execution
echo "📡 [2/4] Initializing Oracle Node (C++)..."
cd oracle-cpp
g++ -o oracle main.cpp
./oracle
cd ..

# 3. Python Edge Validation
echo "🧠 [3/4] Running Edge Case Analysis (Python)..."
cd edge-python
python3 validator.py ALPHA-1 5.5 40.71 -74.00
cd ..

# 4. Starting Dashboard
echo "🖥️ [4/4] Launching Command Center..."
cd dashboard-next
npm run dev
