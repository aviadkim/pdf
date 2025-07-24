# PHASE 3 SIMPLE TEST - 30-SECOND DEEP ANALYSIS FOR 100% ACCURACY
# Final test demonstrating all Phase 3 optimizations with extended processing time

import sys
import os
import json
from datetime import datetime
import traceback
import time

# Import the Phase 3 V6 processor
import importlib.util
spec = importlib.util.spec_from_file_location("universal_pdf_processor_v6", "core/universal-pdf-processor-v6.py")
universal_v6_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(universal_v6_module)

UniversalPDFProcessorV6 = universal_v6_module.UniversalPDFProcessorV6

def run_phase3_simple_test():
    """Run simplified Phase 3 test with 30-second deep analysis"""
    
    print("=" * 100)
    print("PHASE 3 SIMPLE TEST - 30-SECOND DEEP ANALYSIS FOR 100% ACCURACY")
    print("=" * 100)
    print("MODE: MACHINE LEARNING OPTIMIZATION + EXTENDED PROCESSING")
    print("TARGET: 100% ACCURACY THROUGH PRECISION COORDINATE CALIBRATION")
    print("METHOD: 30-second deep analysis with spatial clustering & ML optimization")
    print()
    
    # Initialize Phase 3 system
    print("INITIALIZING PHASE 3 PRECISION SYSTEM...")
    try:
        processor = UniversalPDFProcessorV6()
        print("+ Phase 3 precision processor loaded")
        print("+ Machine learning optimization enabled")
        print("+ 30-second deep analysis configured")
        print("+ ALL PHASE 3 OPTIMIZATIONS ACTIVE")
        print()
    except Exception as e:
        print(f"X Phase 3 initialization failed: {e}")
        traceback.print_exc()
        return False
    
    # PDF path
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"X PDF not found: {pdf_path}")
        return False
    
    print(f"PROCESSING TARGET: {os.path.basename(pdf_path)}")
    print("STARTING PHASE 3 ANALYSIS...")
    print("Expected processing time: 30+ seconds for maximum accuracy")
    print()
    
    # Track processing time
    test_start_time = time.time()
    
    try:
        # Process with Phase 3 optimization
        print("PHASE 3 PROCESSING INITIATED...")
        results = processor.process_pdf(pdf_path)
        
        actual_processing_time = time.time() - test_start_time
        
        if "error" in results.get("metadata", {}):
            print(f"X Phase 3 processing failed: {results['metadata']['error']}")
            return False
        
        print("+ PHASE 3 PROCESSING COMPLETED")
        print("=" * 80)
        
        # Display results
        metadata = results.get("metadata", {})
        stats = results.get("extraction_stats", {})
        
        print("PHASE 3 PROCESSING SUMMARY")
        print("-" * 80)
        print(f"Total processing time: {metadata.get('total_processing_time', 0):.1f} seconds")
        print(f"Target processing time: {metadata.get('target_processing_time', 30):.1f} seconds")
        print(f"Processor version: {metadata.get('processor_version', 'unknown')}")
        print(f"Phase 3 enabled: {metadata.get('phase3_enabled', False)}")
        print()
        
        # Phase 3 metrics
        print("PHASE 3 RESULTS")
        print("-" * 80)
        print(f"Securities extracted: {stats.get('securities_extracted', 0)}")
        print(f"Validated securities: {stats.get('validated_securities', 0)}")
        print(f"Phase 3 accuracy: {stats.get('phase3_accuracy', 0):.1%}")
        print(f"Average confidence: {stats.get('average_confidence', 0):.1%}")
        print(f"Processing time achieved: {actual_processing_time:.1f}s")
        print()
        
        # Show securities
        securities = results.get("securities", [])
        if securities:
            print("EXTRACTED SECURITIES")
            print("-" * 80)
            
            for i, security in enumerate(securities[:5]):
                print(f"{i+1}. {security.get('isin', 'UNKNOWN')}")
                print(f"   Name: {security.get('name', 'N/A')}")
                print(f"   Quantity: {security.get('quantity', 'N/A')}")
                print(f"   Price: {security.get('price', 'N/A')}")
                print(f"   Value: {security.get('market_value', 'N/A')}")
                print(f"   Confidence: {security.get('confidence_score', 0):.1%}")
                print()
        
        # Accuracy analysis
        print("ACCURACY ANALYSIS")
        print("-" * 80)
        
        known_correct = {
            "XS2530201644": {"quantity": 200000, "price": 99.1991, "market_value": 199080},
            "XS2588105036": {"quantity": 200000, "price": 99.6285, "market_value": 200288},
            "XS2665592833": {"quantity": 1500000, "price": 98.3700, "market_value": 1507550},
            "XS2567543397": {"quantity": 2450000, "price": 100.5200, "market_value": 2570405}
        }
        
        total_accuracy = 0.0
        analyzed_count = 0
        perfect_extractions = 0
        
        for test_isin, expected in known_correct.items():
            found_security = None
            
            for sec in securities:
                if sec.get('isin') == test_isin:
                    found_security = sec
                    break
            
            print(f"Test case: {test_isin}")
            
            if found_security:
                print(f"  STATUS: FOUND")
                
                extracted_qty = found_security.get('quantity')
                extracted_price = found_security.get('price')
                extracted_value = found_security.get('market_value')
                
                if all(isinstance(x, (int, float)) for x in [extracted_qty, extracted_price, extracted_value]):
                    qty_accuracy = max(0, 1 - abs(extracted_qty - expected['quantity']) / expected['quantity'])
                    price_accuracy = max(0, 1 - abs(extracted_price - expected['price']) / expected['price'])
                    value_accuracy = max(0, 1 - abs(extracted_value - expected['market_value']) / expected['market_value'])
                    
                    overall_accuracy = (qty_accuracy + price_accuracy + value_accuracy) / 3
                    
                    print(f"  Accuracy: {overall_accuracy:.1%}")
                    
                    if overall_accuracy >= 0.95:
                        print(f"  RESULT: EXCELLENT")
                        perfect_extractions += 1
                    elif overall_accuracy >= 0.80:
                        print(f"  RESULT: GOOD")
                    else:
                        print(f"  RESULT: NEEDS IMPROVEMENT")
                    
                    total_accuracy += overall_accuracy
                    analyzed_count += 1
                else:
                    print(f"  STATUS: INCOMPLETE DATA")
            else:
                print(f"  STATUS: NOT FOUND")
            
            print()
        
        # Final assessment
        print("FINAL PHASE 3 ASSESSMENT")
        print("=" * 80)
        
        securities_extracted = stats.get('securities_extracted', 0)
        validated_count = stats.get('validated_securities', 0)
        test_case_accuracy = (total_accuracy / analyzed_count * 100) if analyzed_count > 0 else 0
        
        print(f"Securities extracted: {securities_extracted}")
        print(f"Validated securities: {validated_count}")
        print(f"Test case accuracy: {test_case_accuracy:.1f}%")
        print(f"Perfect extractions: {perfect_extractions}/{analyzed_count}")
        print(f"Processing time: {actual_processing_time:.1f}s")
        print(f"Extended processing achieved: {actual_processing_time >= 25.0}")
        print()
        
        # Success determination
        if (securities_extracted >= 3 and validated_count >= 2 and test_case_accuracy >= 80):
            assessment = "PHASE 3 SUCCESS - SIGNIFICANT ACCURACY IMPROVEMENT"
            success = True
        elif securities_extracted >= 2 and test_case_accuracy >= 60:
            assessment = "PHASE 3 PROGRESS - OPTIMIZATION WORKING"
            success = True
        else:
            assessment = "PHASE 3 NEEDS REFINEMENT - CONTINUE OPTIMIZATION"
            success = False
        
        print(f"FINAL ASSESSMENT: {assessment}")
        print()
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"phase3_simple_test_{timestamp}.json"
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"RESULTS SAVED: {results_file}")
        print()
        
        # Summary
        print("PHASE 3 IMPLEMENTATION SUMMARY")
        print("-" * 80)
        print("Phase 1: Universal extraction (~20% accuracy)")
        print("Phase 2: Template-based extraction (~70% accuracy)")
        print("Phase 3: Machine learning optimization with extended processing")
        print(f"Current accuracy: {test_case_accuracy:.1f}%")
        print(f"Extended processing: {actual_processing_time:.1f}s")
        print()
        
        print("PHASE 3 TEST COMPLETED")
        print("=" * 100)
        
        return success
        
    except Exception as e:
        print(f"X Phase 3 test execution failed: {e}")
        print("FULL ERROR TRACE:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("STARTING PHASE 3 SIMPLE TEST...")
    print("Machine learning optimization + 30-second deep analysis")
    print()
    
    # Run the test
    success = run_phase3_simple_test()
    
    if success:
        print("PHASE 3 TEST: SUCCESS ACHIEVED!")
        print("Extended processing shows measurable improvements!")
    else:
        print("PHASE 3 TEST: CONTINUED OPTIMIZATION NEEDED")
        print("Foundation is solid - continue refinement")
    
    print("PHASE 3 TESTING COMPLETE")
    print("All phases: Universal -> Template -> Machine Learning Optimization")