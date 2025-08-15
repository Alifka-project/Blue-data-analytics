#!/usr/bin/env python3
"""
Test script to verify backend dependencies and basic functionality
"""

import sys
import os

def test_dependencies():
    """Test if all required dependencies can be imported"""
    print("🔍 Testing backend dependencies...")
    
    try:
        import pandas as pd
        print(f"✅ Pandas {pd.__version__}")
    except ImportError as e:
        print(f"❌ Pandas import failed: {e}")
        return False
    
    try:
        import numpy as np
        print(f"✅ NumPy {np.__version__}")
    except ImportError as e:
        print(f"❌ NumPy import failed: {e}")
        return False
    
    try:
        import sklearn
        print(f"✅ Scikit-learn {sklearn.__version__}")
    except ImportError as e:
        print(f"❌ Scikit-learn import failed: {e}")
        return False
    
    try:
        import flask
        print(f"✅ Flask {flask.__version__}")
    except ImportError as e:
        print(f"❌ Flask import failed: {e}")
        return False
    
    try:
        import plotly
        print(f"✅ Plotly {plotly.__version__}")
    except ImportError as e:
        print(f"❌ Plotly import failed: {e}")
        return False
    
    return True

def test_excel_file():
    """Test if the Excel file can be read"""
    print("\n📊 Testing Excel file access...")
    
    excel_file = "Blue-data2.xlsx"
    if not os.path.exists(excel_file):
        print(f"❌ Excel file not found: {excel_file}")
        return False
    
    try:
        import pandas as pd
        df = pd.read_excel(excel_file)
        print(f"✅ Excel file loaded successfully: {len(df)} rows, {len(df.columns)} columns")
        print(f"   Columns: {list(df.columns)}")
        return True
    except Exception as e:
        print(f"❌ Excel file read failed: {e}")
        return False

def test_basic_ml():
    """Test basic machine learning functionality"""
    print("\n🤖 Testing basic ML functionality...")
    
    try:
        from sklearn.ensemble import RandomForestClassifier
        from sklearn.model_selection import train_test_split
        from sklearn.preprocessing import LabelEncoder
        
        # Create dummy data
        import numpy as np
        X = np.random.rand(100, 5)
        y = np.random.randint(0, 2, 100)
        
        # Test basic ML operations
        le = LabelEncoder()
        y_encoded = le.fit_transform(y)
        
        X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2)
        
        rf = RandomForestClassifier(n_estimators=10, random_state=42)
        rf.fit(X_train, y_train)
        
        score = rf.score(X_test, y_test)
        print(f"✅ Basic ML test passed: Random Forest accuracy = {score:.3f}")
        return True
        
    except Exception as e:
        print(f"❌ Basic ML test failed: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 Blue Data Analytics Dashboard - Backend Test")
    print("=" * 50)
    
    # Test dependencies
    if not test_dependencies():
        print("\n❌ Dependency test failed. Please install required packages.")
        return False
    
    # Test Excel file
    if not test_excel_file():
        print("\n❌ Excel file test failed. Please check Blue-data2.xlsx.")
        return False
    
    # Test ML functionality
    if not test_basic_ml():
        print("\n❌ ML functionality test failed.")
        return False
    
    print("\n🎉 All tests passed! Backend is ready to run.")
    print("\nTo start the backend:")
    print("cd backend")
    print("python app.py")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

