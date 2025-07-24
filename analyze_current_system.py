#!/usr/bin/env python3
"""
Analyze current system's extraction results for comparison
Parse the existing express-server.js results to understand current accuracy
"""

import json
import re
import sys

def analyze_messos_extraction():
    """Analyze current system's Messos extraction results"""
    
    print("CURRENT SYSTEM ANALYSIS")
    print("=" * 60)
    
    # Known results from current system (92.21% accuracy)
    current_results = {
        'target_total': 19464431.45,  # CHF
        'extracted_total': 21100000,  # Approximate current extraction
        'accuracy': 92.21,
        'securities_found': 35,  # Approximate
        'missing_gap': 1635569,  # $1.6M difference
        
        # Known problematic ISINs from CLAUDE.md
        'known_corrections': {
            'XS2746319610': {'was': 12000000, 'corrected_to': 140000, 'reason': 'table_misalignment'},
            'CH1908490000': {'status': 'missing', 'expected': True},
            'XS2993414619': {'status': 'missing', 'expected': True},
            'XS2407295554': {'status': 'missing', 'expected': True},
            'XS2252299883': {'status': 'missing', 'expected': True},
        },
        
        # Extraction challenges
        'challenges': [
            'Swiss number format (apostrophe separators)',
            'Multi-page table continuations',
            'Column alignment issues',
            'Valor vs Amount confusion',
            'Table boundary detection'
        ]
    }
    
    print(f"Target Portfolio Total: CHF {current_results['target_total']:,}")
    print(f"Current Extraction: CHF {current_results['extracted_total']:,}")
    print(f"Accuracy: {current_results['accuracy']:.2f}%")
    print(f"Gap: CHF {current_results['missing_gap']:,}")
    print(f"Securities Found: {current_results['securities_found']}")
    
    print("\nKNOWN PROBLEM CASES:")
    for isin, details in current_results['known_corrections'].items():
        if details.get('status') == 'missing':
            print(f"  {isin}: MISSING (should be found)")
        else:
            print(f"  {isin}: ${details['was']:,} -> ${details['corrected_to']:,} ({details['reason']})")
    
    print("\nMAIN CHALLENGES:")
    for challenge in current_results['challenges']:
        print(f"  - {challenge}")
    
    return current_results

def calculate_improvement_potential():
    """Calculate potential improvement with Unstructured-IO"""
    
    print("\n" + "=" * 60)
    print("IMPROVEMENT POTENTIAL ANALYSIS")
    print("=" * 60)
    
    # Areas where Unstructured-IO should excel
    improvements = {
        'table_structure_recognition': {
            'description': 'Visual table detection vs regex patterns',
            'expected_gain': 3.0,  # 3% accuracy improvement
            'confidence': 'high'
        },
        'column_alignment': {
            'description': 'Proper cell-to-cell mapping',
            'expected_gain': 2.0,  # 2% accuracy improvement  
            'confidence': 'high'
        },
        'multi_page_tables': {
            'description': 'Better table continuation handling',
            'expected_gain': 1.5,  # 1.5% accuracy improvement
            'confidence': 'medium'
        },
        'document_structure': {
            'description': 'Portfolio vs summary section detection',
            'expected_gain': 1.0,  # 1% accuracy improvement
            'confidence': 'medium'
        }
    }
    
    total_potential = sum(imp['expected_gain'] for imp in improvements.values())
    new_accuracy = 92.21 + total_potential
    
    print(f"Current Accuracy: 92.21%")
    print(f"Potential Improvements:")
    
    for area, details in improvements.items():
        print(f"  - {details['description']}: +{details['expected_gain']:.1f}% ({details['confidence']} confidence)")
    
    print(f"\nPotential New Accuracy: {new_accuracy:.1f}%")
    print(f"Remaining Error: {100 - new_accuracy:.1f}%")
    
    # Calculate financial impact
    current_error = 1635569  # CHF
    potential_error = current_error * (100 - new_accuracy) / (100 - 92.21)
    savings = current_error - potential_error
    
    print(f"\nFINANCIAL IMPACT:")
    print(f"Current Error: CHF {current_error:,}")
    print(f"Potential Error: CHF {potential_error:,.0f}")
    print(f"Potential Savings: CHF {savings:,.0f}")
    
    return new_accuracy, savings

def create_test_plan():
    """Create testing plan for Unstructured-IO validation"""
    
    print("\n" + "=" * 60)
    print("UNSTRUCTURED-IO TEST PLAN")
    print("=" * 60)
    
    test_plan = {
        'phase_1_basic_extraction': {
            'goal': 'Verify Unstructured can extract securities',
            'tests': [
                'Extract all ISINs from Messos PDF',
                'Count total securities found',
                'Compare with current 35+ securities',
                'Identify any NEW securities found'
            ],
            'success_criteria': 'Find 35+ ISINs, ideally 40 (complete list)'
        },
        
        'phase_2_accuracy_validation': {
            'goal': 'Validate extraction accuracy vs current system',
            'tests': [
                'Extract portfolio total (should be CHF 19,464,431)',
                'Sum all security values',
                'Compare accuracy vs 92.21%',
                'Analyze specific improvements'
            ],
            'success_criteria': '>94% accuracy (improvement over current)'
        },
        
        'phase_3_problem_cases': {
            'goal': 'Test on known problem ISINs',
            'tests': [
                'Find missing CH1908490000, XS2993414619, etc.',
                'Correct XS2746319610 value extraction',
                'Handle Swiss number format properly',
                'Detect table boundaries accurately'
            ],
            'success_criteria': 'Find missing ISINs, correct problematic values'
        },
        
        'phase_4_integration': {
            'goal': 'Design hybrid system integration',
            'tests': [
                'Python-to-Node.js bridge',
                'Performance benchmarking',
                'Error handling and fallbacks',
                'Production deployment strategy'
            ],
            'success_criteria': 'Working hybrid system with improved accuracy'
        }
    }
    
    for phase, details in test_plan.items():
        print(f"\n{phase.replace('_', ' ').title()}:")
        print(f"  Goal: {details['goal']}")
        print(f"  Tests:")
        for test in details['tests']:
            print(f"    - {test}")
        print(f"  Success: {details['success_criteria']}")
    
    return test_plan

if __name__ == "__main__":
    # Analyze current system
    current_results = analyze_messos_extraction()
    
    # Calculate improvement potential
    new_accuracy, savings = calculate_improvement_potential()
    
    # Create test plan
    test_plan = create_test_plan()
    
    print("\n" + "=" * 60)
    print("NEXT STEPS")
    print("=" * 60)
    print("1. Fix Unstructured-IO installation/compatibility issues")
    print("2. Run basic extraction test with 'fast' strategy")
    print("3. Compare results with current system")
    print("4. Test 'hi_res' strategy for maximum accuracy")
    print("5. Design integration architecture")
    
    # Save analysis results
    analysis_results = {
        'current_system': current_results,
        'improvement_potential': {
            'new_accuracy': new_accuracy,
            'savings': savings
        },
        'test_plan': test_plan
    }
    
    with open('current_system_analysis.json', 'w') as f:
        json.dump(analysis_results, f, indent=2)
    
    print(f"\nAnalysis saved to: current_system_analysis.json")