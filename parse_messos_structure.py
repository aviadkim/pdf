#!/usr/bin/env python3
"""
Parse the actual structure of Messos PDF holdings
"""

import re
import json
from typing import Dict, List, Any, Optional

def parse_security_entry(entry_text: str) -> Dict[str, Any]:
    """Parse a single security entry from the PDF text"""
    
    lines = entry_text.strip().split('\n')
    security = {
        'raw_text': entry_text,
        'currency': None,
        'nominal_quantity': None,
        'description': None,
        'isin': None,
        'valorn': None,
        'acquisition_price': None,
        'current_price': None,
        'perf_ytd': None,
        'perf_total': None,
        'valuation': None,
        'weight_percent': None,
        'accruals': None,
        'fx_rate_avg': None,
        'fx_rate_current': None,
        'maturity_date': None,
        'coupon': None,
        'prc': None,
        'security_type': None,
        'days': None,
        'ytm': None
    }
    
    # Parse the first line which contains the main security info
    if lines:
        first_line = lines[0]
        
        # Extract currency and nominal amount
        currency_match = re.search(r'^([A-Z]{3})\s+([\d,\']+(?:\.\d{2})?)', first_line)
        if currency_match:
            security['currency'] = currency_match.group(1)
            security['nominal_quantity'] = currency_match.group(2)
        
        # Extract description (everything after nominal until prices)
        desc_match = re.search(r'^[A-Z]{3}\s+[\d,\']+(?:\.\d{2})?\s+(.+?)\s+[\d,\']+\.\d{4}', first_line)
        if desc_match:
            security['description'] = desc_match.group(1).strip()
        
        # Extract prices and performance
        price_pattern = r'([\d,\']+\.\d{4})\s+([\d,\']+\.\d{4})\s+([-+]?\d+\.\d{2}%)\s+([-+]?\d+\.\d{2}%)\s+([\d,\']+)\s+([\d,\']+\.\d{2}%)'
        price_match = re.search(price_pattern, first_line)
        if price_match:
            security['acquisition_price'] = price_match.group(1)
            security['current_price'] = price_match.group(2)
            security['perf_ytd'] = price_match.group(3)
            security['perf_total'] = price_match.group(4)
            security['valuation'] = price_match.group(5)
            security['weight_percent'] = price_match.group(6)
    
    # Parse additional lines for ISIN, Valorn, etc.
    for line in lines[1:]:
        line = line.strip()
        
        # Extract ISIN
        isin_match = re.search(r'ISIN:\s*([A-Z]{2}[A-Z0-9]{10})', line)
        if isin_match:
            security['isin'] = isin_match.group(1)
        
        # Extract Valorn
        valorn_match = re.search(r'Valorn\.:\s*(\d+)', line)
        if valorn_match:
            security['valorn'] = valorn_match.group(1)
        
        # Extract maturity date
        maturity_match = re.search(r'Maturity:\s*(\d{2}\.\d{2}\.\d{4})', line)
        if maturity_match:
            security['maturity_date'] = maturity_match.group(1)
        
        # Extract coupon
        coupon_match = re.search(r'Coupon:\s*[\d.]+\s*//\s*[A-Za-z]+\s*([\d.]+%)', line)
        if coupon_match:
            security['coupon'] = coupon_match.group(1)
        
        # Extract PRC
        prc_match = re.search(r'PRC:\s*([\d.]+)', line)
        if prc_match:
            security['prc'] = prc_match.group(1)
        
        # Extract security type
        if any(sec_type in line for sec_type in ['Ordinary Bonds', 'Zero Bonds', 'Structured Bonds', 'Ordinary Stocks', 'Bond Funds', 'Hedge Funds']):
            security['security_type'] = line.split('//')[0].strip()
        
        # Extract days
        days_match = re.search(r'Days:\s*(\d+)', line)
        if days_match:
            security['days'] = days_match.group(1)
        
        # Extract YTM
        ytm_match = re.search(r'YTM:\s*([-+]?\d+\.\d{2})', line)
        if ytm_match:
            security['ytm'] = ytm_match.group(1)
        
        # Extract accruals (if present at end of line)
        accrual_match = re.search(r'(\d+[,\']?\d*)\s*$', line)
        if accrual_match and 'accruals' not in line.lower():
            # This might be an accrual amount at the end
            if not security['accruals']:
                security['accruals'] = accrual_match.group(1)
    
    return security

