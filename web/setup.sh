#!/bin/bash

# Professional Web Map Setup Script
# This script sets up and runs the web application

set -e

echo "🗺️  Estado Novo - Mapeamento dos Apelos"
echo "======================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    echo "   Please install Node.js 20+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version must be 20 or higher!"
    echo "   Current version: $(node -v)"
    echo "   Please upgrade: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚙️  Setting up environment..."
    if [ -f env.example ]; then
        cp env.example .env
        echo "✅ Created .env file from template"
        echo ""
        echo "⚠️  IMPORTANT: Edit .env and add your MapTiler API key!"
        echo "   1. Visit https://www.maptiler.com/cloud/"
        echo "   2. Sign up (free tier available)"
        echo "   3. Copy your API key"
        echo "   4. Edit .env and replace 'your_maptiler_key_here'"
        echo ""
        read -p "Press ENTER after you've added your API key..."
    else
        echo "❌ env.example not found!"
        exit 1
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo "✅ Dependencies installed"
    echo ""
fi

# Verify API key is set
if grep -q "your_maptiler_key_here" .env; then
    echo "⚠️  WARNING: MapTiler API key not configured!"
    echo "   The map may not load properly."
    echo "   Edit .env and add your key from https://www.maptiler.com/cloud/"
    echo ""
fi

echo "🚀 Starting development server..."
echo "   → Local: http://localhost:3000"
echo "   → Press Ctrl+C to stop"
echo ""

npm run dev

