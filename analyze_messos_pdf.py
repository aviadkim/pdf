#!/usr/bin/env python3
"""
Comprehensive analysis of Messos PDF structure
"""

import sys
import re
import json
from typing import Dict, List, Any, Tuple
import pdfplumber
import PyPDF2

def analyze_pdf_structure(pdf_path: str) -> Dict[str, Any]:
    """Analyze PDF structure comprehensively"""
    
    analysis = {
        'metadata': {},
        'pages': [],
        'text_content': '',
        'tables': [],
        'sections': [],
        'data_patterns': {},
        'holdings_analysis': {}
    }
    
    # First, get basic metadata with PyPDF2
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            analysis['metadata'] = {
                'num_pages': len(pdf_reader.pages),
                'info': dict(pdf_reader.metadata) if pdf_reader.metadata else {},
                'encrypted': pdf_reader.is_encrypted
            }
    except Exception as e:
        print(f"PyPDF2 metadata error: {e}")
    
    # Deep analysis with pdfplumber
    try:
        with pdfplumber.open(pdf_path) as pdf:
            full_text = ""
            
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Analyzing page {page_num}...")
                
                # Extract text
                text = page.extract_text() or ""
                full_text += text + "\n"
                
                # Extract tables
                tables = page.extract_tables()
                
                # Analyze page structure
                page_analysis = {
                    'page_number': page_num,
                    'text_length': len(text),
                    'num_tables': len(tables),
                    'text_preview': text[:500] if text else "",
                    'tables': [],
                    'bbox': page.bbox,
                    'chars': len(page.chars),
                    'lines': len(page.lines) if hasattr(page, 'lines') else 0
                }
                
                # Process tables
                for table_idx, table in enumerate(tables):
                    if table:
                        table_analysis = {
                            'table_index': table_idx,
                            'rows': len(table),
                            'cols': len(table[0]) if table else 0,
                            'preview': table[:3] if len(table) > 3 else table,
                            'full_table': table
                        }
                        page_analysis['tables'].append(table_analysis)
                
                analysis['pages'].append(page_analysis)
            
            analysis['text_content'] = full_text
            
    except Exception as e:
        print(f"pdfplumber analysis error: {e}")
        return analysis
    
    # Analyze text patterns
    analysis['data_patterns'] = analyze_text_patterns(analysis['text_content'])
    
    # Analyze holdings structure
    analysis['holdings_analysis'] = analyze_holdings_structure(analysis)
    
    return analysis

def analyze_text_patterns(text: str) -> Dict[str, Any]:
    """Analyze patterns in the text content"""
    
    patterns = {
        'isin_codes': [],
        'currencies': [],
        'numbers': [],
        'dates': [],
        'sections': [],
        'table_headers': [],
        'data_rows': []
    }
    
    # Find ISIN codes
    isin_pattern = r'[A-Z]{2}[A-Z0-9]{10}'
    patterns['isin_codes'] = re.findall(isin_pattern, text)
    
    # Find currencies
    currency_pattern = r'\b(?:USD|EUR|GBP|CHF|JPY|CAD|AUD|SEK|NOK|DKK|ILS|NIS)\b'
    patterns['currencies'] = list(set(re.findall(currency_pattern, text)))
    
    # Find numbers (including decimals and thousands separators)
    number_pattern = r'[\d,]+\.?\d*'
    patterns['numbers'] = re.findall(number_pattern, text)
    
    # Find dates
    date_pattern = r'\d{1,2}[./]\d{1,2}[./]\d{2,4}'
    patterns['dates'] = re.findall(date_pattern, text)
    
    # Find potential section headers
    lines = text.split('\n')
    for i, line in enumerate(lines):
        line = line.strip()
        if line and (line.isupper() or line.endswith(':') or 'PORTFOLIO' in line.upper()):
            patterns['sections'].append({
                'line_number': i,
                'text': line,
                'context': lines[max(0, i-1):i+2]
            })
    
    # Find potential table headers
    header_keywords = ['ISIN', 'Name', 'Shares', 'Value', 'Currency', 'Market', 'Price', 'Amount', 'Quantity']
    for line in lines:
        if any(keyword.upper() in line.upper() for keyword in header_keywords):
            patterns['table_headers'].append(line.strip())
    
    return patterns

