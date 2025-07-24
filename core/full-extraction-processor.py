# FULL EXTRACTION PROCESSOR - Extract ALL Securities from PDF
# Phase 3 implementation that extracts ALL 38-41 securities, not just test cases

import pdfplumber
import re
import json
from typing import Dict, List, Tuple, Optional, Any
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

@dataclass
class ExtractedSecurity:
    """Security with all extracted fields"""
    isin: str
    name: str
    quantity: Optional[float] = None
    price: Optional[float] = None
    market_value: Optional[float] = None
    percentage: Optional[float] = None
    currency: Optional[str] = None
    maturity: Optional[str] = None
    coupon: Optional[str] = None
    page: int = 0
    confidence: float = 0.0
    validation_status: str = "pending"

class FullExtractionProcessor:
    """Extract ALL securities from the PDF, not just test cases"""
    
    def __init__(self):
        self.swiss_number_pattern = re.compile(r"(\d{1,3}(?:'?\d{3})*(?:\.\d{2,4})?)")
        self.isin_pattern = re.compile(r'([A-Z]{2}[A-Z0-9]{9}[0-9])')
        self.percentage_pattern = re.compile(r'(\d{1,2}\.\d{2})%?')
        self.date_pattern = re.compile(r'(\d{2}\.\d{2}\.\d{2,4})')
        
    def extract_all_securities(self, pdf_path: str) -> List[ExtractedSecurity]:
        """Extract ALL securities from the PDF"""
        
        logger.info(f"Starting FULL extraction from {pdf_path}")
        all_securities = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                # First, find all ISINs in the document
                all_isins = self._find_all_isins_in_pdf(pdf)
                logger.info(f"Found {len(all_isins)} total ISINs in document")
                
                # Process each page to extract security data
                for page_num, page in enumerate(pdf.pages, 1):
                    logger.info(f"Processing page {page_num} for securities")
                    
                    # Extract all text with coordinates
                    words = page.extract_words()
                    
                    # Find ISINs on this page
                    page_isins = [(isin, item) for isin, item in all_isins if item['page'] == page_num]
                    
                    if page_isins:
                        logger.info(f"Found {len(page_isins)} ISINs on page {page_num}")
                        
                        # Extract security data for each ISIN
                        for isin, isin_item in page_isins:
                            security = self._extract_security_data(isin, isin_item, words, page_num)
                            if security:
                                all_securities.append(security)
                
                logger.info(f"Total securities extracted: {len(all_securities)}")
                
        except Exception as e:
            logger.error(f"Error in full extraction: {e}")
        
        return all_securities
    
    def _find_all_isins_in_pdf(self, pdf) -> List[Tuple[str, Dict]]:
        """Find ALL ISINs in the entire PDF"""
        all_isins = []
        
        for page_num, page in enumerate(pdf.pages, 1):
            page_text = page.extract_text()
            
            if page_text:
                # Find all ISINs in page text
                isin_matches = self.isin_pattern.findall(page_text)
                
                # Also get words for coordinate information
                words = page.extract_words()
                
                for isin in isin_matches:
                    # Find the word containing this ISIN
                    for word in words:
                        if isin in word['text']:
                            all_isins.append((isin, {
                                'text': word['text'],
                                'x0': word['x0'],
                                'y0': word['top'],
                                'x1': word['x1'],
                                'y1': word['bottom'],
                                'page': page_num
                            }))
                            break
        
        # Remove duplicates
        unique_isins = []
        seen = set()
        
        for isin, item in all_isins:
            if isin not in seen:
                unique_isins.append((isin, item))
                seen.add(isin)
        
        return unique_isins
    
    def _extract_security_data(self, isin: str, isin_item: Dict, words: List[Dict], page_num: int) -> Optional[ExtractedSecurity]:
        """Extract complete security data for a given ISIN"""
        
        security = ExtractedSecurity(isin=isin, page=page_num)
        
        # Find all words in the same row as the ISIN
        isin_y = (isin_item['y0'] + isin_item['y1']) / 2
        row_words = []
        
        for word in words:
            word_y = (word['top'] + word['bottom']) / 2
            if abs(word_y - isin_y) <= 5:  # Within 5 pixels vertically
                row_words.append(word)
        
        # Sort by x-coordinate
        row_words.sort(key=lambda w: w['x0'])
        
        # Extract fields based on position and patterns
        security = self._extract_fields_from_row(security, row_words, isin_item)
        
        # Validate the extraction
        security = self._validate_security(security)
        
        return security
    
    def _extract_fields_from_row(self, security: ExtractedSecurity, row_words: List[Dict], isin_item: Dict) -> ExtractedSecurity:
        """Extract fields from a row of words"""
        
        # Find ISIN position
        isin_index = -1
        for i, word in enumerate(row_words):
            if security.isin in word['text']:
                isin_index = i
                break
        
        if isin_index < 0:
            return security
        
        # Extract name (words after ISIN that aren't numbers)
        name_parts = []
        for i in range(isin_index + 1, min(isin_index + 6, len(row_words))):
            text = row_words[i]['text']
            # Skip if it's a number or percentage
            if not re.match(r'^[\d,.\'-]+%?$', text) and len(text) > 2:
                name_parts.append(text)
            else:
                break  # Stop at first number
        
        if name_parts:
            security.name = ' '.join(name_parts[:4])  # Limit name length
        
        # Extract numbers from the rest of the row
        numbers = []
        for i in range(isin_index + 1, len(row_words)):
            text = row_words[i]['text']
            
            # Check for percentage
            if '%' in text or (i > 0 and '%' in row_words[i-1]['text']):
                percentage_match = self.percentage_pattern.search(text)
                if percentage_match:
                    security.percentage = float(percentage_match.group(1))
            
            # Extract numbers
            number_matches = self.swiss_number_pattern.findall(text)
            for match in number_matches:
                try:
                    # Clean Swiss number format
                    clean_number = match.replace("'", "").replace(",", "")
                    number = float(clean_number)
                    
                    # Store with original text for context
                    numbers.append({
                        'value': number,
                        'text': text,
                        'x': row_words[i]['x0']
                    })
                except:
                    pass
        
        # Classify numbers based on magnitude and position
        if numbers:
            # Sort by x-coordinate (left to right)
            numbers.sort(key=lambda n: n['x'])
            
            # Typical pattern: Quantity, Price, Market Value
            large_numbers = [n for n in numbers if n['value'] >= 1000]
            medium_numbers = [n for n in numbers if 10 <= n['value'] < 1000]
            small_numbers = [n for n in numbers if 0 < n['value'] < 10]
            
            # Quantity: Usually first large number
            if large_numbers:
                # Check if it's a round number (likely quantity)
                for num in large_numbers:
                    if num['value'] % 100 == 0 or num['value'] % 1000 == 0:
                        security.quantity = num['value']
                        large_numbers.remove(num)
                        break
                
                if not security.quantity and large_numbers:
                    security.quantity = large_numbers[0]['value']
                    large_numbers.pop(0)
            
            # Price: Usually a number between 50-150
            for num in medium_numbers + large_numbers:
                if 50 <= num['value'] <= 150:
                    security.price = num['value']
                    break
            
            # Market Value: Usually the largest remaining number
            remaining_large = [n for n in large_numbers if n['value'] != security.quantity and n['value'] != security.price]
            if remaining_large:
                security.market_value = max(n['value'] for n in remaining_large)
            elif large_numbers:
                security.market_value = max(n['value'] for n in large_numbers)
        
        # Extract dates for maturity
        date_matches = self.date_pattern.findall(' '.join(word['text'] for word in row_words))
        if date_matches:
            security.maturity = date_matches[-1]  # Usually last date is maturity
        
        # Detect currency
        text_full = ' '.join(word['text'] for word in row_words)
        if 'USD' in text_full:
            security.currency = 'USD'
        elif 'CHF' in text_full:
            security.currency = 'CHF'
        elif 'EUR' in text_full:
            security.currency = 'EUR'
        
        return security
    
    def _validate_security(self, security: ExtractedSecurity) -> ExtractedSecurity:
        """Validate and calculate confidence for security"""
        
        # Count extracted fields
        fields_extracted = sum([
            security.name is not None,
            security.quantity is not None,
            security.price is not None,
            security.market_value is not None,
            security.percentage is not None
        ])
        
        # Base confidence on field completion
        security.confidence = fields_extracted / 5.0
        
        # Mathematical validation
        if security.quantity and security.price and security.market_value:
            calculated = security.quantity * security.price
            
            # Check if calculation matches (within 5%)
            if security.market_value > 0:
                error = abs(calculated - security.market_value) / security.market_value
                
                if error < 0.05:
                    security.validation_status = "validated"
                    security.confidence = min(1.0, security.confidence + 0.2)
                elif error < 0.15:
                    security.validation_status = "acceptable"
                else:
                    # Try price as percentage
                    calculated_pct = security.quantity * (security.price / 100)
                    error_pct = abs(calculated_pct - security.market_value) / security.market_value
                    
                    if error_pct < 0.05:
                        security.price = security.price / 100
                        security.validation_status = "validated"
                        security.confidence = min(1.0, security.confidence + 0.1)
                    else:
                        security.validation_status = "validation_failed"
        elif fields_extracted >= 3:
            security.validation_status = "partial"
        else:
            security.validation_status = "incomplete"
        
        return security

