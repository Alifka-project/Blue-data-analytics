import os
from pathlib import Path

# Project root directory (go up from backend/config to project root)
PROJECT_ROOT = Path(__file__).parent.parent.parent

# Backend directories
BACKEND_ROOT = PROJECT_ROOT / "backend"
BACKEND_APP = BACKEND_ROOT / "app"
BACKEND_API = BACKEND_ROOT / "api"
BACKEND_UTILS = BACKEND_ROOT / "utils"
BACKEND_SCRIPTS = BACKEND_ROOT / "scripts"
BACKEND_TESTS = BACKEND_ROOT / "tests"
BACKEND_LOGS = BACKEND_ROOT / "logs"

# Data directories
DATA_ROOT = PROJECT_ROOT / "data"
DATA_RAW = DATA_ROOT / "raw"
DATA_PROCESSED = DATA_ROOT / "processed"
DATA_RESULTS = DATA_ROOT / "results"
DATA_EXPORTS = DATA_ROOT / "exports"
DATA_BACKUPS = DATA_ROOT / "backups"

# Model directories
MODELS_ROOT = PROJECT_ROOT / "models"
MODELS_SAVED = MODELS_ROOT / "saved"
MODELS_TRAINED = MODELS_ROOT / "trained"
MODELS_EVALUATION = MODELS_ROOT / "evaluation"

# Frontend directories
FRONTEND_ROOT = PROJECT_ROOT / "frontend"
FRONTEND_SRC = FRONTEND_ROOT / "src"
FRONTEND_PUBLIC = FRONTEND_ROOT / "public"
FRONTEND_BUILD = FRONTEND_ROOT / "build"

# Documentation directories
DOCS_ROOT = PROJECT_ROOT / "docs"
DOCS_TECHNICAL = DOCS_ROOT / "technical"
DOCS_USER = DOCS_ROOT / "user"
DOCS_API = DOCS_ROOT / "api"

# Scripts directories
SCRIPTS_ROOT = PROJECT_ROOT / "scripts"
SCRIPTS_DEPLOYMENT = SCRIPTS_ROOT / "deployment"
SCRIPTS_SETUP = SCRIPTS_ROOT / "setup"
SCRIPTS_ANALYSIS = SCRIPTS_ROOT / "analysis"

# Logs directories
LOGS_ROOT = PROJECT_ROOT / "logs"
LOGS_APPLICATION = LOGS_ROOT / "application"
LOGS_ERRORS = LOGS_ROOT / "errors"
LOGS_PERFORMANCE = LOGS_ROOT / "performance"

# File paths
EXCEL_FILE = DATA_RAW / "Blue-data2.xlsx"
EXCEL_FILE_BACKUP = DATA_RAW / "Blue_data.xlsx"

# API settings
API_HOST = "0.0.0.0"
API_PORT = 5001
API_DEBUG = False

# Model settings
MODEL_SETTINGS = {
    "random_state": 42,
    "test_size": 0.2,
    "n_estimators": 100,
    "min_data_threshold": 100
}

# Data processing settings
DATA_SETTINGS = {
    "high_risk_threshold_days": 30,
    "max_predictions": 50,
    "max_filtered_records": 100,
    "growth_rate_estimate": 0.05
}

# Create all necessary directories
def create_directories():
    """Create all necessary directories for the project"""
    directories = [
        # Backend directories
        BACKEND_ROOT, BACKEND_APP, BACKEND_API, BACKEND_UTILS, 
        BACKEND_SCRIPTS, BACKEND_TESTS, BACKEND_LOGS,
        
        # Data directories
        DATA_ROOT, DATA_RAW, DATA_PROCESSED, DATA_RESULTS, 
        DATA_EXPORTS, DATA_BACKUPS,
        
        # Model directories
        MODELS_ROOT, MODELS_SAVED, MODELS_TRAINED, MODELS_EVALUATION,
        
        # Frontend directories
        FRONTEND_ROOT, FRONTEND_SRC, FRONTEND_PUBLIC, FRONTEND_BUILD,
        
        # Documentation directories
        DOCS_ROOT, DOCS_TECHNICAL, DOCS_USER, DOCS_API,
        
        # Scripts directories
        SCRIPTS_ROOT, SCRIPTS_DEPLOYMENT, SCRIPTS_SETUP, SCRIPTS_ANALYSIS,
        
        # Logs directories
        LOGS_ROOT, LOGS_APPLICATION, LOGS_ERRORS, LOGS_PERFORMANCE
    ]
    
    for directory in directories:
        directory.mkdir(parents=True, exist_ok=True)
        print(f"✅ Created directory: {directory}")

# Create directories when module is imported
create_directories()