def analyze_holdings_structure(analysis: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze the structure of holdings data"""
    
    holdings_analysis = {
        'total_tables': 0,
        'data_tables': [],
        'cash_accounts': [],
        'securities': [],
        'bonds': [],
        'funds': [],
        'data_structure': {},
        'extraction_recommendations': []
    }
    
    # Count total tables
    for page in analysis['pages']:
        holdings_analysis['total_tables'] += page['num_tables']
    
    # Analyze each table
    for page_num, page in enumerate(analysis['pages'], 1):
        for table_idx, table_data in enumerate(page['tables']):
            table = table_data['full_table']
            
            # Skip empty tables
            if not table or not any(table):
                continue
            
            # Analyze table structure
            table_analysis = analyze_table_structure(table, page_num, table_idx)
            holdings_analysis['data_tables'].append(table_analysis)
    
    # Generate recommendations
    holdings_analysis['extraction_recommendations'] = generate_extraction_recommendations(holdings_analysis)
    
    return holdings_analysis

def analyze_table_structure(table: List[List[str]], page_num: int, table_idx: int) -> Dict[str, Any]:
    """Analyze individual table structure"""
    
    analysis = {
        'page': page_num,
        'table_index': table_idx,
        'rows': len(table),
        'cols': len(table[0]) if table else 0,
        'headers': [],
        'data_rows': [],
        'table_type': 'unknown',
        'contains_isin': False,
        'contains_currency': False,
        'contains_numbers': False,
        'column_types': []
    }
    
    if not table:
        return analysis
    
    # Analyze first row as potential headers
    if table[0]:
        analysis['headers'] = [cell.strip() if cell else '' for cell in table[0]]
    
    # Analyze data rows
    for row_idx, row in enumerate(table[1:], 1):
        if row and any(cell and cell.strip() for cell in row):
            clean_row = [cell.strip() if cell else '' for cell in row]
            analysis['data_rows'].append({
                'row_index': row_idx,
                'data': clean_row
            })
    
    # Determine table type
    text_content = ' '.join([' '.join([str(cell) if cell else '' for cell in row]) for row in table if row])
    
    if re.search(r'[A-Z]{2}[A-Z0-9]{10}', text_content):
        analysis['contains_isin'] = True
        analysis['table_type'] = 'securities'
    
    if re.search(r'\b(?:USD|EUR|GBP|CHF|JPY|CAD|AUD|SEK|NOK|DKK|ILS|NIS)\b', text_content):
        analysis['contains_currency'] = True
    
    if re.search(r'[\d,]+\.?\d*', text_content):
        analysis['contains_numbers'] = True
    
    # Analyze column types
    if analysis['headers']:
        for col_idx, header in enumerate(analysis['headers']):
            col_type = classify_column_type(header, table, col_idx)
            analysis['column_types'].append({
                'column_index': col_idx,
                'header': header,
                'type': col_type
            })
    
    return analysis

def classify_column_type(header: str, table: List[List[str]], col_idx: int) -> str:
    """Classify column type based on header and content"""
    
    header_lower = header.lower() if header else ''
    
    # Check header patterns
    if 'isin' in header_lower:
        return 'isin'
    elif any(word in header_lower for word in ['name', 'security', 'instrument']):
        return 'name'
    elif any(word in header_lower for word in ['shares', 'quantity', 'units']):
        return 'quantity'
    elif any(word in header_lower for word in ['value', 'market', 'amount']):
        return 'value'
    elif any(word in header_lower for word in ['currency', 'ccy']):
        return 'currency'
    elif any(word in header_lower for word in ['price', 'rate']):
        return 'price'
    elif any(word in header_lower for word in ['weight', 'allocation', '%']):
        return 'weight'
    
    # Analyze column content
    if col_idx < len(table[0]) if table else False:
        col_values = [str(row[col_idx]) if col_idx < len(row) and row[col_idx] else '' for row in table[1:] if row]
        col_content = ' '.join(col_values)
        
        if re.search(r'[A-Z]{2}[A-Z0-9]{10}', col_content):
            return 'isin'
        elif re.search(r'\b(?:USD|EUR|GBP|CHF|JPY|CAD|AUD|SEK|NOK|DKK|ILS|NIS)\b', col_content):
            return 'currency'
        elif re.search(r'^\d+\.?\d*$', col_content.replace(' ', '').replace(',', '')):
            return 'numeric'
    
    return 'text'

def generate_extraction_recommendations(holdings_analysis: Dict[str, Any]) -> List[str]:
    """Generate recommendations for extraction logic"""
    
    recommendations = []
    
    # Count table types
    securities_tables = [t for t in holdings_analysis['data_tables'] if t['table_type'] == 'securities']
    
    recommendations.append(f"Found {len(securities_tables)} securities tables out of {len(holdings_analysis['data_tables'])} total tables")
    
    # Analyze column patterns
    all_headers = []
    for table in holdings_analysis['data_tables']:
        all_headers.extend(table['headers'])
    
    unique_headers = list(set(h for h in all_headers if h))
    recommendations.append(f"Unique headers found: {unique_headers}")
    
    # Column type analysis
    column_types = {}
    for table in holdings_analysis['data_tables']:
        for col in table['column_types']:
            col_type = col['type']
            if col_type not in column_types:
                column_types[col_type] = []
            column_types[col_type].append(col['header'])
    
    recommendations.append(f"Column types mapping: {column_types}")
    
    return recommendations

def main():
    pdf_path = "/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/2. Messos  - 31.03.2025.pdf"
    
    print("Starting comprehensive PDF analysis...")
    analysis = analyze_pdf_structure(pdf_path)
    
    print("\n" + "="*80)
    print("COMPREHENSIVE PDF ANALYSIS REPORT")
    print("="*80)
    
    # Metadata
    print(f"\nMETADATA:")
    print(f"Pages: {analysis['metadata'].get('num_pages', 'Unknown')}")
    print(f"Encrypted: {analysis['metadata'].get('encrypted', 'Unknown')}")
    
    # Text patterns
    print(f"\nTEXT PATTERNS:")
    patterns = analysis['data_patterns']
    print(f"ISIN codes found: {len(patterns['isin_codes'])}")
    print(f"Currencies found: {patterns['currencies']}")
    print(f"Sections found: {len(patterns['sections'])}")
    print(f"Table headers found: {len(patterns['table_headers'])}")
    
    # Holdings analysis
    print(f"\nHOLDINGS ANALYSIS:")
    holdings = analysis['holdings_analysis']
    print(f"Total tables: {holdings['total_tables']}")
    print(f"Data tables: {len(holdings['data_tables'])}")
    
    # Detailed table analysis
    print(f"\nDETAILED TABLE ANALYSIS:")
    for table in holdings['data_tables']:
        if table['contains_isin'] or table['contains_currency']:
            print(f"\nTable {table['table_index']} on page {table['page']}:")
            print(f"  Type: {table['table_type']}")
            print(f"  Size: {table['rows']}x{table['cols']}")
            print(f"  Headers: {table['headers']}")
            print(f"  Contains ISIN: {table['contains_isin']}")
            print(f"  Contains Currency: {table['contains_currency']}")
            print(f"  Column types: {[col['type'] for col in table['column_types']]}")
            
            # Show sample data
            if table['data_rows']:
                print(f"  Sample data:")
                for i, row in enumerate(table['data_rows'][:3]):
                    print(f"    Row {i+1}: {row['data']}")
    
    # Recommendations
    print(f"\nEXTRACTION RECOMMENDATIONS:")
    for rec in holdings['extraction_recommendations']:
        print(f"  • {rec}")
    
    # Save detailed analysis
    output_file = "/mnt/c/Users/aviad/OneDrive/Desktop/pdf-main/messos_analysis_detailed.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(analysis, f, indent=2, ensure_ascii=False)
    print(f"\nDetailed analysis saved to: {output_file}")

if __name__ == "__main__":
    main()