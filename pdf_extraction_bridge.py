#!/usr/bin/env python3
"""
PDF Extraction Bridge with Enhanced OCR Support
Integrates all advanced PDF extraction libraries with Node.js
Handles both digital and scanned PDFs
"""

import json
import sys
import os
import io
import base64
from typing import Dict, List, Any, Optional
import logging
import tempfile
from pathlib import Path
import numpy as np

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import libraries with proper error handling
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False
    logger.warning("pdfplumber not available")

try:
    import fitz  # PyMuPDF
    PYMUPDF_AVAILABLE = True
except ImportError:
    PYMUPDF_AVAILABLE = False
    logger.warning("PyMuPDF not available")

try:
    import camelot
    CAMELOT_AVAILABLE = True
except ImportError:
    CAMELOT_AVAILABLE = False
    logger.warning("Camelot not available")

try:
    import tabula
    TABULA_AVAILABLE = True
except ImportError:
    TABULA_AVAILABLE = False
    logger.warning("Tabula not available")

try:
    import pytesseract
    from PIL import Image
    import cv2
    TESSERACT_AVAILABLE = True
except ImportError:
    TESSERACT_AVAILABLE = False
    logger.warning("Tesseract/OpenCV not available")

try:
    from pdf2image import convert_from_path
    PDF2IMAGE_AVAILABLE = True
except ImportError:
    PDF2IMAGE_AVAILABLE = False
    logger.warning("pdf2image not available")


