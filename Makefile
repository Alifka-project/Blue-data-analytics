.PHONY: help install setup start stop clean test lint format docs build deploy

# Default target
help:
	@echo "🚀 Blue Data Analytics Dashboard - Development Commands"
	@echo ""
	@echo "📦 Setup & Installation:"
	@echo "  install     Install all dependencies (Python + Node.js)"
	@echo "  setup       Setup development environment"
	@echo ""
	@echo "🚀 Development:"
	@echo "  start       Start both backend and frontend"
	@echo "  start-backend  Start only the Python backend"
	@echo "  start-frontend Start only the React frontend"
	@echo "  stop        Stop all running services"
	@echo ""
	@echo "🧪 Testing & Quality:"
	@echo "  test        Run Python tests"
	@echo "  test-frontend Run frontend tests"
	@echo "  lint        Run linting checks"
	@echo "  format      Format code with black and isort"
	@echo ""
	@echo "📚 Documentation:"
	@echo "  docs        Build documentation"
	@echo "  docs-serve  Serve documentation locally"
	@echo ""
	@echo "🏗️ Build & Deploy:"
	@echo "  build       Build frontend for production"
	@echo "  deploy      Deploy to production"
	@echo ""
	@echo "🧹 Maintenance:"
	@echo "  clean       Clean temporary files and caches"
	@echo "  reset       Reset project to clean state"

# Installation
install: install-backend install-frontend

install-backend:
	@echo "🐍 Installing Python dependencies..."
	cd backend && python -m venv venv
	cd backend && source venv/bin/activate && pip install -r requirements.txt
	@echo "✅ Backend dependencies installed"

install-frontend:
	@echo "📦 Installing Node.js dependencies..."
	cd frontend && npm install
	@echo "✅ Frontend dependencies installed"

# Setup
setup: install
	@echo "🔧 Setting up development environment..."
	@mkdir -p data/raw data/processed data/results data/exports data/backups
	@mkdir -p models/saved models/trained models/evaluation
	@mkdir -p logs/application logs/errors logs/performance
	@mkdir -p docs/technical docs/user docs/api
	@echo "✅ Development environment setup complete"

# Development
start:
	@echo "🚀 Starting Blue Data Analytics Dashboard..."
	@chmod +x scripts/setup/start_dashboard.sh
	./scripts/setup/start_dashboard.sh

start-backend:
	@echo "🐍 Starting Python backend..."
	cd backend && source venv/bin/activate && python app/main.py

start-frontend:
	@echo "⚛️ Starting React frontend..."
	cd frontend && npm start

stop:
	@echo "🛑 Stopping all services..."
	@pkill -f "python.*main.py" || true
	@pkill -f "npm.*start" || true
	@echo "✅ All services stopped"

# Testing & Quality
test:
	@echo "🧪 Running Python tests..."
	cd backend && source venv/bin/activate && python -m pytest tests/ -v

test-frontend:
	@echo "🧪 Running frontend tests..."
	cd frontend && npm test

lint:
	@echo "🔍 Running linting checks..."
	cd backend && source venv/bin/activate && flake8 app/ utils/ config/
	cd frontend && npm run lint

format:
	@echo "✨ Formatting code..."
	cd backend && source venv/bin/activate && black app/ utils/ config/
	cd backend && source venv/bin/activate && isort app/ utils/ config/
	cd frontend && npm run format

# Documentation
docs:
	@echo "📚 Building documentation..."
	cd docs && make html

docs-serve:
	@echo "🌐 Serving documentation..."
	cd docs && python -m http.server 8000

# Build & Deploy
build:
	@echo "🏗️ Building frontend for production..."
	cd frontend && npm run build

deploy:
	@echo "🚀 Deploying to production..."
	@echo "⚠️  Deployment not configured. Please configure your deployment pipeline."

# Maintenance
clean:
	@echo "🧹 Cleaning temporary files..."
	@find . -type f -name "*.pyc" -delete
	@find . -type d -name "__pycache__" -delete
	@find . -type d -name "*.egg-info" -delete
	@find . -type d -name ".pytest_cache" -delete
	@find . -type d -name ".coverage" -delete
	@find . -type f -name "*.log" -delete
	@echo "✅ Cleanup complete"

reset: clean
	@echo "🔄 Resetting project to clean state..."
	@rm -rf backend/venv
	@rm -rf frontend/node_modules
	@rm -rf frontend/build
	@rm -rf data/processed data/results data/exports data/backups
	@rm -rf models/trained models/evaluation
	@rm -rf logs/application logs/errors logs/performance
	@echo "✅ Project reset complete"

# Data management
data-export:
	@echo "📊 Exporting data..."
	cd backend && source venv/bin/activate && python scripts/analysis/export_data.py

data-backup:
	@echo "💾 Creating data backup..."
	@cp -r data/raw data/backups/$(shell date +%Y%m%d_%H%M%S)
	@echo "✅ Data backup created"

# Model management
train-models:
	@echo "🤖 Training ML models..."
	cd backend && source venv/bin/activate && python scripts/analysis/train_models.py

evaluate-models:
	@echo "📈 Evaluating ML models..."
	cd backend && source venv/bin/activate && python scripts/analysis/evaluate_models.py

# Development helpers
shell:
	@echo "🐍 Starting Python shell..."
	cd backend && source venv/bin/activate && python

logs:
	@echo "📋 Showing recent logs..."
	@tail -f logs/application/app.log

status:
	@echo "📊 Project Status:"
	@echo "  Backend: $(shell pgrep -f 'python.*main.py' > /dev/null && echo '✅ Running' || echo '❌ Stopped')"
	@echo "  Frontend: $(shell pgrep -f 'npm.*start' > /dev/null && echo '✅ Running' || echo '❌ Stopped')"
	@echo "  Data: $(shell ls data/raw/*.xlsx 2>/dev/null | wc -l | tr -d ' ') Excel files found"
	@echo "  Models: $(shell ls models/trained/*.joblib 2>/dev/null | wc -l | tr -d ' ') trained models"

