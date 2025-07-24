# UNIVERSAL PDF PROCESSOR - PHASE 1 CORE INFRASTRUCTURE
# Spatial coordinate extraction with pattern recognition
# Works with ANY financial institution worldwide

import pdfplumber
import PyPDF2
import re
import json
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class SpatialTextItem:
    """Text item with precise spatial coordinates"""
    text: str
    x0: float  # Left coordinate
    y0: float  # Bottom coordinate
    x1: float  # Right coordinate
    y1: float  # Top coordinate
    page: int
    font_size: float
    font_name: str

@dataclass
class FinancialSecurity:
    """Universal financial security data structure"""
    isin: str
    name: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    market_value: Optional[float] = None
    currency: Optional[str] = None
    percentage: Optional[float] = None
    maturity: Optional[str] = None
    coupon: Optional[float] = None
    page: Optional[int] = None
    confidence_score: float = 0.0
    validation_status: str = "pending"

class UniversalNumberFormatter:
    """Handles all international number formats"""
    
    @staticmethod
    def detect_format(text: str) -> str:
        """Detect number format type"""
        if "'" in text and "." in text:
            return "swiss"  # 1'234'567.89
        elif text.count(".") > 1 and "," in text:
            return "german"  # 1.234.567,89
        elif "," in text and "." in text:
            return "us"  # 1,234,567.89
        else:
            return "universal"
    
    @staticmethod
    def parse_universal_number(text: str) -> Optional[float]:
        """Parse any international number format"""
        try:
            # Remove currency symbols and extra spaces
            clean_text = re.sub(r'[^\d\.,\'-]', '', text.strip())
            
            if not clean_text:
                return None
            
            # Swiss format: 1'234'567.89
            if "'" in clean_text:
                clean_text = clean_text.replace("'", "")
                return float(clean_text)
            
            # German format: 1.234.567,89
            if clean_text.count(".") > 1 and "," in clean_text:
                clean_text = clean_text.replace(".", "").replace(",", ".")
                return float(clean_text)
            
            # US format: 1,234,567.89
            if "," in clean_text and "." in clean_text:
                # Remove thousand separators (commas)
                parts = clean_text.split(".")
                if len(parts) == 2 and len(parts[1]) <= 2:  # Decimal format
                    clean_text = clean_text.replace(",", "")
                    return float(clean_text)
            
            # Remove all non-digit except last decimal point
            clean_text = re.sub(r'[^\d.]', '', clean_text)
            return float(clean_text) if clean_text else None
            
        except (ValueError, AttributeError):
            return None

class SpatialAnalyzer:
    """Advanced spatial analysis engine"""
    
    def __init__(self):
        self.spatial_data: List[SpatialTextItem] = []
    
    def extract_spatial_data(self, pdf_path: str) -> List[SpatialTextItem]:
        """Extract text with precise spatial coordinates"""
        logger.info(f"Starting spatial extraction from {pdf_path}")
        
        spatial_items = []
        
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    logger.info(f"Processing page {page_num}")
                    
                    # Extract characters with coordinates
                    chars = page.chars
                    
                    # Group characters into words and lines
                    words = self._group_chars_to_words(chars)
                    
                    for word_data in words:
                        spatial_item = SpatialTextItem(
                            text=word_data['text'],
                            x0=word_data['x0'],
                            y0=word_data['y0'],
                            x1=word_data['x1'],
                            y1=word_data['y1'],
                            page=page_num,
                            font_size=word_data.get('size', 0),
                            font_name=word_data.get('fontname', 'unknown')
                        )
                        spatial_items.append(spatial_item)
                        
        except Exception as e:
            logger.error(f"Error in spatial extraction: {e}")
            
        self.spatial_data = spatial_items
        logger.info(f"Extracted {len(spatial_items)} spatial items")
        return spatial_items
    
    def _group_chars_to_words(self, chars: List[Dict]) -> List[Dict]:
        """Group individual characters into words"""
        if not chars:
            return []
        
        words = []
        current_word = {"chars": [], "text": ""}
        
        for char in chars:
            if char.get('text', '').strip():
                if not current_word["chars"]:
                    current_word["chars"] = [char]
                    current_word["text"] = char['text']
                else:
                    # Check if character belongs to current word
                    last_char = current_word["chars"][-1]
                    x_gap = char['x0'] - last_char['x1']
                    y_diff = abs(char['y0'] - last_char['y0'])
                    
                    if x_gap < 5 and y_diff < 2:  # Same word
                        current_word["chars"].append(char)
                        current_word["text"] += char['text']
                    else:  # New word
                        if current_word["text"].strip():
                            words.append(self._finalize_word(current_word))
                        current_word = {"chars": [char], "text": char['text']}
            else:
                # Space or special character - end current word
                if current_word["text"].strip():
                    words.append(self._finalize_word(current_word))
                    current_word = {"chars": [], "text": ""}
        
        # Add final word
        if current_word["text"].strip():
            words.append(self._finalize_word(current_word))
        
        return words
    
    def _finalize_word(self, word_data: Dict) -> Dict:
        """Convert character group to word with boundaries"""
        chars = word_data["chars"]
        return {
            "text": word_data["text"],
            "x0": min(c['x0'] for c in chars),
            "y0": min(c['y0'] for c in chars),
            "x1": max(c['x1'] for c in chars),
            "y1": max(c['y1'] for c in chars),
            "size": chars[0].get('size', 0),
            "fontname": chars[0].get('fontname', 'unknown')
        }
    
    def find_context_around_position(self, x: float, y: float, page: int, radius: float = 100) -> List[SpatialTextItem]:
        """Find all text items within radius of given position"""
        context_items = []
        
        for item in self.spatial_data:
            if item.page == page:
                # Calculate distance
                center_x = (item.x0 + item.x1) / 2
                center_y = (item.y0 + item.y1) / 2
                distance = ((center_x - x) ** 2 + (center_y - y) ** 2) ** 0.5
                
                if distance <= radius:
                    context_items.append(item)
        
        return sorted(context_items, key=lambda x: ((x.x0 + x.x1) / 2 - x) ** 2 + ((x.y0 + x.y1) / 2 - y) ** 2)

