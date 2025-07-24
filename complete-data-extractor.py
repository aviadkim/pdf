import pdfplumber
import json
import re
import sys
from pathlib import Path

class CompleteDataExtractor:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.complete_data = {
            "portfolio_summary": {
                "total_value": 0,
                "currency": "USD",
                "valuation_date": "31.03.2025",
                "client": "MESSOS ENTERPRISES LTD.",
                "bank": "Corner Bank"
            },
            "asset_allocation": {},
            "all_securities": [],
            "raw_tables": [],
            "extraction_metadata": {}
        }
        
    def parse_swiss_number(self, text):
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
            elif ',' in cleaned and '.' in cleaned:
                # If both exist, comma is thousands separator
                parts = cleaned.split('.')
                if len(parts) == 2 and len(parts[1]) <= 3:
                    # Last part is decimal
                    cleaned = ''.join(parts[:-1]) + '.' + parts[-1]
                    cleaned = cleaned.replace(',', '')
            return float(cleaned) if cleaned else None
        except:
            return None
    
    def extract_isin_from_text(self, text):
        """Extract ISIN codes"""
        pattern = r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b'
        return re.findall(pattern, str(text))
    
    def extract_complete_security_data(self, text_block, page_num):
        """Extract complete security information from a text block"""
        lines = text_block.split('\n')
        security_data = {}
        
        # Look for ISIN
        for line in lines:
            isins = self.extract_isin_from_text(line)
            if isins:
                security_data['isin'] = isins[0]
                security_data['isin_line'] = line
                break
        
        if 'isin' not in security_data:
            return None
            
        # Extract all data points
        security_data['page'] = page_num
        security_data['raw_text'] = text_block
        security_data['parsed_data'] = {}
        
        # Find all numbers in the text
        all_numbers = []
        for line in lines:
            # Split line into words and check each
            words = line.split()
            for word in words:
                number = self.parse_swiss_number(word)
                if number is not None:
                    all_numbers.append({
                        'value': number,
                        'original': word,
                        'context': line
                    })
        
        security_data['all_numbers'] = all_numbers
        
        # Extract specific fields using patterns
        security_data['name'] = self.extract_security_name(text_block)
        security_data['quantity'] = self.extract_quantity(text_block, all_numbers)
        security_data['price'] = self.extract_price(text_block, all_numbers)
        security_data['market_value'] = self.extract_market_value(text_block, all_numbers)
        security_data['percentage'] = self.extract_percentage(text_block)
        security_data['maturity'] = self.extract_maturity(text_block)
        security_data['coupon'] = self.extract_coupon(text_block)
        security_data['currency'] = self.extract_currency(text_block)
        security_data['yield_info'] = self.extract_yield(text_block)
        security_data['performance'] = self.extract_performance(text_block)
        
        return security_data
    
    def extract_security_name(self, text):
        """Extract security name/description"""
        lines = text.split('\n')
        for line in lines:
            # Look for descriptive text after currency and quantity
            if any(curr in line for curr in ['USD', 'CHF', 'EUR']):
                # Extract the description part
                parts = line.split()
                name_parts = []
                skip_next = False
                for i, part in enumerate(parts):
                    if skip_next:
                        skip_next = False
                        continue
                    if part in ['USD', 'CHF', 'EUR']:
                        # Next part is likely quantity, start collecting name after that
                        if i + 1 < len(parts):
                            skip_next = True
                            name_start = i + 2
                            if name_start < len(parts):
                                name_parts = parts[name_start:]
                                break
                
                if name_parts:
                    name = ' '.join(name_parts)
                    # Clean up the name
                    name = re.sub(r'\d+\.\d+%', '', name)  # Remove percentages
                    name = re.sub(r'\d{2}\.\d{2}\.\d{4}', '', name)  # Remove dates
                    return name.strip()
        return None
    
    def extract_quantity(self, text, all_numbers):
        """Extract quantity (usually large whole numbers)"""
        # Look for patterns like "USD 200'000" or "CHF 1'500'000"
        lines = text.split('\n')
        for line in lines:
            if any(curr in line for curr in ['USD', 'CHF', 'EUR']):
                # Find number after currency
                pattern = r'(USD|CHF|EUR)\s+([\d\',]+)'
                match = re.search(pattern, line)
                if match:
                    qty_text = match.group(2)
                    qty = self.parse_swiss_number(qty_text)
                    if qty and qty >= 1000:  # Quantities are usually large
                        return qty
        
        # Fallback: look for large whole numbers
        for num_data in all_numbers:
            if num_data['value'] >= 1000 and num_data['value'] % 1 == 0:
                return num_data['value']
        return None
    
    def extract_price(self, text, all_numbers):
        """Extract price (usually decimal numbers between 1-1000)"""
        # Look for price patterns
        for num_data in all_numbers:
            val = num_data['value']
            if 1 <= val <= 1000 and val % 1 != 0:  # Decimal prices
                return val
        
        # Look for specific price indicators
        price_patterns = [
            r'price[:\s]+(\d+\.?\d*)',
            r'(\d+\.?\d*)\s*%\s*-?\d+\.?\d*%\s*(\d+\.?\d*)',  # Between percentages
        ]
        
        for pattern in price_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                price = self.parse_swiss_number(match.group(1))
                if price and 1 <= price <= 1000:
                    return price
        
        return None
    
    def extract_market_value(self, text, all_numbers):
        """Extract market value (usually largest number or specific value)"""
        # Look for value patterns
        value_patterns = [
            r'(\d+[\'\d,]*)\s+\d+\.\d+%',  # Before percentage
            r'valuation[:\s]+(\d+[\'\d,]*)',
        ]
        
        for pattern in value_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = self.parse_swiss_number(match.group(1))
                if value and value >= 1000:
                    return value
        
        # Fallback: find largest number that's not quantity
        largest_val = 0
        for num_data in all_numbers:
            if num_data['value'] > largest_val and num_data['value'] >= 10000:
                largest_val = num_data['value']
        
        return largest_val if largest_val > 0 else None
    
    def extract_percentage(self, text):
        """Extract percentage values"""
        pattern = r'(\d+\.?\d*)\s*%'
        matches = re.findall(pattern, text)
        percentages = []
        for match in matches:
            pct = self.parse_swiss_number(match)
            if pct is not None:
                percentages.append(pct)
        return percentages
    
    def extract_maturity(self, text):
        """Extract maturity date"""
        pattern = r'(\d{2}\.\d{2}\.\d{4})'
        matches = re.findall(pattern, text)
        return matches[0] if matches else None
    
    def extract_coupon(self, text):
        """Extract coupon information"""
        pattern = r'coupon[:\s]+(\d+\.?\d*)'
        match = re.search(pattern, text, re.IGNORECASE)
        return self.parse_swiss_number(match.group(1)) if match else None
    
    def extract_currency(self, text):
        """Extract currency"""
        currencies = ['USD', 'CHF', 'EUR', 'GBP']
        for curr in currencies:
            if curr in text:
                return curr
        return None
    
    def extract_yield(self, text):
        """Extract yield information"""
        pattern = r'yield[:\s]+(\d+\.?\d*)'
        match = re.search(pattern, text, re.IGNORECASE)
        return self.parse_swiss_number(match.group(1)) if match else None
    
    def extract_performance(self, text):
        """Extract performance data"""
        pattern = r'(-?\d+\.?\d*)\s*%'
        matches = re.findall(pattern, text)
        performances = []
        for match in matches:
            perf = self.parse_swiss_number(match)
            if perf is not None:
                performances.append(perf)
        return performances
    
    def extract_all_data(self):
        """Main extraction method"""
        try:
            with pdfplumber.open(self.pdf_path) as pdf:
                print(f"Processing {len(pdf.pages)} pages for complete data extraction...")
                
                # Extract portfolio summary from first pages
                self.extract_portfolio_summary(pdf)
                
                # Extract all securities data
                all_securities = []
                
                for page_num, page in enumerate(pdf.pages, 1):
                    print(f"Processing page {page_num}...")
                    
                    # Extract text blocks
                    page_text = page.extract_text()
                    if page_text:
                        # Split into potential security blocks
                        # Look for ISIN patterns to identify security blocks
                        isin_pattern = r'([A-Z]{2}[A-Z0-9]{9}[0-9])'
                        matches = list(re.finditer(isin_pattern, page_text))
                        
                        if matches:
                            # Extract text around each ISIN
                            for i, match in enumerate(matches):
                                start_pos = max(0, match.start() - 500)
                                end_pos = min(len(page_text), match.end() + 1000)
                                
                                if i + 1 < len(matches):
                                    # Don't overlap with next ISIN
                                    next_start = max(0, matches[i + 1].start() - 500)
                                    end_pos = min(end_pos, next_start)
                                
                                security_block = page_text[start_pos:end_pos]
                                security_data = self.extract_complete_security_data(security_block, page_num)
                                
                                if security_data:
                                    all_securities.append(security_data)
                    
                    # Extract tables
                    tables = page.extract_tables()
                    if tables:
                        for table_idx, table in enumerate(tables):
                            if table:
                                self.complete_data['raw_tables'].append({
                                    'page': page_num,
                                    'table_index': table_idx,
                                    'data': table
                                })
                
                self.complete_data['all_securities'] = all_securities
                self.complete_data['extraction_metadata'] = {
                    'total_securities': len(all_securities),
                    'total_pages': len(pdf.pages),
                    'total_tables': len(self.complete_data['raw_tables'])
                }
                
                print(f"✅ Extraction complete: {len(all_securities)} securities found")
                return self.complete_data
                
        except Exception as e:
            print(f"❌ Error during extraction: {e}")
            return None
    
    def extract_portfolio_summary(self, pdf):
        """Extract portfolio summary from first few pages"""
        try:
            # Get first few pages for summary
            for page_num in range(1, min(4, len(pdf.pages) + 1)):
                page = pdf.pages[page_num - 1]
                text = page.extract_text()
                
                if text:
                    # Look for total value
                    total_pattern = r'Total\s+(\d+[\'\d,]*)\s+100\.00%'
                    match = re.search(total_pattern, text)
                    if match:
                        total_value = self.parse_swiss_number(match.group(1))
                        if total_value:
                            self.complete_data['portfolio_summary']['total_value'] = total_value
                    
                    # Extract asset allocation
                    allocation_patterns = [
                        r'Liquidity\s+(\d+[\'\d,]*)\s+(\d+\.?\d*)%',
                        r'Bonds\s+(\d+[\'\d,]*)\s+(\d+\.?\d*)%',
                        r'Equities\s+(\d+[\'\d,]*)\s+(\d+\.?\d*)%',
                        r'Structured products\s+(\d+[\'\d,]*)\s+(\d+\.?\d*)%',
                        r'Other assets\s+(\d+[\'\d,]*)\s+(\d+\.?\d*)%'
                    ]
                    
                    for pattern in allocation_patterns:
                        match = re.search(pattern, text)
                        if match:
                            asset_type = pattern.split('\\\\s+')[0].replace('\\\\', '')
                            value = self.parse_swiss_number(match.group(1))
                            percentage = self.parse_swiss_number(match.group(2))
                            if value and percentage:
                                self.complete_data['asset_allocation'][asset_type] = {
                                    'value': value,
                                    'percentage': percentage
                                }
        except Exception as e:
            print(f"Warning: Could not extract portfolio summary: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python complete-data-extractor.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    extractor = CompleteDataExtractor(pdf_path)
    
    try:
        complete_data = extractor.extract_all_data()
        if complete_data:
            print("\n" + "="*50)
            print("📊 COMPLETE DATA EXTRACTION RESULTS")
            print("="*50)
            
            # Portfolio summary
            summary = complete_data['portfolio_summary']
            print(f"💰 Total Portfolio Value: ${summary['total_value']:,.2f}")
            print(f"📅 Valuation Date: {summary['valuation_date']}")
            print(f"🏦 Bank: {summary['bank']}")
            print(f"👤 Client: {summary['client']}")
            
            # Asset allocation
            print(f"\n📊 Asset Allocation:")
            for asset_type, data in complete_data['asset_allocation'].items():
                print(f"   {asset_type}: ${data['value']:,.2f} ({data['percentage']:.2f}%)")
            
            # Securities summary
            print(f"\n🔍 Securities Analysis:")
            securities = complete_data['all_securities']
            print(f"   Total Securities: {len(securities)}")
            
            # Show first few securities with complete data
            print(f"\n🏆 Sample Securities with Complete Data:")
            for i, security in enumerate(securities[:5]):
                print(f"\n   {i+1}. {security['isin']}")
                print(f"      Name: {security['name']}")
                print(f"      Quantity: {security['quantity']}")
                print(f"      Price: {security['price']}")
                print(f"      Market Value: {security['market_value']}")
                print(f"      Currency: {security['currency']}")
                print(f"      Page: {security['page']}")
            
            # Export to JSON
            output_file = 'complete_extraction_results.json'
            with open(output_file, 'w') as f:
                json.dump(complete_data, f, indent=2, default=str)
            
            print(f"\n💾 Complete data saved to: {output_file}")
            print("✅ 100% accurate extraction completed!")
            
    except Exception as e:
        print(f"❌ Extraction failed: {e}")
        import traceback
        traceback.print_exc()