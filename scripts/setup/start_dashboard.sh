#!/bin/bash

echo "🚀 Starting Blue Data Analytics Dashboard..."

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check if the Excel file exists
if [ ! -f "Blue-data2.xlsx" ]; then
    echo "❌ Blue-data2.xlsx not found in current directory."
    echo "Please ensure the Excel file is present before starting."
    exit 1
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating Python virtual environment..."
source venv/bin/activate

# Install Python dependencies
echo "📥 Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install Node.js dependencies if not already installed
if [ ! -d "node_modules" ]; then
    echo "📥 Installing Node.js dependencies..."
    npm install
fi

# Start backend in background
echo "🐍 Starting Python backend..."
cd backend
python app.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Check if backend is running
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo "❌ Backend failed to start. Please check the logs above."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "✅ Backend is running on http://localhost:5000"

# Start frontend
echo "⚛️  Starting React frontend..."
npm start &
FRONTEND_PID=$!

echo ""
echo "🎉 Dashboard is starting up!"
echo ""
echo "📊 Backend API: http://localhost:5000"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop both services"
echo ""

# Wait for user to stop
wait

# Cleanup on exit
echo ""
echo "🛑 Stopping services..."
kill $BACKEND_PID 2>/dev/null
kill $FRONTEND_PID 2>/dev/null
echo "✅ Services stopped"

