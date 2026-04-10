#!/bin/bash
# EcoEats Mission Init Script
# Runs at the start of each worker session

set -e

echo "=== EcoEats Mission Init ==="

# Check Bun is available
if ! command -v bun &> /dev/null; then
    echo "ERROR: Bun is not installed"
    exit 1
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    bun install
fi

# Type check
echo "Running type check..."
bunx tsc --noEmit

# Lint check
echo "Running lint check..."
bunx biome check .

echo "=== Init complete ==="
