#!/bin/bash

echo "🚀 Starting Complete Blue Data Analytics Dashboard..."
echo "📁 Project structure:"
echo "   ├── backend/              (Python ML pipeline)"
echo "   ├── frontend/             (Next.js dashboard)"
echo "   ├── data/                 (Data management)"
echo "   ├── snapshots/            (ML predictions)"
echo "   └── scripts/              (Automation)"

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+"
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

# Check if Excel file exists
if [ ! -f "data/raw/Blue-data2.xlsx" ]; then
    echo "❌ Blue-data2.xlsx not found in data/raw/"
    echo "Please ensure the Excel file is in the data/raw/ directory"
    exit 1
fi

echo "📊 Step 1: Running ETL Pipeline..."
python scripts/etl.py
if [ $? -ne 0 ]; then
    echo "❌ ETL pipeline failed"
    exit 1
fi

echo "🤖 Step 2: Training ML Models..."
python scripts/train.py
if [ $? -ne 0 ]; then
    echo "❌ ML training failed"
    exit 1
fi

echo "✅ Data pipeline completed successfully!"
echo "📁 Snapshots created in: snapshots/$(date +%Y-%m)/"

echo "⚛️  Step 3: Starting Next.js Frontend..."
cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo "🚀 Starting development server..."
echo ""
echo "✅ Dashboard is starting up!"
echo "🌐 Frontend: http://localhost:3000"
echo "📊 API: http://localhost:3000/api/kpi/overview"
echo ""
echo "Press Ctrl+C to stop"

npm run dev
