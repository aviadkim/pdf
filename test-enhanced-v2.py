# TEST ENHANCED UNIVERSAL PROCESSOR V2
# Tests the improved accuracy system

import sys
import os
import json
from datetime import datetime

# Import the enhanced V2 processor
import importlib.util
spec = importlib.util.spec_from_file_location("universal_pdf_processor_v2", "core/universal-pdf-processor-v2.py")
universal_v2_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(universal_v2_module)

UniversalPDFProcessorV2 = universal_v2_module.UniversalPDFProcessorV2

def test_enhanced_v2():
    """Test the enhanced V2 processor"""
    
    print("* TESTING ENHANCED UNIVERSAL PROCESSOR V2")
    print("=" * 60)
    
    # Initialize enhanced processor
    processor = UniversalPDFProcessorV2()
    
    # PDF path
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"X PDF not found: {pdf_path}")
        return
    
    print(f"Processing: {os.path.basename(pdf_path)}")
    print("Starting enhanced extraction...")
    
    try:
        # Process the PDF with V2
        results = processor.process_pdf(pdf_path)
        
        if "error" in results:
            print(f"X Processing error: {results['error']}")
            return
        
        # Display enhanced results
        print("\nENHANCED EXTRACTION RESULTS V2")
        print("-" * 40)
        print(f"Processing time: {results['metadata']['processing_time']:.2f} seconds")
        print(f"Total pages: {results['metadata']['total_pages']}")
        print(f"Extraction method: {results['metadata']['extraction_method']}")
        print(f"Spatial items: {results['extraction_stats']['total_spatial_items']:,}")
        print(f"ISINs found: {results['extraction_stats']['isins_found']}")
        print(f"Securities extracted: {results['extraction_stats']['securities_extracted']}")
        
        # Enhanced validation breakdown
        print(f"\nVALIDATION STATUS (ENHANCED)")
        print("-" * 40)
        print(f"Validated: {results['extraction_stats']['validated_securities']}")
        print(f"Acceptable: {results['extraction_stats']['acceptable_securities']}")
        print(f"Failed: {results['extraction_stats']['failed_securities']}")
        print(f"Average confidence: {results['extraction_stats']['average_confidence']:.1%}")
        print(f"Average validation confidence: {results['extraction_stats']['average_validation_confidence']:.1%}")
        
        # Accuracy metrics
        accuracy = results['portfolio_summary']['accuracy_metrics']
        print(f"\nACCURACY METRICS")
        print("-" * 40)
        print(f"High confidence (>80%): {accuracy['high_confidence_securities']}")
        print(f"Medium confidence (60-80%): {accuracy['medium_confidence_securities']}")
        print(f"Low confidence (<60%): {accuracy['low_confidence_securities']}")
        
        # Portfolio summary
        print(f"\nPORTFOLIO SUMMARY")
        print("-" * 40)
        print(f"Total value: ${results['portfolio_summary']['total_value']:,.2f}")
        print(f"Total securities: {results['portfolio_summary']['total_securities']}")
        print(f"Currencies: {', '.join(results['portfolio_summary']['currencies'])}")
        
        # Show improved sample securities
        print(f"\nSAMPLE EXTRACTED SECURITIES (ENHANCED)")
        print("-" * 40)
        for i, security in enumerate(results['securities'][:5]):
            print(f"{i+1}. {security['isin']} (Page {security['page']})")
            print(f"   Name: {security['name'] or 'N/A'}")
            print(f"   Quantity: {security['quantity']:,}" if security['quantity'] else "   Quantity: N/A")
            print(f"   Price: ${security['price']:.4f}" if security['price'] else "   Price: N/A")
            print(f"   Value: ${security['market_value']:,.2f}" if security['market_value'] else "   Value: N/A")
            print(f"   Currency: {security['currency']}")
            print(f"   Confidence: {security['confidence_score']:.1%}")
            print(f"   Validation: {security['validation_status']} ({security['validation_confidence']:.1%})")
            print()
        
        # Enhanced accuracy test
        print(f"\nENHANCED ACCURACY TEST")
        print("-" * 40)
        
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
            
            if all([found_security['quantity'], found_security['price'], found_security['market_value']]):
                print(f"Extracted: Quantity={found_security['quantity']:,}, Price=${found_security['price']:.4f}, Value=${found_security['market_value']:,.2f}")
                
                # Calculate enhanced accuracy
                qty_accuracy = 1 - abs(found_security['quantity'] - 200000) / 200000
                price_accuracy = 1 - abs(found_security['price'] - 99.1991) / 99.1991
                value_accuracy = 1 - abs(found_security['market_value'] - 199080) / 199080
                
                print(f"Accuracy: Qty={qty_accuracy:.1%}, Price={price_accuracy:.1%}, Value={value_accuracy:.1%}")
                print(f"Validation: {found_security['validation_status']}")
                print(f"Confidence: {found_security['confidence_score']:.1%}")
                
                # Overall accuracy assessment
                overall_accuracy = (qty_accuracy + price_accuracy + value_accuracy) / 3
                if overall_accuracy >= 0.95:
                    print(f"+ EXCELLENT accuracy: {overall_accuracy:.1%}")
                elif overall_accuracy >= 0.80:
                    print(f"+ GOOD accuracy: {overall_accuracy:.1%}")
                else:
                    print(f"- NEEDS IMPROVEMENT: {overall_accuracy:.1%}")
                    
            else:
                print("Extracted: Incomplete data")
                print("X Cannot calculate accuracy - missing fields")
        else:
            print(f"X Test ISIN {test_isin} not found in results")
        
        # Compare with V1 results (if available)
        print(f"\nIMPROVEMENT ANALYSIS")
        print("-" * 40)
        
        success_rate = (results['extraction_stats']['validated_securities'] + 
                       results['extraction_stats']['acceptable_securities']) / results['extraction_stats']['securities_extracted'] * 100
        
        if success_rate >= 80:
            print(f"EXCELLENT: {success_rate:.1f}% validation success rate")
        elif success_rate >= 60:
            print(f"GOOD: {success_rate:.1f}% validation success rate")
        else:
            print(f"NEEDS_IMPROVEMENT: {success_rate:.1f}% validation success rate")
        
        confidence_assessment = results['extraction_stats']['average_confidence']
        if confidence_assessment >= 0.8:
            print(f"HIGH_CONFIDENCE: {confidence_assessment:.1%} average confidence")
        elif confidence_assessment >= 0.6:
            print(f"MEDIUM_CONFIDENCE: {confidence_assessment:.1%} average confidence")
        else:
            print(f"LOW_CONFIDENCE: {confidence_assessment:.1%} average confidence")
        
        # Save enhanced results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"test_enhanced_v2_{timestamp}.json"
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\nDetailed enhanced results saved to: {results_file}")
        
        # Final assessment
        print(f"\nENHANCED SYSTEM ASSESSMENT")
        print("-" * 40)
        
        if success_rate >= 60 and confidence_assessment >= 0.7:
            print("* PHASE 1 CORE INFRASTRUCTURE: SUCCESS")
            print("* Enhanced pattern recognition working")
            print("* Ready for Phase 2: Template System")
        elif success_rate >= 40:
            print("* PHASE 1 CORE INFRASTRUCTURE: PARTIAL SUCCESS")
            print("* Further improvements needed")
        else:
            print("* PHASE 1 CORE INFRASTRUCTURE: NEEDS WORK")
            print("* Fundamental accuracy issues remain")
        
        print(f"\nENHANCED V2 TEST COMPLETE")
        
        return results
        
    except Exception as e:
        print(f"X Enhanced test failed: {e}")
        import traceback
        traceback.print_exc()
        return None

if __name__ == "__main__":
    test_enhanced_v2()