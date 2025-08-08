#!/usr/bin/env python3
"""
Test script to verify Blue Data Analytics installation
"""

import sys
import importlib

def test_import(module_name, package_name=None):
    """Test if a module can be imported"""
    try:
        importlib.import_module(module_name)
        print(f"✅ {package_name or module_name} - OK")
        return True
    except ImportError as e:
        print(f"❌ {package_name or module_name} - FAILED: {e}")
        return False

def main():
    print("🔍 Testing Blue Data Analytics Installation")
    print("=" * 50)
    
    # Core data science packages
    core_packages = [
        ("pandas", "Pandas"),
        ("numpy", "NumPy"),
        ("matplotlib", "Matplotlib"),
        ("seaborn", "Seaborn"),
        ("sklearn", "Scikit-learn"),
    ]
    
    # Optional packages
    optional_packages = [
        ("plotly", "Plotly"),
        ("openpyxl", "OpenPyXL"),
        ("xgboost", "XGBoost"),
        ("lightgbm", "LightGBM"),
    ]
    
    print("\n📊 Core Packages:")
    core_success = 0
    for module, name in core_packages:
        if test_import(module, name):
            core_success += 1
    
    print(f"\n🎯 Optional Packages:")
    optional_success = 0
    for module, name in optional_packages:
        if test_import(module, name):
            optional_success += 1
    
    print("\n" + "=" * 50)
    print(f"📈 Results:")
    print(f"   Core packages: {core_success}/{len(core_packages)} ✅")
    print(f"   Optional packages: {optional_success}/{len(optional_packages)} ✅")
    
    if core_success == len(core_packages):
        print("\n🎉 All core packages are installed correctly!")
        print("   The Blue Data Analytics system should work properly.")
        return True
    else:
        print(f"\n⚠️  {len(core_packages) - core_success} core packages are missing.")
        print("   Please install the missing packages before running the analysis.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
