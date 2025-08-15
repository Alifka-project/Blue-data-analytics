#!/bin/bash

echo "🚀 Starting Blue Data Analytics Frontend..."

# Navigate to frontend directory
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Start development server
echo "⚛️  Starting Next.js development server..."
npm run dev

