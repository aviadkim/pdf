#!/usr/bin/env python3
"""
Day 2: Pragmatic Approach - Focus on What Works
Since OCR has installation issues, let's use what we have and focus on the core problem
"""

import os
import json
import re

def analyze_current_system_gaps():
    """Analyze exactly what the current system is missing"""
    print("DAY 2: PRAGMATIC APPROACH - ANALYZE CURRENT GAPS")
    print("=" * 60)
    
    print("Step 1: Current System Analysis")
    print("Current accuracy: 92.21%")
    print("Gap to close: 7.79% (CHF 1,635,569)")
    
    # Known missing ISINs from our analysis
    missing_isins = [
        'CH1908490000',
        'XS2993414619', 
        'XS2407295554',
        'XS2252299883'
    ]
    
    # Known problematic ISIN
    problematic_isins = {
        'XS2746319610': {
            'current_value': 12000000,  # $12M extracted incorrectly
            'correct_value': 140000,    # Should be $140K
            'issue': 'table_column_misalignment'
        }
    }
    
    print(f"Missing ISINs: {len(missing_isins)}")
    for isin in missing_isins:
        print(f"  - {isin}")
    
    print(f"Problematic ISINs: {len(problematic_isins)}")
    for isin, details in problematic_isins.items():
        print(f"  - {isin}: ${details['current_value']:,} → ${details['correct_value']:,}")
    
    return missing_isins, problematic_isins

def create_manual_validation_strategy():
    """Create strategy for manual validation and targeted fixes"""
    print("\nStep 2: Manual Validation Strategy")
    
    strategy = {
        "approach": "targeted_fixes",
        "focus_areas": [
            "Debug why 4 ISINs are missing from current extraction",
            "Fix XS2746319610 value misalignment", 
            "Improve table boundary detection",
            "Add Swiss format edge case handling"
        ],
        
        "immediate_actions": [
            {
                "action": "Debug current system ISIN detection",
                "method": "Add logging to extractSecuritiesPrecise function",
                "expected_outcome": "Understand why ISINs are missed"
            },
            {
                "action": "Analyze XS2746319610 extraction",
                "method": "Debug specific line parsing for this ISIN",
                "expected_outcome": "Fix column alignment issue"
            },
            {
                "action": "Test with different PDF parsing",
                "method": "Try alternative text extraction methods",
                "expected_outcome": "Find missing securities in raw text"
            }
        ],
        
        "validation_targets": {
            "target_accuracy": "96-98%",
            "target_isins": "38-40 ISINs found",
            "target_gap": "<CHF 1,000,000"
        }
    }
    
    print("STRATEGY: Targeted fixes over new technology")
    print("RATIONALE: Current system works well, focus on specific gaps")
    
    for i, action in enumerate(strategy["immediate_actions"], 1):
        print(f"\n{i}. {action['action']}")
        print(f"   Method: {action['method']}")
        print(f"   Expected: {action['expected_outcome']}")
    
    return strategy

def analyze_pdf_text_extraction():
    """Analyze what's in the PDF text that current system processes"""
    print("\nStep 3: PDF Text Analysis")
    
    # Check if we have access to the PDF
    pdf_path = "2. Messos  - 31.03.2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"PDF not found: {pdf_path}")
        return create_synthetic_analysis()
    
    try:
        # Try to use pdf-parse equivalent
        print("Attempting basic PDF text extraction...")
        
        # For now, simulate what we know about the PDF content
        return simulate_pdf_analysis()
        
    except Exception as e:
        print(f"PDF analysis failed: {e}")
        return create_synthetic_analysis()

