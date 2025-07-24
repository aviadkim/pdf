import pdfplumber
import json
import re
import sys

def parse_swiss_number(text):
    """Parse Swiss number format (e.g., 1'234'567.89)"""
    if not text:
        return None
    try:
        # Remove everything except digits, apostrophes, dots, and commas
        cleaned = re.sub(r'[^\d\',.]', '', str(text))
        # Replace apostrophes with empty string
        cleaned = cleaned.replace("'", "")
        # Replace comma with dot for decimal
        if ',' in cleaned and '.' not in cleaned:
            cleaned = cleaned.replace(',', '.')
        return float(cleaned) if cleaned else None
    except:
        return None

def extract_complete_data(pdf_path):
    complete_data = {
        "portfolio_summary": {
            "total_value": 0,
            "currency": "USD",
            "client": "MESSOS ENTERPRISES LTD."
        },
        "all_securities": [],
        "extraction_stats": {}
    }
    
    try:
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Processing {len(pdf.pages)} pages...")
            
            # Extract from each page
            for page_num, page in enumerate(pdf.pages, 1):
                print(f"Page {page_num}...")
                
                # Extract all text
                page_text = page.extract_text()
                if not page_text:
                    continue
                
                # Find all ISINs on this page
                isin_pattern = r'([A-Z]{2}[A-Z0-9]{9}[0-9])'
                isin_matches = list(re.finditer(isin_pattern, page_text))
                
                for match in isin_matches:
                    isin = match.group(1)
                    
                    # Extract surrounding text (500 chars before and after)
                    start = max(0, match.start() - 500)
                    end = min(len(page_text), match.end() + 1000)
                    context = page_text[start:end]
                    
                    # Extract all data for this security
                    security_data = extract_security_data(isin, context, page_num)
                    if security_data:
                        complete_data["all_securities"].append(security_data)
                
                # Extract portfolio total if on early pages
                if page_num <= 3:
                    total_match = re.search(r'Total\s+(\d+[\'\d,]*)\s+100\.00%', page_text)
                    if total_match:
                        total_value = parse_swiss_number(total_match.group(1))
                        if total_value:
                            complete_data["portfolio_summary"]["total_value"] = total_value
            
            # Add statistics
            complete_data["extraction_stats"] = {
                "total_securities": len(complete_data["all_securities"]),
                "total_pages": len(pdf.pages)
            }
            
            return complete_data
            
    except Exception as e:
        print(f"Error: {e}")
        return None

def extract_security_data(isin, context, page_num):
    """Extract all data for a specific security"""
    security = {
        "isin": isin,
        "page": page_num,
        "name": None,
        "quantity": None,
        "price": None,
        "market_value": None,
        "currency": None,
        "percentage": None,
        "maturity": None,
        "coupon": None,
        "performance": [],
        "raw_context": context
    }
    
    # Extract name - look for descriptive text
    lines = context.split('\n')
    for line in lines:
        if isin in line:
            # Extract description after currency and amount
            parts = line.split()
            if len(parts) > 3:
                # Find where the description starts
                desc_parts = []
                found_amount = False
                for part in parts:
                    if parse_swiss_number(part) and not found_amount:
                        found_amount = True
                        continue
                    if found_amount and not re.match(r'[\d.,]+%?$', part):
                        desc_parts.append(part)
                
                if desc_parts:
                    security["name"] = ' '.join(desc_parts[:10])  # First 10 words
                    break
    
    # Extract all numbers from context
    all_numbers = []
    for line in lines:
        words = line.split()
        for word in words:
            number = parse_swiss_number(word)
            if number is not None:
                all_numbers.append({
                    'value': number,
                    'original': word,
                    'line': line
                })
    
    # Extract currency
    currencies = ['USD', 'CHF', 'EUR', 'GBP']
    for curr in currencies:
        if curr in context:
            security["currency"] = curr
            break
    
    # Extract quantity (usually after currency, large number)
    for line in lines:
        curr_match = re.search(r'(USD|CHF|EUR|GBP)\s+([\d\',]+)', line)
        if curr_match:
            qty = parse_swiss_number(curr_match.group(2))
            if qty and qty >= 1000:
                security["quantity"] = qty
                break
    
    # Extract price (decimal number between 1-1000)
    for num_data in all_numbers:
        val = num_data['value']
        if 1 <= val <= 1000 and '.' in num_data['original']:
            security["price"] = val
            break
    
    # Extract market value (large number, often at end of line)
    for line in lines:
        # Look for pattern: large number followed by percentage
        value_match = re.search(r'(\d+[\'\d,]*)\s+\d+\.\d+%', line)
        if value_match:
            market_val = parse_swiss_number(value_match.group(1))
            if market_val and market_val >= 1000:
                security["market_value"] = market_val
                break
    
    # Extract percentage
    pct_matches = re.findall(r'(\d+\.\d+)%', context)
    if pct_matches:
        security["percentage"] = parse_swiss_number(pct_matches[-1])  # Last percentage
    
    # Extract maturity date
    date_match = re.search(r'(\d{2}\.\d{2}\.\d{4})', context)
    if date_match:
        security["maturity"] = date_match.group(1)
    
    # Extract coupon
    coupon_match = re.search(r'[Cc]oupon[:\s]+(\d+\.?\d*)', context)
    if coupon_match:
        security["coupon"] = parse_swiss_number(coupon_match.group(1))
    
    # Extract performance data
    perf_matches = re.findall(r'(-?\d+\.\d+)%', context)
    performance = []
    for match in perf_matches:
        perf_val = parse_swiss_number(match)
        if perf_val is not None:
            performance.append(perf_val)
    security["performance"] = performance
    
    return security

