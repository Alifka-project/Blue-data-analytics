#!/bin/bash

echo "🔧 Blue Data Analytics - Installation Fix Script"
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    print_error "Virtual environment not found. Please run the main setup script first."
    exit 1
fi

# Activate virtual environment
source venv/bin/activate

print_status "Fixing Python 3.12 compatibility issues..."

# Remove existing packages that might be causing conflicts
print_status "Cleaning existing packages..."
pip uninstall -y pandas numpy matplotlib seaborn scikit-learn plotly openpyxl xlrd xgboost lightgbm

# Upgrade pip and install build tools
print_status "Upgrading pip and installing build tools..."
pip install --upgrade pip setuptools wheel

# Install packages one by one with compatible versions
print_status "Installing packages individually..."

# Core packages
pip install pandas
if [ $? -eq 0 ]; then print_success "Pandas installed"; else print_error "Pandas failed"; fi

pip install numpy
if [ $? -eq 0 ]; then print_success "NumPy installed"; else print_error "NumPy failed"; fi

pip install matplotlib
if [ $? -eq 0 ]; then print_success "Matplotlib installed"; else print_error "Matplotlib failed"; fi

pip install seaborn
if [ $? -eq 0 ]; then print_success "Seaborn installed"; else print_error "Seaborn failed"; fi

pip install scikit-learn
if [ $? -eq 0 ]; then print_success "Scikit-learn installed"; else print_error "Scikit-learn failed"; fi

# Optional packages
print_status "Installing optional packages..."

pip install plotly
if [ $? -eq 0 ]; then print_success "Plotly installed"; else print_warning "Plotly failed (optional)"; fi

pip install openpyxl
if [ $? -eq 0 ]; then print_success "OpenPyXL installed"; else print_warning "OpenPyXL failed (optional)"; fi

pip install xlrd
if [ $? -eq 0 ]; then print_success "XLrd installed"; else print_warning "XLrd failed (optional)"; fi

# Try to install advanced ML packages
pip install xgboost
if [ $? -eq 0 ]; then print_success "XGBoost installed"; else print_warning "XGBoost failed (optional)"; fi

pip install lightgbm
if [ $? -eq 0 ]; then print_success "LightGBM installed"; else print_warning "LightGBM failed (optional)"; fi

print_status "Testing installation..."
python3 test_installation.py

if [ $? -eq 0 ]; then
    print_success "Installation fix completed successfully!"
    print_status "You can now run the analysis scripts."
else
    print_warning "Some packages may not be installed, but core functionality should work."
fi

