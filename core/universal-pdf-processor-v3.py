# UNIVERSAL PDF PROCESSOR V3 - TABLE STRUCTURE INTEGRATION
# Combines enhanced pattern recognition with table structure analysis

import pdfplumber
import PyPDF2
import re
import json
import pandas as pd
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from datetime import datetime
import logging

# Import all enhanced components
import importlib.util

# Import enhanced pattern recognizer
spec = importlib.util.spec_from_file_location("enhanced_pattern_recognizer", "core/enhanced-pattern-recognizer.py")
enhanced_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(enhanced_module)

# Import table structure analyzer
spec2 = importlib.util.spec_from_file_location("table_structure_analyzer", "core/table-structure-analyzer.py")
table_module = importlib.util.module_from_spec(spec2)
spec2.loader.exec_module(table_module)

# Import classes
ContextualNumberClassifier = enhanced_module.ContextualNumberClassifier
MathematicalValidator = enhanced_module.MathematicalValidator
EnhancedNumberFormatter = enhanced_module.EnhancedNumberFormatter
StructuredDataExtractor = table_module.StructuredDataExtractor

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
    extraction_method: str = "table_structure_v3"
    table_confidence: float = 0.0

class SpatialAnalyzer:
    """Advanced spatial analysis engine - same as previous versions"""
    
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

class TableStructurePatternRecognizer:
    """Enhanced pattern recognition with table structure integration"""
    
    def __init__(self):
        self.structured_extractor = StructuredDataExtractor()
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
        """Extract complete security data using table structure analysis"""
        
        # Method 1: Try table structure extraction first
        structured_data = self.structured_extractor.extract_with_structure(
            all_spatial_data, isin, spatial_item
        )
        
        table_confidence = 0.8 if structured_data else 0.0
        
        # Method 2: Fallback to enhanced pattern recognition if table structure fails
        if not structured_data or len(structured_data) < 2:
            logger.info(f"Table structure extraction failed for {isin}, using pattern recognition fallback")
            
            # Use enhanced number classification as fallback
            number_contexts = self.number_classifier.extract_numbers_with_context(
                all_spatial_data, spatial_item
            )
            classified_numbers = self.number_classifier.classify_numbers_smart(number_contexts)
            
            # Convert to structured_data format
            structured_data = {}
            if 'quantity' in classified_numbers:
                structured_data['quantity'] = classified_numbers['quantity'].value
            if 'price' in classified_numbers:
                structured_data['price'] = classified_numbers['price'].value
            if 'market_value' in classified_numbers:
                structured_data['value'] = classified_numbers['market_value'].value
            if 'percentage' in classified_numbers:
                structured_data['percentage'] = classified_numbers['percentage'].value
            
            # Extract name using pattern recognition
            structured_data['name'] = self._extract_security_name_fallback(isin, spatial_item, all_spatial_data)
            
            table_confidence = 0.3  # Lower confidence for fallback method
        
        # Extract additional fields
        context_text = self._get_context_text(spatial_item, all_spatial_data)
        currency = self._extract_currency(context_text)
        maturity = self._extract_maturity(context_text)
        
        # Build security object with integrated data
        security = FinancialSecurity(
            isin=isin,
            name=structured_data.get('name'),
            quantity=structured_data.get('quantity'),
            price=structured_data.get('price'),
            market_value=structured_data.get('value'),
            currency=currency or "USD",
            percentage=structured_data.get('percentage'),
            maturity=maturity,
            page=spatial_item.page,
            extraction_method="table_structure_v3",
            table_confidence=table_confidence
        )
        
        # Enhanced mathematical validation
        security.validation_status, security.validation_confidence = self.validator.validate_quantity_price_value(
            security.quantity, security.price, security.market_value
        )
        
        # Try mathematical corrections if validation failed but we have partial data
        if security.validation_status == "validation_failed" and security.quantity and security.price:
            # Try different price interpretations
            if security.price < 10:  # Might be percentage format
                corrected_price = security.price * 100
                calculated_value = security.quantity * corrected_price
                
                # Check if this makes more sense
                if security.market_value and abs(calculated_value - security.market_value) / security.market_value < 0.1:
                    security.price = corrected_price
                    logger.info(f"Corrected price from {security.price/100:.4f} to {corrected_price:.4f} for {isin}")
                    
                    # Re-validate
                    security.validation_status, security.validation_confidence = self.validator.validate_quantity_price_value(
                        security.quantity, security.price, security.market_value
                    )
        
        # Calculate overall confidence score
        security.confidence_score = self._calculate_integrated_confidence_score(security, structured_data, table_confidence)
        
        return security
    
    def _extract_security_name_fallback(self, isin: str, isin_item: SpatialTextItem, all_data: List[SpatialTextItem]) -> Optional[str]:
        """Fallback method to extract security name"""
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
                    not re.match(r'^[A-Z]{1,5}$', item.text)):
                    name_parts.append(item.text)
            
            if name_parts:
                return " ".join(name_parts[:3])  # Take first 3 meaningful parts
        
        return None
    
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
    
    def _calculate_integrated_confidence_score(self, security: FinancialSecurity, 
                                             structured_data: Dict, table_confidence: float) -> float:
        """Calculate confidence score integrating all extraction methods"""
        score = 0.0
        
        # ISIN detection - always high confidence
        score += 0.15
        
        # Table structure confidence
        score += table_confidence * 0.3
        
        # Data completeness
        data_completeness = sum(1 for field in ['name', 'quantity', 'price', 'market_value'] 
                               if getattr(security, field) is not None) / 4
        score += data_completeness * 0.2
        
        # Mathematical validation bonus
        if security.validation_status == "validated":
            score += 0.25
        elif security.validation_status == "acceptable":
            score += 0.15
        elif security.validation_status == "questionable":
            score += 0.05
        
        # Name quality
        if security.name and len(security.name) > 10:
            score += 0.1
        elif security.name:
            score += 0.05
        
        return min(score, 1.0)

