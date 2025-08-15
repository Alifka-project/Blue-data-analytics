#!/bin/bash

echo "🚀 Starting Blue Data Analytics Dashboard..."

# Check if Python is available
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3 first."
    exit 1
fi

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if data file exists
if [ ! -f "data/raw/Blue-data2.xlsx" ]; then
    echo "❌ Data file not found: data/raw/Blue-data2.xlsx"
    exit 1
fi

echo "✅ Prerequisites check passed"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🐍 Activating Python virtual environment..."
source venv/bin/activate

# Install Python dependencies if needed
if [ ! -f "venv/lib/python*/site-packages/pandas" ]; then
    echo "📦 Installing Python dependencies..."
    pip install pandas numpy scikit-learn openpyxl xlrd python-dateutil pyarrow
fi

# Run ETL pipeline
echo "📊 Running ETL pipeline..."
python scripts/etl.py

# Run ML training
echo "🤖 Training ML models..."
python scripts/train.py

# Start frontend
echo "⚛️  Starting Next.js frontend..."
cd frontend

# Install Node.js dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing Node.js dependencies..."
    npm install
fi

echo "🌐 Starting development server..."
echo "🎯 Your dashboard will be available at: http://localhost:3000"
echo "📊 All pages: Dashboard, EDA, Prediction, Chat, Reporting"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