def parse_holdings_section(section_text: str, section_type: str) -> List[Dict[str, Any]]:
    """Parse a holdings section (bonds, equities, etc.)"""
    
    holdings = []
    
    # Split by common patterns that indicate new securities
    # Look for patterns like "USD 200'000 BANK NAME" or "CHF 800 COMPANY"
    security_pattern = r'(?=^[A-Z]{3}\s+[\d,\']+(?:\.\d{2})?\s+[A-Z])'
    
    # Split the text by security entries
    entries = re.split(security_pattern, section_text, flags=re.MULTILINE)
    
    for entry in entries:
        entry = entry.strip()
        if not entry or len(entry) < 50:  # Skip very short entries
            continue
        
        # Skip summary lines
        if entry.startswith('Total ') or entry.startswith('Accr') or entry.startswith('thereof'):
            continue
        
        security = parse_security_entry(entry)
        if security['currency'] and security['nominal_quantity']:
            security['section_type'] = section_type
            holdings.append(security)
    
    return holdings

def analyze_messos_structure():
    """Analyze the true structure of Messos PDF data"""
    
    print("=== MESSOS PDF STRUCTURE ANALYSIS ===\n")
    
    # Load the detailed analysis
    with open('/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/messos_analysis_detailed.json', 'r') as f:
        analysis = json.load(f)
    
    all_holdings = []
    
    # Process each securities page
    for page in analysis['pages']:
        if page['page_number'] >= 7 and page['page_number'] <= 15:
            print(f"Processing page {page['page_number']}...")
            
            if page['tables']:
                for table in page['tables']:
                    if table['full_table'] and len(table['full_table']) > 1:
                        section_text = table['full_table'][1][0]  # Get the data row
                        
                        # Determine section type
                        section_type = 'unknown'
                        if 'Bonds' in section_text:
                            section_type = 'bonds'
                        elif 'Equities' in section_text:
                            section_type = 'equities'
                        elif 'Structured products' in section_text:
                            section_type = 'structured_products'
                        elif 'Hedge Funds' in section_text:
                            section_type = 'hedge_funds'
                        elif 'Money market' in section_text:
                            section_type = 'money_market'
                        elif 'Cash accounts' in section_text:
                            section_type = 'cash'
                        
                        # Parse holdings from this section
                        holdings = parse_holdings_section(section_text, section_type)
                        all_holdings.extend(holdings)
    
    print(f"\\nTotal holdings extracted: {len(all_holdings)}")
    
    # Analyze the structure
    print("\\n=== HOLDINGS BREAKDOWN ===")
    
    section_counts = {}
    for holding in all_holdings:
        section = holding['section_type']
        if section not in section_counts:
            section_counts[section] = 0
        section_counts[section] += 1
    
    for section, count in section_counts.items():
        print(f"{section}: {count} holdings")
    
    print("\\n=== SAMPLE HOLDINGS ===")
    
    # Show samples from each section
    for section_type in ['bonds', 'equities', 'structured_products', 'hedge_funds', 'money_market', 'cash']:
        section_holdings = [h for h in all_holdings if h['section_type'] == section_type]
        if section_holdings:
            print(f"\\n{section_type.upper()} SAMPLE:")
            sample = section_holdings[0]
            print(f"  Currency: {sample['currency']}")
            print(f"  Nominal: {sample['nominal_quantity']}")
            print(f"  Description: {sample['description']}")
            print(f"  ISIN: {sample['isin']}")
            print(f"  Valorn: {sample['valorn']}")
            print(f"  Acquisition Price: {sample['acquisition_price']}")
            print(f"  Current Price: {sample['current_price']}")
            print(f"  YTD Performance: {sample['perf_ytd']}")
            print(f"  Total Performance: {sample['perf_total']}")
            print(f"  Valuation: {sample['valuation']}")
            print(f"  Weight: {sample['weight_percent']}")
            print(f"  Security Type: {sample['security_type']}")
            print(f"  Maturity: {sample['maturity_date']}")
            print(f"  Coupon: {sample['coupon']}")
            print(f"  PRC: {sample['prc']}")
    
    # Save parsed data
    output_data = {
        'holdings': all_holdings,
        'summary': {
            'total_holdings': len(all_holdings),
            'section_breakdown': section_counts
        }
    }
    
    with open('/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/messos_parsed_holdings.json', 'w') as f:
        json.dump(output_data, f, indent=2)
    
    print(f"\\nParsed holdings saved to: /mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/messos_parsed_holdings.json")
    
    # Generate extraction recommendations
    print("\\n=== EXTRACTION RECOMMENDATIONS ===")
    
    recommendations = [
        "1. DATA STRUCTURE INSIGHTS:",
        "   - PDF contains complex multi-line entries for each security",
        "   - Each security spans multiple lines with different data types",
        "   - Holdings are grouped by asset type (Bonds, Equities, Structured Products, etc.)",
        "",
        "2. KEY DATA FIELDS IDENTIFIED:",
        "   - Currency: Always 3-letter code (USD, CHF, EUR, etc.)",
        "   - Nominal/Quantity: Formatted with apostrophes (e.g., 1'000'000)",
        "   - Security Description: Multi-word instrument name",
        "   - ISIN: 12-character international identifier",
        "   - Valorn: Swiss security identifier",
        "   - Acquisition Price: Average purchase price",
        "   - Current Price: Market price as of valuation date",
        "   - Performance YTD: Year-to-date performance percentage",
        "   - Total Performance: Cumulative performance since acquisition",
        "   - Valuation: Current market value in portfolio currency",
        "   - Weight: Percentage of total portfolio",
        "   - Accruals: Interest or dividend accruals",
        "",
        "3. SECTION TYPES FOUND:",
        f"   - Bonds: {section_counts.get('bonds', 0)} holdings",
        f"   - Equities: {section_counts.get('equities', 0)} holdings", 
        f"   - Structured Products: {section_counts.get('structured_products', 0)} holdings",
        f"   - Hedge Funds: {section_counts.get('hedge_funds', 0)} holdings",
        f"   - Money Market: {section_counts.get('money_market', 0)} holdings",
        f"   - Cash: {section_counts.get('cash', 0)} holdings",
        "",
        "4. EXTRACTION STRATEGY:",
        "   - Use regex patterns to identify security boundaries",
        "   - Parse multi-line entries as single holdings",
        "   - Extract structured data from each field position",
        "   - Handle different formats for bonds vs equities vs structured products",
        "   - Properly identify and extract ISIN codes",
        "   - Parse numerical values (remove apostrophes, handle decimals)",
        "   - Extract metadata like maturity dates, coupons, PRC ratings",
        "",
        "5. CURRENT SYSTEM ISSUES:",
        "   - Not recognizing multi-line structure of entries",
        "   - Mixing up quantity vs valuation fields",
        "   - Not extracting all relevant metadata",
        "   - Not properly categorizing different asset types",
        "   - Missing important fields like maturity, coupon, PRC",
        "",
        "6. RECOMMENDATIONS FOR IMPROVEMENT:",
        "   - Implement multi-line parsing for each security",
        "   - Use section headers to categorize holdings",
        "   - Extract all financial metrics (prices, performance, valuations)",
        "   - Include metadata fields for proper classification",
        "   - Implement proper number parsing (handle Swiss formatting)",
        "   - Add validation for required fields (ISIN, valuation, etc.)"
    ]
    
    for rec in recommendations:
        print(rec)

if __name__ == "__main__":
    analyze_messos_structure()