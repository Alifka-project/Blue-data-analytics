#!/bin/bash

# Blue Data Analytics - Complete Setup Script
# This script automates the entire setup process for the Blue Data Analytics project

echo "🚀 Blue Data Analytics - Complete Setup Script"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Check if Python is installed
check_python() {
    print_status "Checking Python installation..."
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python found: $PYTHON_VERSION"
        return 0
    elif command -v python &> /dev/null; then
        PYTHON_VERSION=$(python --version)
        print_success "Python found: $PYTHON_VERSION"
        return 0
    else
        print_error "Python is not installed. Please install Python 3.7+ first."
        return 1
    fi
}

# Check if Node.js is installed
check_node() {
    print_status "Checking Node.js installation..."
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js found: $NODE_VERSION"
        return 0
    else
        print_error "Node.js is not installed. Please install Node.js 16+ first."
        return 1
    fi
}

# Check if npm is installed
check_npm() {
    print_status "Checking npm installation..."
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm --version)
        print_success "npm found: $NPM_VERSION"
        return 0
    else
        print_error "npm is not installed. Please install npm first."
        return 1
    fi
}

# Install Python dependencies
install_python_deps() {
    print_status "Installing Python dependencies..."
    
    # Create virtual environment if it doesn't exist
    if [ ! -d "venv" ]; then
        print_status "Creating Python virtual environment..."
        python3 -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Upgrade pip and install build tools first
    print_status "Upgrading pip and installing build tools..."
    pip install --upgrade pip setuptools wheel
    
    # Install requirements (try simple version first)
    print_status "Installing Python packages..."
    if pip install -r requirements_simple.txt; then
        print_success "Python dependencies installed successfully!"
    else
        print_warning "Simple requirements failed, trying full requirements..."
        if pip install -r requirements.txt; then
            print_success "Python dependencies installed successfully!"
        else
            print_error "Failed to install Python dependencies"
            print_status "Trying to install packages individually..."
            
            # Install packages individually
            pip install pandas numpy matplotlib seaborn scikit-learn
            pip install plotly openpyxl xlrd
            
            if [ $? -eq 0 ]; then
                print_success "Core packages installed successfully!"
            else
                print_error "Failed to install even core packages"
                return 1
            fi
        fi
    fi
}

# Install Node.js dependencies
install_node_deps() {
    print_status "Installing Node.js dependencies..."
    
    # Install npm packages
    npm install
    
    if [ $? -eq 0 ]; then
        print_success "Node.js dependencies installed successfully!"
    else
        print_error "Failed to install Node.js dependencies"
        return 1
    fi
}

# Run Python data analysis
run_python_analysis() {
    print_status "Running Python data analysis..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Check if Blue_data.xlsx exists
    if [ ! -f "Blue_data.xlsx" ]; then
        print_warning "Blue_data.xlsx not found. Creating sample data..."
        python3 -c "
import pandas as pd
import numpy as np
from datetime import datetime, timedelta

# Create sample data
np.random.seed(42)
n_records = 10000

# Generate sample data
data = {
    'date': pd.date_range(start='2023-01-01', periods=n_records, freq='D'),
    'customer_id': np.random.randint(1000, 9999, n_records),
    'product_id': np.random.randint(1, 50, n_records),
    'sales_amount': np.random.normal(1000, 300, n_records),
    'quantity': np.random.randint(1, 10, n_records),
    'region': np.random.choice(['North', 'South', 'East', 'West'], n_records),
    'category': np.random.choice(['Electronics', 'Clothing', 'Books', 'Home'], n_records),
    'customer_segment': np.random.choice(['High', 'Medium', 'Low'], n_records),
    'delivery_time': np.random.normal(3, 1, n_records),
    'customer_satisfaction': np.random.normal(4.2, 0.5, n_records),
    'marketing_spend': np.random.normal(500, 100, n_records),
    'competitor_price': np.random.normal(950, 200, n_records)
}

# Ensure positive values
data['sales_amount'] = np.abs(data['sales_amount'])
data['delivery_time'] = np.abs(data['delivery_time'])
data['customer_satisfaction'] = np.clip(data['customer_satisfaction'], 1, 5)
data['marketing_spend'] = np.abs(data['marketing_spend'])
data['competitor_price'] = np.abs(data['competitor_price'])

# Create DataFrame
df = pd.DataFrame(data)

# Save to Excel
df.to_excel('Blue_data.xlsx', index=False)
print('Sample Blue_data.xlsx created successfully!')
"
    fi
    
    # Run Phase 1: Data Analysis
    print_status "Running Phase 1: Comprehensive Data Analysis..."
    python3 data_analysis_phase1.py
    
    if [ $? -eq 0 ]; then
        print_success "Phase 1 completed successfully!"
    else
        print_error "Phase 1 failed"
        return 1
    fi
    
    # Run Phase 2: Predictive Modeling
                print_status "Running Phase 2: Predictive Modeling..."
            if python3 predictive_analysis_phase2_fixed.py; then
                print_success "Phase 2 completed successfully!"
            else
                print_warning "Phase 2 failed, trying simple version..."
                python3 predictive_analysis_phase2_simple.py
            fi
    
    if [ $? -eq 0 ]; then
        print_success "Phase 2 completed successfully!"
    else
        print_error "Phase 2 failed"
        return 1
    fi
}

