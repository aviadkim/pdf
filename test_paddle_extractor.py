#!/usr/bin/env python3
"""
Test the PaddleOCR Financial Extractor
"""

import os
import asyncio
from pathlib import Path
from paddle_financial_extractor import FinancialPDFExtractor

async def test_paddle_extractor():
    """Test the PaddleOCR extractor with available PDFs"""
    
    print("🏦 Testing PaddleOCR Financial PDF Extractor")
    print("=" * 60)
    
    # Initialize extractor
    extractor = FinancialPDFExtractor()
    
    # Check if PaddleOCR is available
    if not extractor.paddle_available:
        print("❌ PaddleOCR not available!")
        print("📦 To install:")
        print("   pip install paddlepaddle paddleocr pdf2image opencv-python pandas pillow")
        print("   OR create virtual environment:")
        print("   python3 -m venv paddle_env")
        print("   source paddle_env/bin/activate")
        print("   pip install -r requirements_paddle.txt")
        return
    
    # Find available PDFs
    pdf_files = list(Path(".").glob("*.pdf"))
    
    if not pdf_files:
        print("📄 No PDF files found in current directory")
        print("📁 Available files:")
        for file in Path(".").glob("*.*"):
            print(f"   {file.name}")
        return
    
    print(f"📁 Found {len(pdf_files)} PDF files:")
    for i, pdf_file in enumerate(pdf_files):
        print(f"   {i+1}. {pdf_file.name}")
    
    # Test with first PDF
    test_pdf = pdf_files[0]
    print(f"\n🔍 Testing with: {test_pdf.name}")
    
    try:
        # Extract financial data
        result = await extractor.extract_financial_data(str(test_pdf), "paddle_output")
        
        if result.success:
            print("\n✅ EXTRACTION SUCCESSFUL!")
            print(f"🏦 Institution: {result.institution}")
            print(f"📄 Document Type: {result.document_type}")
            print(f"💰 Total Portfolio Value: ${result.total_value:,.2f}")
            print(f"📊 Securities Found: {len(result.securities)}")
            print(f"🏧 Accounts Found: {len(result.accounts)}")
            print(f"📋 Tables Processed: {len(result.tables)}")
            print(f"⚡ Processing Time: {result.processing_time:.2f} seconds")
            print(f"🎯 Confidence: {result.confidence:.1%}")
            
            # Show sample securities
            if result.securities:
                print("\n📈 SAMPLE SECURITIES:")
                for i, security in enumerate(result.securities[:3]):
                    print(f"  {i+1}. {security.name or 'Unknown'}")
                    if security.isin:
                        print(f"     ISIN: {security.isin}")
                    if security.quantity and security.price:
                        print(f"     Qty: {security.quantity:,.0f} @ ${security.price:.2f}")
                    if security.market_value:
                        print(f"     Value: ${security.market_value:,.2f}")
                    print()
            
            # Show text sample
            print(f"\n📝 TEXT SAMPLE:")
            print(result.full_text[:500] + "..." if len(result.full_text) > 500 else result.full_text)
            
            print(f"\n💾 Results saved to: paddle_output/")
            
        else:
            print("❌ EXTRACTION FAILED!")
            for error in result.errors:
                print(f"   Error: {error}")
                
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_paddle_extractor())