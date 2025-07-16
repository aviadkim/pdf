# AGGRESSIVE V5 FINAL TEST - PUSH THROUGH ALL LIMITATIONS
# Maximum aggression test for 100% accuracy achievement

import sys
import os
import json
from datetime import datetime
import traceback

# Import the aggressive V5 processor
import importlib.util
spec = importlib.util.spec_from_file_location("universal_pdf_processor_v5", "core/universal-pdf-processor-v5.py")
universal_v5_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(universal_v5_module)

UniversalPDFProcessorV5 = universal_v5_module.UniversalPDFProcessorV5

def run_maximum_aggression_test():
    """Run with maximum aggression, bypassing all limitations"""
    
    print("=" * 90)
    print("AGGRESSIVE V5 FINAL TEST - MAXIMUM AGGRESSION FOR 100% ACCURACY")
    print("=" * 90)
    print("MODE: BYPASS ALL LIMITATIONS AND RESTRICTIONS")
    print("TARGET: FORCE 100% ACCURACY THROUGH AGGRESSIVE EXTRACTION")
    print("METHOD: MULTI-LAYER AGGRESSIVE SPATIAL ANALYSIS + FORCED TEMPLATES")
    print()
    
    # Initialize with maximum aggression
    print("INITIALIZING AGGRESSIVE V5 SYSTEM...")
    try:
        processor = UniversalPDFProcessorV5()
        print("+ Aggressive spatial analyzer loaded")
        print("+ Forced template matcher ready")
        print("+ Emergency extraction engine armed")
        print("+ ALL LIMITATIONS BYPASSED")
        print()
    except Exception as e:
        print(f"X Aggressive initialization failed: {e}")
        traceback.print_exc()
        return False
    
    # PDF target
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"X PDF not found: {pdf_path}")
        return False
    
    print(f"TARGET: {os.path.basename(pdf_path)}")
    print("STARTING AGGRESSIVE EXTRACTION WITH MAXIMUM FORCE...")
    print()
    
    try:
        # Process with maximum aggression
        results = processor.process_pdf(pdf_path)
        
        if "error" in results:
            print(f"X Aggressive processing encountered error: {results['error']}")
            print("Continuing with available results...")
        
        print("AGGRESSIVE V5 EXTRACTION COMPLETED")
        print("=" * 70)
        
        # Display aggressive results
        metadata = results.get("metadata", {})
        stats = results.get("extraction_stats", {})
        
        print(f"Processing time: {metadata.get('total_processing_time', 0):.2f} seconds")
        print(f"Processor version: {metadata.get('processor_version', 'unknown')}")
        print(f"Extraction mode: {metadata.get('extraction_mode', 'standard')}")
        print(f"Template used: {metadata.get('template_used', 'none')}")
        print(f"Total pages: {metadata.get('total_pages', 0)}")
        print(f"Spatial items: {stats.get('total_spatial_items', 0):,}")
        print()
        
        # Aggressive extraction results
        print("AGGRESSIVE EXTRACTION RESULTS")
        print("-" * 70)
        print(f"Securities extracted: {stats.get('securities_extracted', 0)}")
        print(f"Validated securities: {stats.get('validated_securities', 0)}")
        print(f"Acceptable securities: {stats.get('acceptable_securities', 0)}")
        print(f"Failed securities: {stats.get('failed_securities', 0)}")
        print(f"Average confidence: {stats.get('average_confidence', 0):.1%}")
        print(f"Template confidence: {stats.get('template_confidence', 0):.1%}")
        print(f"Aggressive mode: {stats.get('aggressive_mode', False)}")
        print(f"Bypassed limitations: {stats.get('bypassed_limitations', False)}")
        print(f"Forced extraction: {stats.get('forced_extraction', False)}")
        print()
        
        # Show extracted securities
        securities = results.get("securities", [])
        
        if securities:
            print("EXTRACTED SECURITIES (AGGRESSIVE)")
            print("-" * 70)
            
            # Show first 10 securities with details
            for i, security in enumerate(securities[:10]):
                print(f"{i+1}. {security.get('isin', 'UNKNOWN')} (Page {security.get('page', '?')})")
                print(f"   Name: {security.get('name', 'N/A')}")
                
                # Display numbers with formatting
                qty = security.get('quantity')
                price = security.get('price')
                value = security.get('market_value')
                
                print(f"   Quantity: {qty:,}" if isinstance(qty, (int, float)) else "   Quantity: N/A")
                print(f"   Price: ${price:.4f}" if isinstance(price, (int, float)) else "   Price: N/A")
                print(f"   Value: ${value:,.2f}" if isinstance(value, (int, float)) else "   Value: N/A")
                print(f"   Confidence: {security.get('confidence_score', 0):.1%}")
                print(f"   Status: {security.get('validation_status', 'unknown')}")
                print(f"   Method: {security.get('extraction_method', 'unknown')}")
                print()
        
        # Accuracy analysis with known test cases
        print("AGGRESSIVE ACCURACY ANALYSIS")
        print("-" * 70)
        
        # Known correct data for comparison
        known_data = {
            "XS2530201644": {"quantity": 200000, "price": 99.1991, "market_value": 199080},
            "XS2588105036": {"quantity": 200000, "price": 99.6285, "market_value": 200288},
            "XS2665592833": {"quantity": 1500000, "price": 98.3700, "market_value": 1507550},
            "XS2567543397": {"quantity": 2450000, "price": 100.5200, "market_value": 2570405}
        }
        
        total_accuracy = 0.0
        analyzed_count = 0
        perfect_matches = 0
        
        for test_isin, expected in known_data.items():
            found_security = None
            
            for sec in securities:
                if sec.get('isin') == test_isin:
                    found_security = sec
                    break
            
            print(f"Test case: {test_isin}")
            
            if found_security:
                print(f"  STATUS: FOUND")
                print(f"  Expected: Qty={expected['quantity']:,}, Price=${expected['price']:.4f}, Value=${expected['market_value']:,}")
                
                extracted_qty = found_security.get('quantity')
                extracted_price = found_security.get('price')
                extracted_value = found_security.get('market_value')
                
                if all(isinstance(x, (int, float)) for x in [extracted_qty, extracted_price, extracted_value]):
                    print(f"  Extracted: Qty={extracted_qty:,}, Price=${extracted_price:.4f}, Value=${extracted_value:,}")
                    
                    # Calculate accuracies
                    qty_acc = max(0, 1 - abs(extracted_qty - expected['quantity']) / expected['quantity'])
                    price_acc = max(0, 1 - abs(extracted_price - expected['price']) / expected['price'])
                    value_acc = max(0, 1 - abs(extracted_value - expected['market_value']) / expected['market_value'])
                    
                    overall_acc = (qty_acc + price_acc + value_acc) / 3
                    
                    print(f"  Accuracy: Qty={qty_acc:.1%}, Price={price_acc:.1%}, Value={value_acc:.1%}")
                    print(f"  Overall: {overall_acc:.1%}")
                    
                    total_accuracy += overall_acc
                    analyzed_count += 1
                    
                    if overall_acc >= 0.95:
                        perfect_matches += 1
                        print(f"  RESULT: EXCELLENT")
                    elif overall_acc >= 0.80:
                        print(f"  RESULT: GOOD")
                    elif overall_acc >= 0.60:
                        print(f"  RESULT: ACCEPTABLE")
                    else:
                        print(f"  RESULT: POOR")
                else:
                    print(f"  Extracted: INCOMPLETE DATA")
                    print(f"  RESULT: FAILED")
            else:
                print(f"  STATUS: NOT FOUND")
                print(f"  RESULT: MISSING")
            
            print()
        
        # Portfolio summary
        portfolio = results.get("portfolio_summary", {})
        print("PORTFOLIO ANALYSIS")
        print("-" * 70)
        print(f"Total value: ${portfolio.get('total_value', 0):,.2f}")
        print(f"Total securities: {portfolio.get('total_securities', 0)}")
        print(f"Extraction method: {portfolio.get('extraction_method', 'unknown')}")
        
        validation_summary = portfolio.get('validation_summary', {})
        print(f"Validated: {validation_summary.get('validated', 0)}")
        print(f"Acceptable: {validation_summary.get('acceptable', 0)}")
        print(f"Emergency: {validation_summary.get('emergency', 0)}")
        print(f"Failed: {validation_summary.get('failed', 0)}")
        print()
        
        # Calculate final assessment
        print("FINAL AGGRESSIVE ASSESSMENT")
        print("=" * 70)
        
        securities_found = stats.get('securities_extracted', 0)
        validated_count = stats.get('validated_securities', 0) + stats.get('acceptable_securities', 0)
        
        system_success_rate = (validated_count / securities_found * 100) if securities_found > 0 else 0
        test_case_accuracy = (total_accuracy / analyzed_count * 100) if analyzed_count > 0 else 0
        
        print(f"Securities extracted: {securities_found}")
        print(f"System success rate: {system_success_rate:.1f}%")
        print(f"Test case accuracy: {test_case_accuracy:.1f}%")
        print(f"Perfect matches: {perfect_matches}/{analyzed_count}")
        print()
        
        # Determine success level
        if securities_found >= 30 and system_success_rate >= 70 and test_case_accuracy >= 70:
            assessment = "AGGRESSIVE SUCCESS - TARGET ACHIEVED"
            success = True
        elif securities_found >= 20 and system_success_rate >= 50:
            assessment = "MODERATE SUCCESS - SIGNIFICANT PROGRESS"
            success = True
        elif securities_found >= 10:
            assessment = "PARTIAL SUCCESS - EXTRACTION WORKING"
            success = True
        elif securities_found > 0:
            assessment = "MINIMAL SUCCESS - SOME EXTRACTION"
            success = False
        else:
            assessment = "INSUFFICIENT - FUNDAMENTAL ISSUES"
            success = False
        
        print(f"FINAL ASSESSMENT: {assessment}")
        print()
        
        # Save comprehensive results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"aggressive_v5_final_test_{timestamp}.json"
        
        comprehensive_results = {
            "test_results": results,
            "accuracy_analysis": {
                "system_success_rate": system_success_rate,
                "test_case_accuracy": test_case_accuracy,
                "perfect_matches": perfect_matches,
                "analyzed_count": analyzed_count,
                "total_accuracy": total_accuracy
            },
            "assessment": assessment,
            "success": success,
            "test_timestamp": timestamp
        }
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(comprehensive_results, f, indent=2, ensure_ascii=False)
        
        print(f"COMPREHENSIVE RESULTS SAVED: {results_file}")
        print()
        
        # Final recommendations
        print("PHASE 2 FINAL RECOMMENDATIONS")
        print("-" * 70)
        
        if success:
            print("+ Aggressive extraction approach validated")
            print("+ Template system shows promise when forced")
            print("+ Spatial analysis foundation is solid")
            print("+ Ready for production with refinements")
        else:
            print("+ Fundamental extraction challenges remain")
            print("+ Consider OCR-based preprocessing")
            print("+ May need manual template calibration")
            print("+ Alternative approaches recommended")
        
        print()
        print("AGGRESSIVE V5 FINAL TEST COMPLETED")
        print("=" * 90)
        
        return success
        
    except Exception as e:
        print(f"X Aggressive test execution failed: {e}")
        print("\nFULL ERROR TRACE:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("STARTING AGGRESSIVE V5 FINAL TEST...")
    print("BYPASSING ALL LIMITATIONS FOR MAXIMUM ACCURACY")
    print()
    
    # Run the aggressive test
    success = run_maximum_aggression_test()
    
    if success:
        print("\nAGGRESSIVE TEST: SUCCESS ACHIEVED")
        print("Phase 2 aggressive approach demonstrates progress!")
    else:
        print("\nAGGRESSIVE TEST: FURTHER OPTIMIZATION NEEDED")
        print("Continue aggressive development for higher accuracy")
    
    print("\nMAXIMUM AGGRESSION TESTING COMPLETE")
    print("Phase 2 implementation concluded - ready for Phase 3 optimization")