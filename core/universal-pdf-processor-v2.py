# UNIVERSAL PDF PROCESSOR V2 - ENHANCED ACCURACY
# Integrates enhanced pattern recognition for better extraction accuracy

import pdfplumber
import PyPDF2
import re
import json
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# Import enhanced components
import importlib.util
spec = importlib.util.spec_from_file_location("enhanced_pattern_recognizer", "core/enhanced-pattern-recognizer.py")
enhanced_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(enhanced_module)

ContextualNumberClassifier = enhanced_module.ContextualNumberClassifier
MathematicalValidator = enhanced_module.MathematicalValidator
EnhancedNumberFormatter = enhanced_module.EnhancedNumberFormatter

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
    validation_confidence: float = 0.0
    extraction_method: str = "enhanced_pattern_recognition"

class SpatialAnalyzer:
    """Advanced spatial analysis engine - same as V1"""
    
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

class EnhancedPatternRecognizer:
    """Enhanced pattern recognition with improved accuracy"""
    
    def __init__(self):
        self.number_classifier = ContextualNumberClassifier()
        self.validator = MathematicalValidator()
        
        # Universal patterns
        self.isin_pattern = re.compile(r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b')
        self.currency_pattern = re.compile(r'\b(USD|EUR|CHF|GBP|JPY|CAD|AUD|SEK|NOK|DKK)\b')
        self.percentage_pattern = re.compile(r'([\d\.,]+)\s*%')
        self.date_pattern = re.compile(r'\b(\d{1,2})[\.\/\-](\d{1,2})[\.\/\-](\d{2,4})\b')
    
    def detect_isins(self, spatial_data: List[SpatialTextItem]) -> List[Tuple[str, SpatialTextItem]]:
        """Detect all ISINs with their spatial positions"""
        isins = []
        
        for item in spatial_data:
            matches = self.isin_pattern.findall(item.text)
            for isin in matches:
                isins.append((isin, item))
                logger.info(f"Found ISIN: {isin} on page {item.page}")
        
        return isins
    
    def extract_security_data(self, isin: str, spatial_item: SpatialTextItem, 
                            all_spatial_data: List[SpatialTextItem]) -> FinancialSecurity:
        """Extract complete security data using enhanced spatial analysis"""
        
        # Use enhanced number classification
        number_contexts = self.number_classifier.extract_numbers_with_context(
            all_spatial_data, spatial_item
        )
        
        # Classify numbers intelligently
        classified_numbers = self.number_classifier.classify_numbers_smart(number_contexts)
        
        # Extract other fields
        context_text = self._get_context_text(spatial_item, all_spatial_data)
        name = self._extract_security_name(isin, spatial_item, all_spatial_data)
        currency = self._extract_currency(context_text)
        maturity = self._extract_maturity(context_text)
        percentage = self._extract_percentage(context_text)
        
        # Build security object
        security = FinancialSecurity(
            isin=isin,
            name=name,
            quantity=classified_numbers.get('quantity').value if 'quantity' in classified_numbers else None,
            price=classified_numbers.get('price').value if 'price' in classified_numbers else None,
            market_value=classified_numbers.get('market_value').value if 'market_value' in classified_numbers else None,
            currency=currency or "USD",
            percentage=classified_numbers.get('percentage').value if 'percentage' in classified_numbers else percentage,
            maturity=maturity,
            page=spatial_item.page,
            extraction_method="enhanced_pattern_recognition_v2"
        )
        
        # Calculate confidence score based on classification confidence
        security.confidence_score = self._calculate_enhanced_confidence_score(security, classified_numbers)
        
        # Enhanced mathematical validation
        security.validation_status, security.validation_confidence = self.validator.validate_quantity_price_value(
            security.quantity, security.price, security.market_value
        )
        
        # Try corrections if validation failed
        if security.validation_status == "validation_failed":
            suggestions = self.validator.suggest_corrections(
                security.quantity, security.price, security.market_value
            )
            
            # Apply most confident suggestion
            if suggestions:
                best_suggestion = max(suggestions.items(), key=lambda x: 1 if x[0] in ['price', 'market_value'] else 0)
                field_name, suggested_value = best_suggestion
                
                if field_name == 'price' and not security.price:
                    security.price = suggested_value
                elif field_name == 'market_value' and not security.market_value:
                    security.market_value = suggested_value
                
                # Re-validate after correction
                security.validation_status, security.validation_confidence = self.validator.validate_quantity_price_value(
                    security.quantity, security.price, security.market_value
                )
        
        return security
    
    def _get_context_text(self, isin_item: SpatialTextItem, all_data: List[SpatialTextItem]) -> str:
        """Get context text around ISIN"""
        same_page_items = [item for item in all_data if item.page == isin_item.page]
        
        isin_y = (isin_item.y0 + isin_item.y1) / 2
        context_items = []
        
        for item in same_page_items:
            item_y = (item.y0 + item.y1) / 2
            y_distance = abs(item_y - isin_y)
            
            if y_distance <= 20:  # Same row
                context_items.append(item)
        
        return " ".join([item.text for item in sorted(context_items, key=lambda x: x.x0)])
    
    def _extract_security_name(self, isin: str, isin_item: SpatialTextItem, all_data: List[SpatialTextItem]) -> Optional[str]:
        """Extract security name using improved logic"""
        same_page_items = [item for item in all_data if item.page == isin_item.page]
        
        # Find items in same row as ISIN
        isin_y = (isin_item.y0 + isin_item.y1) / 2
        row_items = []
        
        for item in same_page_items:
            item_y = (item.y0 + item.y1) / 2
            if abs(item_y - isin_y) <= 10:  # Same row tolerance
                row_items.append(item)
        
        # Sort by x position and find name after ISIN
        row_items.sort(key=lambda x: x.x0)
        
        isin_index = -1
        for i, item in enumerate(row_items):
            if isin in item.text:
                isin_index = i
                break
        
        if isin_index >= 0:
            name_parts = []
            for i in range(isin_index + 1, min(isin_index + 4, len(row_items))):
                item = row_items[i]
                # Skip numbers and short codes
                if (len(item.text) > 3 and 
                    not re.match(r'^\d+[\.,\d]*$', item.text) and 
                    not re.match(r'^[A-Z]{1,5}$', item.text) and
                    not EnhancedNumberFormatter.is_isin_number(item.text)):
                    name_parts.append(item.text)
            
            if name_parts:
                return " ".join(name_parts[:3])  # Take first 3 meaningful parts
        
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
    
    def _extract_percentage(self, text: str) -> Optional[float]:
        """Extract percentage from text"""
        matches = self.percentage_pattern.findall(text)
        if matches:
            try:
                return float(matches[0].replace(',', '.'))
            except ValueError:
                pass
        return None
    
    def _calculate_enhanced_confidence_score(self, security: FinancialSecurity, classified_numbers: Dict) -> float:
        """Calculate enhanced confidence score"""
        score = 0.0
        
        # ISIN detection - always high confidence
        score += 0.2
        
        # Name extraction quality
        if security.name and len(security.name) > 10:
            score += 0.2
        elif security.name:
            score += 0.1
        
        # Number classification confidence
        if 'quantity' in classified_numbers:
            score += classified_numbers['quantity'].classification_confidence * 0.2
        if 'price' in classified_numbers:
            score += classified_numbers['price'].classification_confidence * 0.2
        if 'market_value' in classified_numbers:
            score += classified_numbers['market_value'].classification_confidence * 0.2
        
        # Mathematical validation bonus
        if security.validation_status in ["validated", "acceptable"]:
            score += security.validation_confidence * 0.2
        
        return min(score, 1.0)

class UniversalPDFProcessorV2:
    """Enhanced universal PDF processing engine"""
    
    def __init__(self):
        self.spatial_analyzer = SpatialAnalyzer()
        self.pattern_recognizer = EnhancedPatternRecognizer()
        self.processing_stats = {}
    
    def process_pdf(self, pdf_path: str) -> Dict:
        """Process PDF with enhanced accuracy"""
        start_time = datetime.now()
        logger.info(f"Starting enhanced PDF processing: {pdf_path}")
        
        try:
            # Step 1: Extract spatial data
            spatial_data = self.spatial_analyzer.extract_spatial_data(pdf_path)
            
            # Step 2: Detect ISINs
            isins = self.pattern_recognizer.detect_isins(spatial_data)
            
            # Step 3: Extract security data with enhanced accuracy
            securities = []
            for isin, spatial_item in isins:
                security = self.pattern_recognizer.extract_security_data(
                    isin, spatial_item, spatial_data
                )
                securities.append(security)
            
            # Step 4: Calculate portfolio summary
            portfolio_summary = self._calculate_portfolio_summary(securities)
            
            # Step 5: Compile enhanced results
            processing_time = (datetime.now() - start_time).total_seconds()
            
            results = {
                "metadata": {
                    "filename": pdf_path.split("\\")[-1],
                    "processing_time": processing_time,
                    "extraction_method": "Enhanced Universal Pattern Recognition V2",
                    "total_pages": max([item.page for item in spatial_data]) if spatial_data else 0,
                    "processed_at": datetime.now().isoformat(),
                    "version": "2.0"
                },
                "securities": [self._security_to_dict(sec) for sec in securities],
                "portfolio_summary": portfolio_summary,
                "extraction_stats": {
                    "total_spatial_items": len(spatial_data),
                    "isins_found": len(isins),
                    "securities_extracted": len(securities),
                    "validated_securities": len([s for s in securities if s.validation_status == "validated"]),
                    "acceptable_securities": len([s for s in securities if s.validation_status == "acceptable"]),
                    "failed_securities": len([s for s in securities if s.validation_status == "validation_failed"]),
                    "average_confidence": sum([s.confidence_score for s in securities]) / len(securities) if securities else 0,
                    "average_validation_confidence": sum([s.validation_confidence for s in securities]) / len(securities) if securities else 0
                }
            }
            
            logger.info(f"Enhanced processing completed in {processing_time:.2f}s")
            logger.info(f"Extracted {len(securities)} securities with {results['extraction_stats']['validated_securities']} validated")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in enhanced processing: {e}")
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
            "validation_status": security.validation_status,
            "validation_confidence": security.validation_confidence,
            "extraction_method": security.extraction_method
        }
    
    def _calculate_portfolio_summary(self, securities: List[FinancialSecurity]) -> Dict:
        """Calculate enhanced portfolio summary"""
        total_value = sum([s.market_value for s in securities if s.market_value])
        
        return {
            "total_value": total_value,
            "total_securities": len(securities),
            "currencies": list(set([s.currency for s in securities if s.currency])),
            "validation_summary": {
                "validated": len([s for s in securities if s.validation_status == "validated"]),
                "acceptable": len([s for s in securities if s.validation_status == "acceptable"]),
                "questionable": len([s for s in securities if s.validation_status == "questionable"]),
                "failed": len([s for s in securities if s.validation_status == "validation_failed"]),
                "incomplete": len([s for s in securities if s.validation_status == "incomplete_data"])
            },
            "accuracy_metrics": {
                "high_confidence_securities": len([s for s in securities if s.confidence_score >= 0.8]),
                "medium_confidence_securities": len([s for s in securities if 0.6 <= s.confidence_score < 0.8]),
                "low_confidence_securities": len([s for s in securities if s.confidence_score < 0.6])
            }
        }

# Test function
if __name__ == "__main__":
    processor = UniversalPDFProcessorV2()
    
    # Test with the Messos PDF
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    try:
        results = processor.process_pdf(pdf_path)
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = f"enhanced_extraction_{timestamp}.json"
        
        with open(results_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"\nENHANCED PDF PROCESSING COMPLETE")
        print(f"Results saved to: {results_file}")
        print(f"Securities found: {results['extraction_stats']['securities_extracted']}")
        print(f"Validated: {results['extraction_stats']['validated_securities']}")
        print(f"Portfolio value: ${results['portfolio_summary']['total_value']:,.2f}")
        
    except FileNotFoundError:
        print("PDF file not found. Please check the path.")
    except Exception as e:
        print(f"Error: {e}")