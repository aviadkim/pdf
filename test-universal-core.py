# TEST UNIVERSAL CORE SYSTEM
# Tests the Phase 1 core infrastructure with real PDF

import sys
import os

# Add core directory to path
core_dir = os.path.join(os.path.dirname(__file__), 'core')
sys.path.insert(0, core_dir)

# Import the universal processor code directly
import importlib.util
spec = importlib.util.spec_from_file_location("universal_pdf_processor", "core/universal-pdf-processor.py")
universal_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(universal_module)

# Import the class
UniversalPDFProcessor = universal_module.UniversalPDFProcessor
import json
from datetime import datetime

def test_with_messos_pdf():
    """Test the universal processor with the actual Messos PDF"""
    
    print("* TESTING UNIVERSAL CORE SYSTEM")
    print("=" * 50)
    
    # Initialize processor
    processor = UniversalPDFProcessor()
    
    # PDF path
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"X PDF not found: {pdf_path}")
        return
    
    print(f"Processing: {os.path.basename(pdf_path)}")
    print("Starting extraction...")
    
    try:
        # Process the PDF
        results = processor.process_pdf(pdf_path)
        
        if "error" in results:
            print(f"X Processing error: {results['error']}")
            return
        
        # Display results
        print("\nEXTRACTION RESULTS")
        print("-" * 30)
        print(f"Processing time: {results['metadata']['processing_time']:.2f} seconds")
        print(f"Total pages: {results['metadata']['total_pages']}")
        print(f"Spatial items: {results['extraction_stats']['total_spatial_items']:,}")
        print(f"ISINs found: {results['extraction_stats']['isins_found']}")
        print(f"Securities extracted: {results['extraction_stats']['securities_extracted']}")
        print(f"Validated securities: {results['extraction_stats']['validated_securities']}")
        print(f"Average confidence: {results['extraction_stats']['average_confidence']:.1%}")
        
        # Portfolio summary
        print(f"\nPORTFOLIO SUMMARY")
        print("-" * 30)
        print(f"Total value: ${results['portfolio_summary']['total_value']:,.2f}")
        print(f"Total securities: {results['portfolio_summary']['total_securities']}")
        print(f"Currencies: {', '.join(results['portfolio_summary']['currencies'])}")
        
        # Validation breakdown
        validation = results['portfolio_summary']['validation_summary']
        print(f"\nVALIDATION STATUS")
        print("-" * 30)
        print(f"Validated: {validation['validated']}")
        print(f"Acceptable: {validation['acceptable']}")
        print(f"Failed: {validation['failed']}")
        print(f"Incomplete: {validation['incomplete']}")
        
        # Show first few securities
        print(f"\nSAMPLE EXTRACTED SECURITIES")
        print("-" * 30)
        for i, security in enumerate(results['securities'][:5]):
            print(f"{i+1}. {security['isin']}")
            print(f"   Name: {security['name'] or 'N/A'}")
            print(f"   Quantity: {security['quantity']:,}" if security['quantity'] else "   Quantity: N/A")
            print(f"   Price: ${security['price']:.4f}" if security['price'] else "   Price: N/A")
            print(f"   Value: ${security['market_value']:,.2f}" if security['market_value'] else "   Value: N/A")
            print(f"   Confidence: {security['confidence_score']:.1%}")
            print(f"   Status: {security['validation_status']}")
            print()
        
        # Compare with known correct data
        print(f"\nCOMPARISON WITH KNOWN CORRECT DATA")
        print("-" * 30)
        
        # Find XS2530201644 in results
        test_isin = "XS2530201644"
        found_security = None
        for sec in results['securities']:
            if sec['isin'] == test_isin:
                found_security = sec
                break
        
        if found_security:
            print(f"+ Found test ISIN: {test_isin}")
            print(f"Expected: Quantity=200,000, Price=$99.1991, Value=$199,080")
            print(f"Extracted: Quantity={found_security['quantity']:,}, Price=${found_security['price']:.4f}, Value=${found_security['market_value']:,.2f}" if all([found_security['quantity'], found_security['price'], found_security['market_value']]) else "Extracted: Incomplete data")
            
            # Calculate accuracy
            if all([found_security['quantity'], found_security['price'], found_security['market_value']]):
                qty_accuracy = 1 - abs(found_security['quantity'] - 200000) / 200000
                price_accuracy = 1 - abs(found_security['price'] - 99.1991) / 99.1991
                value_accuracy = 1 - abs(found_security['market_value'] - 199080) / 199080
                
                print(f"Accuracy: Qty={qty_accuracy:.1%}, Price={price_accuracy:.1%}, Value={value_accuracy:.1%}")
            else:
                print("X Cannot calculate accuracy - incomplete data")
        else:
            print(f"X Test ISIN {test_isin} not found in results")
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"test_results_{timestamp}.json"
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\nDetailed results saved to: {results_file}")
        
        # Assessment
        print(f"\nSYSTEM ASSESSMENT")
        print("-" * 30)
        
        success_rate = results['extraction_stats']['validated_securities'] / results['extraction_stats']['securities_extracted'] * 100 if results['extraction_stats']['securities_extracted'] > 0 else 0
        
        if success_rate >= 80:
            print(f"EXCELLENT: {success_rate:.1f}% validation success rate")
        elif success_rate >= 60:
            print(f"GOOD: {success_rate:.1f}% validation success rate")
        else:
            print(f"NEEDS_IMPROVEMENT: {success_rate:.1f}% validation success rate")
        
        if results['extraction_stats']['average_confidence'] >= 0.7:
            print(f"HIGH_CONFIDENCE: {results['extraction_stats']['average_confidence']:.1%} average confidence")
        else:
            print(f"MEDIUM_CONFIDENCE: {results['extraction_stats']['average_confidence']:.1%} average confidence")
        
        print(f"\nCORE SYSTEM TEST COMPLETE")
        
        return results
        
    except Exception as e:
        print(f"X Test failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_with_messos_pdf()