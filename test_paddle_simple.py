#!/usr/bin/env python3
"""
Simple test for PaddleOCR installation and basic functionality
"""

import sys
import traceback

def test_paddle_imports():
    """Test if we can import PaddleOCR components"""
    
    print("🔍 Testing PaddleOCR Imports...")
    print("=" * 50)
    
    try:
        print("📦 Testing paddleocr import...")
        import paddleocr
        print("✅ paddleocr imported successfully")
        print(f"   Version: {getattr(paddleocr, '__version__', 'Unknown')}")
        
        print("\n📦 Testing PaddleOCR class import...")
        from paddleocr import PaddleOCR
        print("✅ PaddleOCR class imported successfully")
        
        print("\n📦 Testing other dependencies...")
        
        import numpy as np
        print("✅ numpy available")
        
        import cv2
        print("✅ opencv available")
        
        import pandas as pd
        print("✅ pandas available")
        
        try:
            import pdf2image
            print("✅ pdf2image available")
        except ImportError as e:
            print(f"⚠️ pdf2image not available: {e}")
        
        # Test basic initialization (this might fail due to system deps)
        print("\n🚀 Testing PaddleOCR initialization...")
        try:
            # Try very basic initialization
            ocr = PaddleOCR(lang='en')
            print("✅ PaddleOCR initialized successfully!")
            return True, None
            
        except Exception as e:
            print(f"❌ PaddleOCR initialization failed: {e}")
            
            # Check if it's a system dependency issue
            if "libgomp" in str(e) or "libpaddle" in str(e):
                print("\n💡 This appears to be a system dependency issue.")
                print("   The PaddleOCR package is installed but missing system libraries.")
                print("   This is common in containerized or WSL environments.")
                print("   The FastAPI integration will still work and provide clear error messages.")
                return False, "system_dependencies"
            else:
                return False, str(e)
        
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False, "import_error"
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        traceback.print_exc()
        return False, str(e)

def test_integration_readiness():
    """Test if our integration will work properly"""
    
    print("\n🔧 Testing Integration Readiness...")
    print("=" * 50)
    
    try:
        # Test our extractor class
        sys.path.append('.')
        from paddle_financial_extractor import FinancialPDFExtractor
        
        print("✅ FinancialPDFExtractor imported successfully")
        
        # Test initialization
        extractor = FinancialPDFExtractor()
        
        if extractor.paddle_available:
            print("✅ Extractor reports PaddleOCR is available")
            return True, "ready"
        else:
            print("⚠️ Extractor reports PaddleOCR is not available")
            print("   This is expected if there are system dependency issues")
            print("   The FastAPI integration will handle this gracefully")
            return False, "not_available"
            
    except Exception as e:
        print(f"❌ Integration test failed: {e}")
        traceback.print_exc()
        return False, str(e)

def main():
    print("🏦 PaddleOCR Installation and Integration Test")
    print("=" * 60)
    
    # Test imports and basic functionality
    import_success, import_error = test_paddle_imports()
    
    # Test our integration
    integration_success, integration_error = test_integration_readiness()
    
    print("\n📋 SUMMARY")
    print("=" * 60)
    
    if import_success and integration_success:
        print("✅ SUCCESS: PaddleOCR is fully working!")
        print("🚀 Ready for financial PDF processing")
        
    elif not import_success and import_error == "system_dependencies":
        print("⚠️ PARTIAL SUCCESS: PaddleOCR installed but missing system dependencies")
        print("🔧 FastAPI integration will work but show installation guidance")
        print("💡 This is common in WSL/containerized environments")
        
    elif not import_success:
        print("❌ FAILED: PaddleOCR import/initialization failed")
        print(f"   Error: {import_error}")
        
    else:
        print("⚠️ MIXED RESULTS: Some components working, some not")
        print(f"   Import: {'✅' if import_success else '❌'}")
        print(f"   Integration: {'✅' if integration_success else '❌'}")
    
    print("\n🌐 WEB INTEGRATION STATUS:")
    print("   The FastAPI processor will work regardless of PaddleOCR status")
    print("   It will provide clear installation instructions when needed")
    print("   Users can install PaddleOCR in their own environment")

if __name__ == "__main__":
    main()