class UniversalPDFProcessorV3:
    """Ultimate universal PDF processing engine with table structure integration"""
    
    def __init__(self):
        self.spatial_analyzer = SpatialAnalyzer()
        self.pattern_recognizer = TableStructurePatternRecognizer()
        self.processing_stats = {}
    
    def process_pdf(self, pdf_path: str) -> Dict:
        """Process PDF with integrated table structure analysis"""
        start_time = datetime.now()
        logger.info(f"Starting integrated PDF processing V3: {pdf_path}")
        
        try:
            # Step 1: Extract spatial data
            spatial_data = self.spatial_analyzer.extract_spatial_data(pdf_path)
            
            # Step 2: Detect ISINs
            isins = self.pattern_recognizer.detect_isins(spatial_data)
            
            # Step 3: Extract security data with table structure integration
            securities = []
            for isin, spatial_item in isins:
                security = self.pattern_recognizer.extract_security_data(
                    isin, spatial_item, spatial_data
                )
                securities.append(security)
            
            # Step 4: Calculate portfolio summary
            portfolio_summary = self._calculate_portfolio_summary(securities)
            
            # Step 5: Compile integrated results
            processing_time = (datetime.now() - start_time).total_seconds()
            
            results = {
                "metadata": {
                    "filename": pdf_path.split("\\")[-1],
                    "processing_time": processing_time,
                    "extraction_method": "Integrated Table Structure Recognition V3",
                    "total_pages": max([item.page for item in spatial_data]) if spatial_data else 0,
                    "processed_at": datetime.now().isoformat(),
                    "version": "3.0"
                },
                "securities": [self._security_to_dict(sec) for sec in securities],
                "portfolio_summary": portfolio_summary,
                "extraction_stats": {
                    "total_spatial_items": len(spatial_data),
                    "isins_found": len(isins),
                    "securities_extracted": len(securities),
                    "validated_securities": len([s for s in securities if s.validation_status == "validated"]),
                    "acceptable_securities": len([s for s in securities if s.validation_status == "acceptable"]),
                    "questionable_securities": len([s for s in securities if s.validation_status == "questionable"]),
                    "failed_securities": len([s for s in securities if s.validation_status == "validation_failed"]),
                    "average_confidence": sum([s.confidence_score for s in securities]) / len(securities) if securities else 0,
                    "average_validation_confidence": sum([s.validation_confidence for s in securities]) / len(securities) if securities else 0,
                    "average_table_confidence": sum([s.table_confidence for s in securities]) / len(securities) if securities else 0
                }
            }
            
            logger.info(f"Integrated processing completed in {processing_time:.2f}s")
            logger.info(f"Extracted {len(securities)} securities with {results['extraction_stats']['validated_securities']} validated")
            
            return results
            
        except Exception as e:
            logger.error(f"Error in integrated processing: {e}")
            import traceback
            traceback.print_exc()
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
            "extraction_method": security.extraction_method,
            "table_confidence": security.table_confidence
        }
    
    def _calculate_portfolio_summary(self, securities: List[FinancialSecurity]) -> Dict:
        """Calculate integrated portfolio summary"""
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
                "low_confidence_securities": len([s for s in securities if s.confidence_score < 0.6]),
                "high_table_confidence": len([s for s in securities if s.table_confidence >= 0.7]),
                "successful_table_extractions": len([s for s in securities if s.table_confidence >= 0.5])
            }
        }

# Test function
if __name__ == "__main__":
    processor = UniversalPDFProcessorV3()
    
    # Test with the Messos PDF
    pdf_path = r"C:\Users\aviad\OneDrive\Desktop\pdf-main\2. Messos  - 31.03.2025.pdf"
    
    try:
        results = processor.process_pdf(pdf_path)
        
        if "error" not in results:
            # Save results
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            results_file = f"integrated_v3_extraction_{timestamp}.json"
            
            with open(results_file, 'w', encoding='utf-8') as f:
                json.dump(results, f, indent=2, ensure_ascii=False)
            
            print(f"\nINTEGRATED V3 PDF PROCESSING COMPLETE")
            print(f"Results saved to: {results_file}")
            print(f"Securities found: {results['extraction_stats']['securities_extracted']}")
            print(f"Validated: {results['extraction_stats']['validated_securities']}")
            print(f"Portfolio value: ${results['portfolio_summary']['total_value']:,.2f}")
        else:
            print(f"Error: {results['error']}")
        
    except Exception as e:
        print(f"Test error: {e}")
        import traceback
        traceback.print_exc()