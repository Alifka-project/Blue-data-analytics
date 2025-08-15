#!/bin/bash

echo "🚀 Starting Blue Data Analytics Dashboard (Restructured)..."
echo "📁 Project structure:"
echo "   ├── data/raw/          (Excel files)"
echo "   ├── data/processed/     (Processed data)"
echo "   ├── data/results/       (Analysis results)"
echo "   ├── models/saved/       (Saved models)"
echo "   ├── models/trained/     (Trained models)"
echo "   ├── utils/helpers/      (Data & model utilities)"
echo "   ├── utils/analysis/     (Business analysis)"
echo "   ├── config/             (Configuration)"
echo "   └── logs/               (Application logs)"

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

# Create virtual environment if it doesn't exist
if [ ! -d "clean_env" ]; then
    echo "🐍 Creating Python virtual environment..."
    python3 -m venv clean_env
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source clean_env/bin/activate

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create necessary directories
echo "📁 Creating project directories..."
mkdir -p data/raw data/processed data/results models/saved models/trained utils/helpers utils/analysis config logs

# Check if Excel file exists
if [ ! -f "data/raw/Blue-data2.xlsx" ]; then
    echo "❌ Blue-data2.xlsx not found in data/raw/"
    echo "Please ensure the Excel file is in the data/raw/ directory"
    exit 1
fi

# Start Python backend
echo "🐍 Starting Python backend..."
python app.py &
BACKEND_PID=$!

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 5

# Check if backend is running
if ! curl -s http://localhost:5001/api/health > /dev/null; then
    echo "❌ Backend failed to start. Please check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend is running on http://localhost:5001"

# Start React frontend
echo "⚛️  Starting React frontend..."
npm start &
FRONTEND_PID=$!

echo "✅ Dashboard is starting up!"
echo "🌐 Backend: http://localhost:5001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"

# Wait for user to stop
wait

# Cleanup on exit
echo "🧹 Cleaning up..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ Dashboard stopped"
