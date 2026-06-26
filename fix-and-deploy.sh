#!/bin/bash

# GitHub Pages Deployment Fix Script
set -e

echo "🔧 GitHub Pages Deployment Fix"
echo "================================"
echo ""

# Check if we're in the right directory
if [ ! -f "web/package.json" ]; then
    echo "❌ Error: Run this script from the repo root directory"
    exit 1
fi

echo "✅ Repository structure verified"
echo ""

# Step 1: Ensure data file is in place
echo "📁 Step 1: Copying data files..."
mkdir -p web/public/data
if ls processed_data/*.geojson >/dev/null 2>&1; then
    cp processed_data/*.geojson web/public/data/
    echo "✅ Data files copied to web/public/data/"
else
    echo "⚠️  Warning: no .geojson files found in processed_data/"
fi
echo ""

# Step 2: Test build locally
echo "🔨 Step 2: Testing build locally..."
cd web

if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

echo "🔍 Running type check..."
npm run type-check

echo "🏗️  Building for production..."
npm run build

echo "✅ Build successful!"
echo ""

cd ..

# Step 3: Check git status
echo "📊 Step 3: Current git status..."
git status --short
echo ""

# Step 4: Prompt for deployment
echo "🚀 Step 4: Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. Make sure you've enabled GitHub Pages:"
echo "   → Go to https://github.com/eu-cristofer/geo/settings/pages"
echo "   → Source: GitHub Actions"
echo ""
echo "2. Make sure you've added the secret:"
echo "   → Go to https://github.com/eu-cristofer/geo/settings/secrets/actions"
echo "   → Add: VITE_MAPTILER_KEY"
echo ""
echo "3. Push to deploy:"
read -p "   Do you want to commit and push now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    git add .
    git commit -m "Fix GitHub Pages deployment" || echo "Nothing to commit"
    git push origin main
    echo ""
    echo "✅ Pushed to GitHub!"
    echo ""
    echo "🌐 Your site will be available at:"
    echo "   https://eu-cristofer.github.io/geo/"
    echo ""
    echo "📊 Monitor deployment:"
    echo "   https://github.com/eu-cristofer/geo/actions"
else
    echo ""
    echo "👍 No problem! When ready, run:"
    echo "   git add ."
    echo "   git commit -m 'Fix GitHub Pages deployment'"
    echo "   git push origin main"
fi

echo ""
echo "✨ Done!"