# Start React development server
start_react_server() {
    print_status "Starting React development server..."
    
    # Start the development server in the background
    npm start &
    REACT_PID=$!
    
    # Wait a moment for the server to start
    sleep 5
    
    # Check if the server is running
    if ps -p $REACT_PID > /dev/null; then
        print_success "React development server started successfully!"
        print_status "Dashboard will be available at: http://localhost:3000"
        print_status "Press Ctrl+C to stop the server"
        
        # Wait for user to stop the server
        wait $REACT_PID
    else
        print_error "Failed to start React development server"
        return 1
    fi
}

# Main execution function
main() {
    echo -e "${CYAN}Starting Blue Data Analytics Setup...${NC}"
    echo ""
    
    # Check prerequisites
    print_status "Checking prerequisites..."
    
    if ! check_python; then
        exit 1
    fi
    
    if ! check_node; then
        exit 1
    fi
    
    if ! check_npm; then
        exit 1
    fi
    
    print_success "All prerequisites met!"
    echo ""
    
    # Install dependencies
    print_status "Installing dependencies..."
    
    if ! install_python_deps; then
        exit 1
    fi
    
    if ! install_node_deps; then
        exit 1
    fi
    
    print_success "All dependencies installed!"
    echo ""
    
    # Test installation
    print_status "Testing installation..."
    if python3 test_installation.py; then
        print_success "Installation test passed!"
    else
        print_warning "Some packages may not be installed correctly, but continuing..."
    fi
    echo ""
    
    # Run analysis
    print_status "Running data analysis..."
    
    if ! run_python_analysis; then
        exit 1
    fi
    
    print_success "Data analysis completed!"
    echo ""
    
    # Start React server
    print_status "Starting dashboard..."
    
    if ! start_react_server; then
        exit 1
    fi
}

# Function to show help
show_help() {
    echo "Blue Data Analytics Setup Script"
    echo ""
    echo "Usage: $0 [OPTION]"
    echo ""
    echo "Options:"
    echo "  -h, --help     Show this help message"
    echo "  -a, --analysis Run only the Python analysis"
    echo "  -d, --dashboard Start only the React dashboard"
    echo "  -f, --full     Run complete setup (default)"
    echo ""
    echo "Examples:"
    echo "  $0              # Run complete setup"
    echo "  $0 --analysis   # Run only Python analysis"
    echo "  $0 --dashboard  # Start only React dashboard"
}

# Parse command line arguments
case "$1" in
    -h|--help)
        show_help
        exit 0
        ;;
    -a|--analysis)
        print_status "Running analysis only..."
        check_python && install_python_deps && run_python_analysis
        exit $?
        ;;
    -d|--dashboard)
        print_status "Starting dashboard only..."
        check_node && check_npm && install_node_deps && start_react_server
        exit $?
        ;;
    -f|--full|"")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        show_help
        exit 1
        ;;
esac
