#!/usr/bin/env python3
"""
Test Unstructured-IO extraction on Messos PDF
Compare with current system's results to evaluate accuracy improvement potential
"""

import sys
import json
from typing import List, Dict, Any
from unstructured.partition.auto import partition
from unstructured.partition.pdf import partition_pdf
import re

def extract_with_unstructured(pdf_path: str, strategy: str = "hi_res") -> Dict[str, Any]:
    """Extract elements using Unstructured-IO with different strategies"""
    print(f"\n🔍 Testing Unstructured-IO extraction with '{strategy}' strategy...")
    
    try:
        # Partition the PDF with specified strategy
        elements = partition(pdf_path, strategy=strategy)
        
        # Categorize elements
        tables = [e for e in elements if e.category == "Table"]
        text_elements = [e for e in elements if e.category == "Text"]
        
        print(f"📊 Found {len(elements)} total elements:")
        print(f"   - {len(tables)} table elements")
        print(f"   - {len(text_elements)} text elements")
        
        # Extract potential securities data
        securities_data = []
        total_value = 0
        
        # Look for ISIN patterns in all elements
        isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b'
        value_pattern = r'[\d\'\,\.]+\s*(?:CHF|USD|EUR)'
        
        for element in elements:
            text = str(element.text)
            
            # Find ISINs
            isins = re.findall(isin_pattern, text)
            
            if isins:
                # Try to extract values from same element or nearby
                values = re.findall(value_pattern, text)
                
                for isin in isins:
                    security_data = {
                        'isin': isin,
                        'category': element.category,
                        'text_snippet': text[:200],
                        'potential_values': values
                    }
                    securities_data.append(security_data)
        
        return {
            'strategy': strategy,
            'total_elements': len(elements),
            'tables': len(tables),
            'text_elements': len(text_elements),
            'securities_found': len(securities_data),
            'securities_data': securities_data,
            'sample_tables': [str(t)[:300] for t in tables[:3]],  # First 3 tables
            'sample_text': [str(t)[:200] for t in text_elements[:5]]  # First 5 text elements
        }
        
    except Exception as e:
        return {'error': str(e), 'strategy': strategy}

def test_all_strategies(pdf_path: str) -> Dict[str, Any]:
    """Test all available strategies"""
    strategies = ['auto', 'fast', 'hi_res']
    results = {}
    
    for strategy in strategies:
        print(f"\n{'='*60}")
        print(f"Testing strategy: {strategy.upper()}")
        print(f"{'='*60}")
        
        results[strategy] = extract_with_unstructured(pdf_path, strategy)
        
        # Print summary
        if 'error' not in results[strategy]:
            print(f"✅ Success: {results[strategy]['securities_found']} securities found")
        else:
            print(f"❌ Error: {results[strategy]['error']}")
    
    return results

def analyze_table_structure(pdf_path: str) -> Dict[str, Any]:
    """Detailed analysis of table structure for financial data"""
    print(f"\n🔬 DETAILED TABLE ANALYSIS")
    print(f"{'='*60}")
    
    try:
        # Use hi_res strategy for best table detection
        elements = partition(pdf_path, strategy="hi_res")
        tables = [e for e in elements if e.category == "Table"]
        
        table_analysis = []
        
        for i, table in enumerate(tables):
            table_text = str(table.text)
            
            # Count ISINs in this table
            isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b'
            isins = re.findall(isin_pattern, table_text)
            
            # Count potential values
            swiss_value_pattern = r"\d{1,3}(?:'\d{3})*\.\d{2}"
            values = re.findall(swiss_value_pattern, table_text)
            
            # Analyze table structure
            lines = table_text.split('\n')
            
            analysis = {
                'table_index': i,
                'lines_count': len(lines),
                'isins_found': len(isins),
                'values_found': len(values),
                'sample_isins': isins[:5],
                'sample_values': values[:5],
                'first_few_lines': lines[:10],
                'contains_securities': len(isins) > 0
            }
            
            table_analysis.append(analysis)
            
            if len(isins) > 0:
                print(f"\n📋 Table {i+1}: {len(isins)} ISINs, {len(values)} values")
                for isin in isins[:3]:
                    print(f"   - {isin}")
        
        return {
            'total_tables': len(tables),
            'tables_with_securities': sum(1 for t in table_analysis if t['contains_securities']),
            'table_analysis': table_analysis
        }
        
    except Exception as e:
        return {'error': str(e)}

def extract_portfolio_total(pdf_path: str) -> Dict[str, Any]:
    """Extract portfolio total for validation"""
    print(f"\n💰 PORTFOLIO TOTAL EXTRACTION")
    print(f"{'='*60}")
    
    try:
        elements = partition(pdf_path, strategy="hi_res")
        
        # Look for portfolio total patterns
        portfolio_patterns = [
            r'Portefeuille\s+total[:\s]+(\d{1,3}(?:\'\d{3})*\.\d{2})',
            r'Total\s+portfolio[:\s]+(\d{1,3}(?:\'\d{3})*\.\d{2})',
            r'Gesamt[:\s]+(\d{1,3}(?:\'\d{3})*\.\d{2})'
        ]
        
        totals_found = []
        
        for element in elements:
            text = str(element.text)
            
            for pattern in portfolio_patterns:
                matches = re.findall(pattern, text, re.IGNORECASE)
                if matches:
                    totals_found.extend(matches)
        
        return {
            'totals_found': totals_found,
            'expected_total': "19'464'431.45",  # Known Messos total
            'matches_expected': "19'464'431.45" in totals_found
        }
        
    except Exception as e:
        return {'error': str(e)}

if __name__ == "__main__":
    # Test with Messos PDF
    pdf_path = "2. Messos  - 31.03.2025.pdf"
    
    print("🚀 UNSTRUCTURED-IO EXTRACTION TEST")
    print("="*80)
    print(f"Testing PDF: {pdf_path}")
    
    # Test 1: All strategies comparison
    strategy_results = test_all_strategies(pdf_path)
    
    # Test 2: Detailed table analysis
    table_results = analyze_table_structure(pdf_path)
    
    # Test 3: Portfolio total extraction
    total_results = extract_portfolio_total(pdf_path)
    
    # Summary
    print(f"\n{'='*80}")
    print("📊 EXTRACTION SUMMARY")
    print(f"{'='*80}")
    
    for strategy, result in strategy_results.items():
        if 'error' not in result:
            print(f"{strategy.upper():8}: {result['securities_found']:2d} securities found")
        else:
            print(f"{strategy.upper():8}: ERROR - {result['error']}")
    
    if 'error' not in table_results:
        print(f"TABLES  : {table_results['tables_with_securities']} tables contain securities")
    
    if 'error' not in total_results:
        total_match = "✅" if total_results['matches_expected'] else "❌"
        print(f"TOTAL   : {total_match} Portfolio total validation")
    
    # Save detailed results
    results = {
        'strategies': strategy_results,
        'tables': table_results,
        'totals': total_results
    }
    
    with open('unstructured_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n💾 Detailed results saved to: unstructured_test_results.json")
    print(f"\n🎯 NEXT: Compare with current system's 92.21% accuracy")