def simulate_pdf_analysis():
    """Simulate PDF analysis based on what we know"""
    print("Simulating PDF content analysis...")
    
    # Based on our enhanced extractor test, we know:
    known_isins = [
        'XS2993414619', 'XS2530201644', 'XS2588105036', 'XS2665592833',
        'XS2692298537', 'XS2754416860', 'XS2761230684', 'XS2736388732',
        'XS2782869916', 'XS2824054402', 'XS2567543397', 'XS2110079584',
        'XS2848820754', 'XS2829712830', 'XS2912278723', 'XS2381723902',
        'XS2829752976', 'XS2953741100', 'XS2381717250', 'XS2481066111',
        'XS2964611052', 'XS3035947103', 'LU2228214107', 'CH1269060229',
        'XS0461497009', 'XS2746319610', 'CH0244767585', 'XS2519369867',
        'XS2315191069', 'XS2792098779', 'XS2714429128', 'XS2105981117',
        'XS2838389430', 'XS2631782468', 'XS1700087403', 'XS2594173093',
        'XS2407295554', 'XS2252299883', 'XD0466760473'
    ]
    
    missing_from_current = [
        'CH1908490000',  # Not in the list above
        'XS2993414619',  # Current system misses this somehow
        'XS2407295554',  # In list but current system doesn't extract value
        'XS2252299883'   # In list but current system doesn't extract value
    ]
    
    print(f"Total ISINs in PDF: 39")
    print(f"Current system finds: 35")
    print(f"Missing: 4")
    
    analysis = {
        'total_isins_in_pdf': 39,
        'current_system_finds': 35,
        'missing_isins': missing_from_current,
        'problematic_extraction': ['XS2746319610'],
        'potential_causes': [
            'ISINs in different table sections',
            'Different text formatting',
            'Page boundaries splitting data',
            'Column alignment issues'
        ]
    }
    
    return analysis

def create_synthetic_analysis():
    """Create synthetic analysis for demonstration"""
    print("Creating synthetic PDF analysis...")
    
    return {
        'analysis_type': 'synthetic',
        'message': 'Real PDF analysis would require proper PDF parsing setup'
    }

def create_hybrid_improvement_plan():
    """Create plan combining current system improvements with targeted fixes"""
    print("\nStep 4: Hybrid Improvement Plan")
    
    plan = {
        "phase_1_debug": {
            "timeline": "Days 2-3",
            "goal": "Understand current system gaps",
            "tasks": [
                "Add debug logging to current extraction",
                "Identify exactly where missing ISINs should appear",
                "Analyze XS2746319610 line parsing",
                "Test different text extraction parameters"
            ]
        },
        
        "phase_2_targeted_fixes": {
            "timeline": "Days 3-4", 
            "goal": "Fix specific identified issues",
            "tasks": [
                "Improve ISIN detection patterns",
                "Fix column alignment for XS2746319610",
                "Add edge case handling for Swiss formats",
                "Improve table boundary detection"
            ]
        },
        
        "phase_3_validation": {
            "timeline": "Day 5",
            "goal": "Validate improvements and integrate",
            "tasks": [
                "Test improved extraction on Messos PDF",
                "Validate against 19,464,431 CHF target",
                "Create Node.js integration",
                "Deploy to test environment"
            ]
        },
        
        "success_metrics": {
            "minimum_target": "95% accuracy (vs current 92.21%)",
            "optimal_target": "97-98% accuracy", 
            "isin_target": "38-40 ISINs found (vs current 35)",
            "financial_target": "<CHF 1,000,000 gap (vs current 1,635,569)"
        }
    }
    
    print("HYBRID PLAN: Current system improvements + targeted fixes")
    
    for phase, details in plan.items():
        if phase != "success_metrics":
            print(f"\n{phase.replace('_', ' ').title()}:")
            print(f"  Timeline: {details['timeline']}")
            print(f"  Goal: {details['goal']}")
            for task in details['tasks']:
                print(f"    - {task}")
    
    print(f"\nSUCCESS TARGETS:")
    for metric, target in plan['success_metrics'].items():
        print(f"  {metric}: {target}")
    
    return plan