class ComprehensivePDFExtractor:
    """
    Comprehensive PDF extraction with OCR support for scanned documents
    """
    
    def __init__(self):
        self.results = {
            'text': '',
            'tables': [],
            'securities': [],
            'is_scanned': False,
            'extraction_methods': [],
            'metadata': {}
        }
        
    def extract(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract all content from PDF, automatically detecting if OCR is needed
        """
        logger.info(f"Starting comprehensive extraction from: {pdf_path}")
        
        # First, check if PDF is scanned/image-based
        self.results['is_scanned'] = self._is_scanned_pdf(pdf_path)
        
        if self.results['is_scanned']:
            logger.info("Detected scanned PDF - using OCR extraction")
            self._extract_with_ocr(pdf_path)
        
        # Always try digital extraction methods as well
        self._extract_digital_content(pdf_path)
        
        # Extract financial securities
        self._extract_financial_data()
        
        return self.results
    
    def _is_scanned_pdf(self, pdf_path: str) -> bool:
        """
        Detect if PDF is scanned/image-based
        """
        if not PYMUPDF_AVAILABLE:
            return False
            
        try:
            doc = fitz.open(pdf_path)
            total_pages = len(doc)
            text_pages = 0
            
            for page in doc:
                text = page.get_text().strip()
                if len(text) > 50:  # Minimum text threshold
                    text_pages += 1
            
            doc.close()
            
            # If less than 20% of pages have extractable text, consider it scanned
            return (text_pages / total_pages) < 0.2 if total_pages > 0 else True
            
        except Exception as e:
            logger.error(f"Error checking if PDF is scanned: {e}")
            return False
    
    def _extract_with_ocr(self, pdf_path: str):
        """
        Extract content from scanned PDFs using OCR
        """
        if not TESSERACT_AVAILABLE or not PDF2IMAGE_AVAILABLE:
            logger.error("OCR extraction requires pytesseract and pdf2image")
            return
        
        try:
            # Convert PDF pages to images
            images = convert_from_path(pdf_path, dpi=300)
            
            ocr_text = []
            ocr_tables = []
            
            for page_num, image in enumerate(images):
                logger.info(f"Processing page {page_num + 1} with OCR...")
                
                # Enhance image for better OCR
                enhanced_image = self._enhance_image_for_ocr(image)
                
                # Extract text with OCR
                page_text = pytesseract.image_to_string(
                    enhanced_image,
                    config='--psm 6 --oem 3'  # Page segmentation mode 6, OCR Engine Mode 3
                )
                ocr_text.append(f"--- Page {page_num + 1} (OCR) ---\n{page_text}")
                
                # Try to extract tables from OCR
                table_data = self._extract_tables_from_ocr(enhanced_image)
                if table_data:
                    ocr_tables.extend(table_data)
            
            self.results['text'] += '\n\n--- OCR EXTRACTED TEXT ---\n' + '\n'.join(ocr_text)
            self.results['tables'].extend(ocr_tables)
            self.results['extraction_methods'].append('tesseract_ocr')
            
        except Exception as e:
            logger.error(f"OCR extraction failed: {e}")
    
    def _enhance_image_for_ocr(self, image):
        """
        Enhance image quality for better OCR results
        """
        if not TESSERACT_AVAILABLE:
            return image
            
        try:
            # Convert PIL Image to OpenCV format
            img_array = np.array(image)
            
            # Convert to grayscale
            gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
            
            # Apply thresholding to get black and white image
            _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
            
            # Denoise
            denoised = cv2.fastNlMeansDenoising(thresh)
            
            # Convert back to PIL Image
            return Image.fromarray(denoised)
            
        except Exception as e:
            logger.error(f"Image enhancement failed: {e}")
            return image
    
    def _extract_tables_from_ocr(self, image) -> List[Dict]:
        """
        Extract tables from OCR image using structure detection
        """
        tables = []
        
        try:
            # Use Tesseract with TSV output for structure
            ocr_data = pytesseract.image_to_data(image, output_type=pytesseract.Output.DICT)
            
            # Simple table detection based on alignment
            # This is a basic implementation - could be enhanced with ML models
            lines = {}
            for i in range(len(ocr_data['text'])):
                if int(ocr_data['conf'][i]) > 30:  # Confidence threshold
                    top = ocr_data['top'][i]
                    # Group text by vertical position (line)
                    line_key = top // 20  # 20 pixel tolerance
                    if line_key not in lines:
                        lines[line_key] = []
                    lines[line_key].append({
                        'text': ocr_data['text'][i],
                        'left': ocr_data['left'][i]
                    })
            
            # Convert to table if we have multiple aligned columns
            if len(lines) > 2:
                table_data = []
                for line_key in sorted(lines.keys()):
                    line_items = sorted(lines[line_key], key=lambda x: x['left'])
                    if len(line_items) > 1:  # Multiple columns
                        row = [item['text'] for item in line_items if item['text'].strip()]
                        if row:
                            table_data.append(row)
                
                if len(table_data) > 2:  # Minimum table size
                    tables.append({
                        'data': table_data,
                        'source': 'tesseract_ocr',
                        'type': 'extracted_from_image'
                    })
            
        except Exception as e:
            logger.error(f"Table extraction from OCR failed: {e}")
        
        return tables
    
    def _extract_digital_content(self, pdf_path: str):
        """
        Extract content using digital PDF extraction methods
        """
        # Try multiple extraction methods
        if PDFPLUMBER_AVAILABLE:
            self._extract_with_pdfplumber(pdf_path)
        
        if PYMUPDF_AVAILABLE:
            self._extract_with_pymupdf(pdf_path)
        
        if CAMELOT_AVAILABLE:
            self._extract_with_camelot(pdf_path)
        
        if TABULA_AVAILABLE:
            self._extract_with_tabula(pdf_path)
    
    def _extract_with_pdfplumber(self, pdf_path: str):
        """Extract using pdfplumber"""
        try:
            logger.info("Extracting with pdfplumber...")
            text_parts = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Extract text
                    text = page.extract_text()
                    if text:
                        text_parts.append(f"--- Page {page_num + 1} (pdfplumber) ---\n{text}")
                    
                    # Extract tables
                    tables = page.extract_tables()
                    for table in tables:
                        if table and len(table) > 1:
                            self.results['tables'].append({
                                'data': table,
                                'page': page_num + 1,
                                'source': 'pdfplumber'
                            })
            
            if text_parts:
                self.results['text'] += '\n\n--- PDFPLUMBER ---\n' + '\n'.join(text_parts)
                self.results['extraction_methods'].append('pdfplumber')
                
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {e}")
    
    def _extract_with_pymupdf(self, pdf_path: str):
        """Extract using PyMuPDF"""
        try:
            logger.info("Extracting with PyMuPDF...")
            doc = fitz.open(pdf_path)
            text_parts = []
            
            for page_num, page in enumerate(doc):
                # Extract text
                text = page.get_text()
                if text.strip():
                    text_parts.append(f"--- Page {page_num + 1} (PyMuPDF) ---\n{text}")
                
                # Try table extraction if available
                try:
                    tables = page.find_tables()
                    for table in tables:
                        table_data = []
                        for row in table.extract():
                            table_data.append([cell if cell else '' for cell in row])
                        
                        if table_data and len(table_data) > 1:
                            self.results['tables'].append({
                                'data': table_data,
                                'page': page_num + 1,
                                'source': 'pymupdf'
                            })
                except:
                    pass
            
            doc.close()
            
            if text_parts:
                self.results['text'] += '\n\n--- PYMUPDF ---\n' + '\n'.join(text_parts)
                self.results['extraction_methods'].append('pymupdf')
                
        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {e}")
    
    def _extract_with_camelot(self, pdf_path: str):
        """Extract tables using Camelot"""
        try:
            logger.info("Extracting tables with Camelot...")
            
            # Try stream method
            try:
                tables = camelot.read_pdf(pdf_path, pages='all', flavor='stream')
                for table in tables:
                    if table.df.shape[0] > 1:  # Has data rows
                        self.results['tables'].append({
                            'data': table.df.values.tolist(),
                            'headers': table.df.columns.tolist(),
                            'source': 'camelot_stream',
                            'accuracy': table.accuracy
                        })
                self.results['extraction_methods'].append('camelot_stream')
            except:
                pass
            
            # Try lattice method
            try:
                tables = camelot.read_pdf(pdf_path, pages='all', flavor='lattice')
                for table in tables:
                    if table.df.shape[0] > 1:
                        self.results['tables'].append({
                            'data': table.df.values.tolist(),
                            'headers': table.df.columns.tolist(),
                            'source': 'camelot_lattice',
                            'accuracy': table.accuracy
                        })
                self.results['extraction_methods'].append('camelot_lattice')
            except:
                pass
                
        except Exception as e:
            logger.error(f"Camelot extraction failed: {e}")
    
    def _extract_with_tabula(self, pdf_path: str):
        """Extract tables using Tabula"""
        try:
            logger.info("Extracting tables with Tabula...")
            
            tables = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True, silent=True)
            
            for table in tables:
                if not table.empty and table.shape[0] > 1:
                    self.results['tables'].append({
                        'data': table.values.tolist(),
                        'headers': table.columns.tolist(),
                        'source': 'tabula'
                    })
            
            if tables:
                self.results['extraction_methods'].append('tabula')
                
        except Exception as e:
            logger.error(f"Tabula extraction failed: {e}")
    
    def _extract_financial_data(self):
        """Extract financial securities and values"""
        import re
        
        text = self.results['text']
        
        # ISIN pattern
        isin_pattern = re.compile(r'\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b')
        
        securities = []
        for match in isin_pattern.finditer(text):
            isin = match.group(1)
            
            # Find value near ISIN
            start = max(0, match.start() - 500)
            end = min(len(text), match.end() + 500)
            context = text[start:end]
            
            # Value patterns
            value_patterns = [
                r'USD\s*(\d{1,3}(?:[,\']\d{3})*(?:\.\d+)?)',
                r'CHF\s*(\d{1,3}(?:[,\']\d{3})*(?:\.\d+)?)',
                r'(\d{1,3}(?:[,\']\d{3})*(?:\.\d+)?)\s*USD',
                r'(\d{1,3}(?:[,\']\d{3})*(?:\.\d+)?)\s*CHF',
                r'(\d{1,3}(?:[,\']\d{3})*)'  # Generic number
            ]
            
            best_value = 0
            for pattern in value_patterns:
                matches = re.findall(pattern, context)
                for value_match in matches:
                    try:
                        value = float(value_match.replace(',', '').replace('\'', ''))
                        if 1000 <= value <= 100000000:  # Reasonable range
                            best_value = max(best_value, value)
                    except:
                        pass
            
            if best_value > 0:
                securities.append({
                    'isin': isin,
                    'value': best_value,
                    'confidence': 0.8,
                    'extraction_method': 'regex_pattern'
                })
        
        self.results['securities'] = securities


def main():
    """
    Main entry point for Node.js bridge
    """
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'No PDF path provided'}))
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(json.dumps({'error': f'PDF not found: {pdf_path}'}))
        sys.exit(1)
    
    try:
        extractor = ComprehensivePDFExtractor()
        results = extractor.extract(pdf_path)
        
        # Convert numpy types to Python types for JSON serialization
        def convert_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            elif isinstance(obj, dict):
                return {k: convert_types(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_types(v) for v in obj]
            return obj
        
        results = convert_types(results)
        
        # Output JSON results
        print(json.dumps(results, ensure_ascii=False))
        
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == "__main__":
    main()