class Phase3FullExtractor:
    """Phase 3 processor that extracts ALL securities"""
    
    def __init__(self):
        self.full_extractor = FullExtractionProcessor()
        
    def process_pdf_complete(self, pdf_path: str) -> Dict[str, Any]:
        """Process PDF and extract ALL securities"""
        
        start_time = datetime.now()
        logger.info(f"Starting Phase 3 FULL extraction: {pdf_path}")
        
        # Extract all securities
        all_securities = self.full_extractor.extract_all_securities(pdf_path)
        
        # Convert to dictionary format
        securities_list = []
        for security in all_securities:
            securities_list.append({
                'isin': security.isin,
                'name': security.name,
                'quantity': security.quantity,
                'price': security.price,
                'market_value': security.market_value,
                'percentage': security.percentage,
                'currency': security.currency,
                'maturity': security.maturity,
                'page': security.page,
                'confidence_score': security.confidence,
                'validation_status': security.validation_status
            })
        
        # Calculate statistics
        total_value = sum(s['market_value'] for s in securities_list 
                         if s['market_value'] is not None)
        
        validated_count = len([s for s in securities_list 
                              if s['validation_status'] == 'validated'])
        
        processing_time = (datetime.now() - start_time).total_seconds()
        
        results = {
            'metadata': {
                'filename': pdf_path.split('\\')[-1],
                'total_processing_time': processing_time,
                'processor_version': 'Phase3_Full_Extraction',
                'extraction_mode': 'COMPLETE_ALL_SECURITIES'
            },
            'securities': securities_list,
            'portfolio_summary': {
                'total_securities': len(securities_list),
                'total_value': total_value,
                'validated_securities': validated_count,
                'currencies': list(set(s['currency'] for s in securities_list if s['currency']))
            },
            'extraction_stats': {
                'securities_extracted': len(securities_list),
                'validated_securities': validated_count,
                'pages_processed': max(s['page'] for s in securities_list) if securities_list else 0,
                'average_confidence': sum(s['confidence_score'] for s in securities_list) / len(securities_list) if securities_list else 0
            }
        }
        
        logger.info(f"Full extraction completed: {len(securities_list)} securities in {processing_time:.1f}s")
        
        return results

# Test function
if __name__ == "__main__":
    import logging
    logging.basicConfig(level=logging.INFO)
    
    processor = Phase3FullExtractor()
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    results = processor.process_pdf_complete(pdf_path)
    
    print(f"\nFULL EXTRACTION COMPLETE")
    print(f"Securities extracted: {results['extraction_stats']['securities_extracted']}")
    print(f"Validated securities: {results['extraction_stats']['validated_securities']}")
    print(f"Total portfolio value: ${results['portfolio_summary']['total_value']:,.2f}")