class UniversalPatternRecognizer:
    """Advanced pattern recognition for financial documents"""
    
    def __init__(self):
        self.formatter = UniversalNumberFormatter()
        
        # Universal patterns
        self.isin_pattern = re.compile(r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b')
        self.cusip_pattern = re.compile(r'\b[A-Z0-9]{9}\b')
        self.currency_pattern = re.compile(r'\b(USD|EUR|CHF|GBP|JPY|CAD|AUD|SEK|NOK|DKK)\b')
        self.percentage_pattern = re.compile(r'([\d\.,]+)\s*%')
        self.date_pattern = re.compile(r'\b(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})\b')
        
        # Financial term dictionaries (multi-language)
        self.financial_terms = {
            'quantity': ['quantity', 'shares', 'units', 'nominal', 'anzahl', 'quantité', 'quantità'],
            'price': ['price', 'rate', 'kurs', 'prix', 'prezzo', 'preis'],
            'value': ['value', 'market value', 'wert', 'marktwert', 'valeur', 'valore'],
            'percentage': ['%', 'percent', 'prozent', 'pourcent', 'percento'],
            'maturity': ['maturity', 'expiry', 'fälligkeit', 'échéance', 'scadenza'],
            'coupon': ['coupon', 'yield', 'kupon', 'rendement', 'cedola']
        }
    
    def detect_isins(self, spatial_data: List[SpatialTextItem]) -> List[Tuple[str, SpatialTextItem]]:
        """Detect all ISINs with their spatial positions"""
        isins = []
        
        for item in spatial_data:
            matches = self.isin_pattern.findall(item.text)
            for isin in matches:
                isins.append((isin, item))
                logger.info(f"Found ISIN: {isin} on page {item.page}")
        
        return isins
    
    def classify_numbers_by_context(self, numbers: List[float], context_text: str) -> Dict[str, float]:
        """Classify numbers based on context and heuristics"""
        classification = {}
        
        if not numbers:
            return classification
        
        # Sort numbers for analysis
        sorted_numbers = sorted(numbers)
        
        # Heuristic classification
        large_numbers = [n for n in numbers if n >= 1000]
        medium_numbers = [n for n in numbers if 10 <= n < 1000]
        small_numbers = [n for n in numbers if 0 < n < 10]
        
        # Quantity: Usually large round numbers
        if large_numbers:
            round_large = [n for n in large_numbers if n % 1000 == 0 or n % 500 == 0]
            if round_large:
                classification['quantity'] = round_large[0]
            else:
                classification['quantity'] = large_numbers[0]
        
        # Price: Usually medium numbers with decimals
        price_candidates = [n for n in medium_numbers if 1 < n < 500]
        if price_candidates:
            classification['price'] = price_candidates[-1]  # Take highest reasonable price
        elif medium_numbers:
            classification['price'] = medium_numbers[0]
        
        # Market value: Usually the largest number
        if large_numbers:
            classification['market_value'] = max(large_numbers)
        
        # Percentage: Numbers near % symbol
        if '%' in context_text:
            percentage_candidates = [n for n in small_numbers if n < 100]
            if percentage_candidates:
                classification['percentage'] = percentage_candidates[-1]
        
        return classification
    
    def extract_security_data(self, isin: str, spatial_item: SpatialTextItem, 
                            all_spatial_data: List[SpatialTextItem]) -> FinancialSecurity:
        """Extract complete security data using spatial analysis"""
        
        # Find context around ISIN
        context_items = self._find_context_around_isin(spatial_item, all_spatial_data)
        context_text = " ".join([item.text for item in context_items])
        
        # Extract and classify numbers
        number_strings = re.findall(r'[\d\.,\']+', context_text)
        numbers = []
        for num_str in number_strings:
            parsed = self.formatter.parse_universal_number(num_str)
            if parsed is not None:
                numbers.append(parsed)
        
        classified_numbers = self.classify_numbers_by_context(numbers, context_text)
        
        # Extract name (first significant text after ISIN)
        name = self._extract_security_name(isin, context_items)
        
        # Extract other fields
        currency = self._extract_currency(context_text)
        maturity = self._extract_maturity(context_text)
        
        # Create security object
        security = FinancialSecurity(
            isin=isin,
            name=name,
            quantity=classified_numbers.get('quantity'),
            price=classified_numbers.get('price'),
            market_value=classified_numbers.get('market_value'),
            currency=currency,
            percentage=classified_numbers.get('percentage'),
            maturity=maturity,
            page=spatial_item.page
        )
        
        # Calculate confidence score
        security.confidence_score = self._calculate_confidence_score(security, classified_numbers)
        
        # Validate mathematically
        security.validation_status = self._validate_security_data(security)
        
        return security
    
    def _find_context_around_isin(self, isin_item: SpatialTextItem, 
                                 all_data: List[SpatialTextItem]) -> List[SpatialTextItem]:
        """Find context items around ISIN spatially"""
        same_page_items = [item for item in all_data if item.page == isin_item.page]
        
        # Find items in same row and nearby rows
        context_items = []
        isin_y = (isin_item.y0 + isin_item.y1) / 2
        
        for item in same_page_items:
            item_y = (item.y0 + item.y1) / 2
            y_distance = abs(item_y - isin_y)
            
            # Include items in same row (±10 points) and nearby rows (±50 points)
            if y_distance <= 50:
                context_items.append(item)
        
        return sorted(context_items, key=lambda x: x.x0)  # Sort by x position
    
    def _extract_security_name(self, isin: str, context_items: List[SpatialTextItem]) -> Optional[str]:
        """Extract security name from context"""
        name_parts = []
        
        for item in context_items:
            if item.text != isin and len(item.text) > 3:
                # Skip numbers and short codes
                if not re.match(r'^\d+[\.,\d]*$', item.text) and not re.match(r'^[A-Z]{1,5}$', item.text):
                    name_parts.append(item.text)
        
        if name_parts:
            return " ".join(name_parts[:5])  # Take first 5 meaningful words
        return None
    
    def _extract_currency(self, text: str) -> Optional[str]:
        """Extract currency from context"""
        matches = self.currency_pattern.findall(text)
        return matches[0] if matches else None
    
    def _extract_maturity(self, text: str) -> Optional[str]:
        """Extract maturity date"""
        matches = self.date_pattern.findall(text)
        if matches:
            day, month, year = matches[0]
            if len(year) == 2:
                year = "20" + year
            return f"{day}.{month}.{year}"
        return None
    
    def _calculate_confidence_score(self, security: FinancialSecurity, classified_numbers: Dict) -> float:
        """Calculate confidence score for extracted data"""
        score = 0.0
        
        # ISIN is always high confidence
        score += 0.3
        
        # Name extraction
        if security.name:
            score += 0.2
        
        # Number classification quality
        if classified_numbers.get('quantity') and classified_numbers.get('price'):
            score += 0.3
        
        # Mathematical validation
        if (security.quantity and security.price and security.market_value and
            abs(security.quantity * security.price - security.market_value) / security.market_value < 0.1):
            score += 0.2
        
        return min(score, 1.0)
    
    def _validate_security_data(self, security: FinancialSecurity) -> str:
        """Validate security data mathematically"""
        if not all([security.quantity, security.price, security.market_value]):
            return "incomplete_data"
        
        calculated_value = security.quantity * security.price
        actual_value = security.market_value
        
        if abs(calculated_value - actual_value) / actual_value < 0.05:  # 5% tolerance
            return "validated"
        elif abs(calculated_value - actual_value) / actual_value < 0.15:  # 15% tolerance
            return "acceptable"
        else:
            return "validation_failed"

class UniversalPDFProcessor:
    """Main universal PDF processing engine"""
    
    def __init__(self):
        self.spatial_analyzer = SpatialAnalyzer()
        self.pattern_recognizer = UniversalPatternRecognizer()
        self.processing_stats = {}
    
    def process_pdf(self, pdf_path: str) -> Dict:
        """Process PDF and extract all financial data"""
        start_time = datetime.now()
        logger.info(f"Starting universal PDF processing: {pdf_path}")
        
        try:
            # Step 1: Extract spatial data
            spatial_data = self.spatial_analyzer.extract_spatial_data(pdf_path)
            
            # Step 2: Detect ISINs
            isins = self.pattern_recognizer.detect_isins(spatial_data)
            
            # Step 3: Extract security data for each ISIN
            securities = []
            for isin, spatial_item in isins:
                security = self.pattern_recognizer.extract_security_data(
                    isin, spatial_item, spatial_data
                )
                securities.append(security)
            
            # Step 4: Calculate portfolio summary
            portfolio_summary = self._calculate_portfolio_summary(securities)
            
            # Step 5: Compile results
            processing_time = (datetime.now() - start_time).total_seconds()
            
            results = {
                "metadata": {
                    "filename": pdf_path.split("\\")[-1],
                    "processing_time": processing_time,
                    "extraction_method": "Universal Spatial Pattern Recognition",
                    "total_pages": max([item.page for item in spatial_data]) if spatial_data else 0,
                    "processed_at": datetime.now().isoformat()
                },
                "securities": [self._security_to_dict(sec) for sec in securities],
                "portfolio_summary": portfolio_summary,
                "extraction_stats": {
                    "total_spatial_items": len(spatial_data),
                    "isins_found": len(isins),
                    "securities_extracted": len(securities),
                    "validated_securities": len([s for s in securities if s.validation_status == "validated"]),
                    "average_confidence": sum([s.confidence_score for s in securities]) / len(securities) if securities else 0
                }
            }
            
            logger.info(f"Processing completed in {processing_time:.2f}s")
            logger.info(f"Extracted {len(securities)} securities with {results['extraction_stats']['validated_securities']} validated")
            
            return results
            
        except Exception as e:
            logger.error(f"Error processing PDF: {e}")
            return {"error": str(e)}
    
    def _security_to_dict(self, security: FinancialSecurity) -> Dict:
        """Convert security object to dictionary"""
        return {
            "isin": security.isin,
            "name": security.name,
            "quantity": security.quantity,
            "price": security.price,
            "market_value": security.market_value,
            "currency": security.currency,
            "percentage": security.percentage,
            "maturity": security.maturity,
            "page": security.page,
            "confidence_score": security.confidence_score,
            "validation_status": security.validation_status
        }
    
    def _calculate_portfolio_summary(self, securities: List[FinancialSecurity]) -> Dict:
        """Calculate portfolio summary statistics"""
        total_value = sum([s.market_value for s in securities if s.market_value])
        
        return {
            "total_value": total_value,
            "total_securities": len(securities),
            "currencies": list(set([s.currency for s in securities if s.currency])),
            "validation_summary": {
                "validated": len([s for s in securities if s.validation_status == "validated"]),
                "acceptable": len([s for s in securities if s.validation_status == "acceptable"]),
                "failed": len([s for s in securities if s.validation_status == "validation_failed"]),
                "incomplete": len([s for s in securities if s.validation_status == "incomplete_data"])
            }
        }

# Test function
if __name__ == "__main__":
    processor = UniversalPDFProcessor()
    
    # Test with the Messos PDF
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    try:
        results = processor.process_pdf(pdf_path)
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"universal_extraction_{timestamp}.json"
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\n🎯 UNIVERSAL PDF PROCESSING COMPLETE")
        print(f"📊 Results saved to: {results_file}")
        print(f"📈 Securities found: {results['extraction_stats']['securities_extracted']}")
        print(f"✅ Validated: {results['extraction_stats']['validated_securities']}")
        print(f"💰 Portfolio value: ${results['portfolio_summary']['total_value']:,.2f}")
        
    except FileNotFoundError:
        print("❌ PDF file not found. Please check the path.")
    except Exception as e:
        print(f"❌ Error: {e}")