def create_tables_from_data(complete_data):
    """Create different tables from the extracted data"""
    securities = complete_data["all_securities"]
    
    # Table 1: Basic Securities Information
    basic_table = []
    for sec in securities:
        basic_table.append({
            "ISIN": sec["isin"],
            "Name": sec["name"] or "N/A",
            "Currency": sec["currency"] or "USD",
            "Page": sec["page"]
        })
    
    # Table 2: Financial Data
    financial_table = []
    for sec in securities:
        financial_table.append({
            "ISIN": sec["isin"],
            "Quantity": sec["quantity"],
            "Price": sec["price"],
            "Market Value": sec["market_value"],
            "Percentage": sec["percentage"]
        })
    
    # Table 3: Bond Details
    bond_table = []
    for sec in securities:
        if sec["maturity"] or sec["coupon"]:
            bond_table.append({
                "ISIN": sec["isin"],
                "Maturity": sec["maturity"],
                "Coupon": sec["coupon"],
                "Performance": sec["performance"]
            })
    
    return {
        "basic_info": basic_table,
        "financial_data": financial_table,
        "bond_details": bond_table
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python extract-all-data.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Extract complete data
    print("Starting complete data extraction...")
    complete_data = extract_complete_data(pdf_path)
    
    if complete_data:
        # Print summary
        print("\n" + "="*50)
        print("COMPLETE DATA EXTRACTION RESULTS")
        print("="*50)
        
        summary = complete_data["portfolio_summary"]
        print(f"Total Portfolio Value: ${summary['total_value']:,.2f}")
        print(f"Total Securities Found: {complete_data['extraction_stats']['total_securities']}")
        
        # Show sample data
        print("\nSample Securities Data:")
        for i, sec in enumerate(complete_data["all_securities"][:5]):
            print(f"\n{i+1}. {sec['isin']}")
            print(f"   Name: {sec['name']}")
            print(f"   Quantity: {sec['quantity']}")
            print(f"   Price: {sec['price']}")
            print(f"   Market Value: {sec['market_value']}")
            print(f"   Currency: {sec['currency']}")
            print(f"   Percentage: {sec['percentage']}%")
            print(f"   Page: {sec['page']}")
        
        # Create tables
        tables = create_tables_from_data(complete_data)
        
        # Save complete data
        with open('complete_extraction_results.json', 'w') as f:
            json.dump(complete_data, f, indent=2, default=str)
        
        # Save tables
        with open('extracted_tables.json', 'w') as f:
            json.dump(tables, f, indent=2, default=str)
        
        print(f"\nFiles saved:")
        print("- complete_extraction_results.json (all data)")
        print("- extracted_tables.json (organized tables)")
        print("\nExtraction completed successfully!")
        
    else:
        print("Extraction failed!")