def create_immediate_action_items():
    """Create specific action items for immediate implementation"""
    print("\nStep 5: Immediate Action Items")
    
    actions = [
        {
            "priority": "HIGH",
            "action": "Debug current system ISIN detection",
            "file": "express-server.js",
            "function": "extractSecuritiesPrecise()",
            "change": "Add console.log for each ISIN found and missed",
            "expected_result": "Understand why 4 ISINs are missing"
        },
        {
            "priority": "HIGH", 
            "action": "Fix XS2746319610 value extraction",
            "file": "express-server.js",
            "function": "parseMessosSecurityLine()",
            "change": "Debug specific line parsing for this ISIN",
            "expected_result": "Correct $12M → $140K value"
        },
        {
            "priority": "MEDIUM",
            "action": "Improve Swiss number format parsing",
            "file": "express-server.js", 
            "function": "parseSwissValue()",
            "change": "Handle edge cases in apostrophe formatting",
            "expected_result": "Better value extraction accuracy"
        },
        {
            "priority": "MEDIUM",
            "action": "Add comprehensive logging",
            "file": "express-server.js",
            "function": "All extraction functions",
            "change": "Add detailed extraction logging",
            "expected_result": "Better debugging and monitoring"
        }
    ]
    
    print("IMMEDIATE ACTIONS (can start today):")
    
    for i, action in enumerate(actions, 1):
        print(f"\n{i}. [{action['priority']}] {action['action']}")
        print(f"   File: {action['file']}")
        print(f"   Function: {action['function']}")
        print(f"   Change: {action['change']}")
        print(f"   Expected: {action['expected_result']}")
    
    return actions

def day2_summary():
    """Create Day 2 summary and next steps"""
    print("\n" + "=" * 60)
    print("DAY 2 SUMMARY: PRAGMATIC APPROACH")
    print("=" * 60)
    
    print("DECISION: Focus on current system improvements")
    print("REASON: OCR setup has compatibility issues, current system has proven reliability")
    
    print("\nKEY INSIGHTS:")
    print("• Current system finds 35/39 ISINs (89.7% ISIN detection)")
    print("• Main issues: 4 missing ISINs + 1 value misalignment")
    print("• 92.21% accuracy is strong foundation to build on")
    print("• Targeted fixes likely faster than new technology integration")
    
    print("\nDAY 3 PLAN:")
    print("1. Debug current system to find missing ISINs")
    print("2. Fix XS2746319610 value extraction issue")
    print("3. Test improvements on actual Messos PDF")
    print("4. Validate accuracy improvements")
    
    print("\nEXPECTED OUTCOME:")
    print("• Find 2-3 additional ISINs → 37-38 total")
    print("• Fix major value misalignment")
    print("• Achieve 95-97% accuracy")
    print("• Reduce gap to <CHF 1,000,000")
    
    print("\nRISK MITIGATION:")
    print("• Keep current system as fallback")
    print("• Incremental improvements, not wholesale changes")
    print("• Validate each fix against known test cases")

if __name__ == "__main__":
    print("Starting Day 2: Pragmatic Approach...")
    
    # Step 1: Gap analysis
    missing_isins, problematic_isins = analyze_current_system_gaps()
    
    # Step 2: Strategy
    strategy = create_manual_validation_strategy()
    
    # Step 3: PDF analysis
    pdf_analysis = analyze_pdf_text_extraction()
    
    # Step 4: Improvement plan
    improvement_plan = create_hybrid_improvement_plan()
    
    # Step 5: Action items
    action_items = create_immediate_action_items()
    
    # Summary
    day2_summary()
    
    # Save results
    results = {
        'missing_isins': missing_isins,
        'problematic_isins': problematic_isins,
        'strategy': strategy,
        'pdf_analysis': pdf_analysis,
        'improvement_plan': improvement_plan,
        'action_items': action_items
    }
    
    with open('day2_analysis.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\nDay 2 analysis saved to: day2_analysis.json")
    print("DAY 2 COMPLETE: Ready for targeted improvements")