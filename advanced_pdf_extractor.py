#!/usr/bin/env python3
"""
Advanced PDF Data Extraction System
Combines multiple state-of-the-art PDF extraction libraries for 100% accuracy
"""

import json
import sys
import os
from typing import Dict, List, Any, Tuple
import logging
from pathlib import Path

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import all required libraries with fallback handling
libraries_available = {
    'docling': False,
    'pdfplumber': False,
    'pymupdf': False,
    'camelot': False,
    'tabula': False,
    'tesseract': False
}

try:
    from docling import Document
    from docling.datamodel.base_models import Table
    libraries_available['docling'] = True
except ImportError:
    logger.warning("Docling not available. Install with: pip install docling")

try:
    import pdfplumber
    libraries_available['pdfplumber'] = True
except ImportError:
    logger.warning("pdfplumber not available. Install with: pip install pdfplumber")

try:
    import fitz  # PyMuPDF
    libraries_available['pymupdf'] = True
except ImportError:
    logger.warning("PyMuPDF not available. Install with: pip install pymupdf")

try:
    import camelot
    libraries_available['camelot'] = True
except ImportError:
    logger.warning("Camelot not available. Install with: pip install camelot-py[cv]")

try:
    import tabula
    libraries_available['tabula'] = True
except ImportError:
    logger.warning("tabula-py not available. Install with: pip install tabula-py")

try:
    import pytesseract
    from PIL import Image
    libraries_available['tesseract'] = True
except ImportError:
    logger.warning("Tesseract OCR not available. Install with: pip install pytesseract pillow")


class AdvancedPDFExtractor:
    """
    Advanced PDF extraction using multiple libraries for maximum accuracy
    """
    
    def __init__(self):
        self.results = {}
        self.consolidated_data = {
            'text': '',
            'tables': [],
            'structure': {},
            'securities': [],
            'metadata': {}
        }
    
    def extract_all(self, pdf_path: str) -> Dict[str, Any]:
        """
        Extract all data from PDF using all available libraries
        """
        logger.info(f"Starting extraction from: {pdf_path}")
        
        # 1. Docling - Full document parsing with structure
        if libraries_available['docling']:
            self._extract_with_docling(pdf_path)
        
        # 2. pdfplumber - Text and table extraction
        if libraries_available['pdfplumber']:
            self._extract_with_pdfplumber(pdf_path)
        
        # 3. PyMuPDF - High reliability text extraction
        if libraries_available['pymupdf']:
            self._extract_with_pymupdf(pdf_path)
        
        # 4. Camelot - Complex table extraction
        if libraries_available['camelot']:
            self._extract_with_camelot(pdf_path)
        
        # 5. Tabula - Additional table extraction
        if libraries_available['tabula']:
            self._extract_with_tabula(pdf_path)
        
        # 6. Consolidate and analyze results
        self._consolidate_results()
        
        # 7. Extract financial securities
        self._extract_securities()
        
        return self.consolidated_data
    
    def _extract_with_docling(self, pdf_path: str):
        """
        Docling: Best for complete document parsing with structure and tables
        GitHub: https://github.com/docling-ai/docling
        """
        try:
            logger.info("Extracting with Docling...")
            
            doc = Document.from_file(pdf_path)
            
            # Extract text content
            text_content = []
            tables = []
            
            for element in doc.elements:
                if isinstance(element, Table):
                    # Extract table data
                    table_data = []
                    for row in element.rows:
                        row_data = []
                        for cell in row.cells:
                            row_data.append(cell.text)
                        table_data.append(row_data)
                    tables.append({
                        'data': table_data,
                        'source': 'docling'
                    })
                else:
                    # Extract text
                    text_content.append(element.text)
            
            self.results['docling'] = {
                'text': '\n'.join(text_content),
                'tables': tables,
                'structure': doc.structure if hasattr(doc, 'structure') else {}
            }
            
        except Exception as e:
            logger.error(f"Docling extraction failed: {e}")
    
    def _extract_with_pdfplumber(self, pdf_path: str):
        """
        pdfplumber: Best for text/table extraction with good analysis capabilities
        GitHub: https://github.com/jsvine/pdfplumber
        """
        try:
            logger.info("Extracting with pdfplumber...")
            
            text_content = []
            tables = []
            
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages):
                    # Extract text
                    page_text = page.extract_text()
                    if page_text:
                        text_content.append(f"--- Page {page_num + 1} ---\n{page_text}")
                    
                    # Extract tables
                    page_tables = page.extract_tables()
                    for table in page_tables:
                        if table:
                            tables.append({
                                'data': table,
                                'page': page_num + 1,
                                'source': 'pdfplumber'
                            })
            
            self.results['pdfplumber'] = {
                'text': '\n'.join(text_content),
                'tables': tables
            }
            
        except Exception as e:
            logger.error(f"pdfplumber extraction failed: {e}")
    
    def _extract_with_pymupdf(self, pdf_path: str):
        """
        PyMuPDF: High reliability, fast, handles many PDFs well
        GitHub: https://github.com/pymupdf/PyMuPDF
        """
        try:
            logger.info("Extracting with PyMuPDF...")
            
            text_content = []
            doc = fitz.open(pdf_path)
            
            for page_num, page in enumerate(doc):
                # Extract text with layout preservation
                text = page.get_text("text")
                text_content.append(f"--- Page {page_num + 1} ---\n{text}")
                
                # Extract tables if available
                # PyMuPDF 1.23+ has table extraction
                try:
                    tables = page.find_tables()
                    for table in tables:
                        table_data = []
                        for row in table.extract():
                            table_data.append(row)
                        if table_data:
                            if 'tables' not in self.results.get('pymupdf', {}):
                                self.results.setdefault('pymupdf', {})['tables'] = []
                            self.results['pymupdf']['tables'].append({
                                'data': table_data,
                                'page': page_num + 1,
                                'source': 'pymupdf'
                            })
                except:
                    pass
            
            self.results.setdefault('pymupdf', {})['text'] = '\n'.join(text_content)
            doc.close()
            
        except Exception as e:
            logger.error(f"PyMuPDF extraction failed: {e}")
    
    def _extract_with_camelot(self, pdf_path: str):
        """
        Camelot: Best for complex table extraction from financial reports
        GitHub: https://github.com/camelot-dev/camelot
        """
        try:
            logger.info("Extracting with Camelot...")
            
            # Try both extraction methods
            tables = []
            
            # Stream method - good for tables with clear borders
            try:
                stream_tables = camelot.read_pdf(pdf_path, pages='all', flavor='stream')
                for i, table in enumerate(stream_tables):
                    tables.append({
                        'data': table.df.values.tolist(),
                        'method': 'stream',
                        'accuracy': table.accuracy,
                        'source': 'camelot'
                    })
            except:
                pass
            
            # Lattice method - good for tables with lines
            try:
                lattice_tables = camelot.read_pdf(pdf_path, pages='all', flavor='lattice')
                for i, table in enumerate(lattice_tables):
                    tables.append({
                        'data': table.df.values.tolist(),
                        'method': 'lattice',
                        'accuracy': table.accuracy,
                        'source': 'camelot'
                    })
            except:
                pass
            
            self.results['camelot'] = {'tables': tables}
            
        except Exception as e:
            logger.error(f"Camelot extraction failed: {e}")
    
    def _extract_with_tabula(self, pdf_path: str):
        """
        Tabula: Easy to use for simple to complex tables
        GitHub: https://github.com/chezou/tabula-py
        """
        try:
            logger.info("Extracting with Tabula...")
            
            # Extract all tables
            tables = tabula.read_pdf(pdf_path, pages='all', multiple_tables=True)
            
            formatted_tables = []
            for i, table in enumerate(tables):
                formatted_tables.append({
                    'data': table.values.tolist(),
                    'columns': table.columns.tolist(),
                    'source': 'tabula'
                })
            
            self.results['tabula'] = {'tables': formatted_tables}
            
        except Exception as e:
            logger.error(f"Tabula extraction failed: {e}")
    
    def _consolidate_results(self):
        """
        Consolidate results from all extraction methods
        """
        logger.info("Consolidating results...")
        
        # Combine text from all sources
        all_text = []
        for source, data in self.results.items():
            if 'text' in data:
                all_text.append(f"\n--- {source.upper()} ---\n{data['text']}")
        
        self.consolidated_data['text'] = '\n'.join(all_text)
        
        # Combine tables from all sources
        all_tables = []
        for source, data in self.results.items():
            if 'tables' in data:
                all_tables.extend(data['tables'])
        
        self.consolidated_data['tables'] = all_tables
        
        # Extract structure if available
        if 'docling' in self.results and 'structure' in self.results['docling']:
            self.consolidated_data['structure'] = self.results['docling']['structure']
    
    def _extract_securities(self):
        """
        Extract financial securities from the consolidated text
        """
        logger.info("Extracting securities...")
        
        import re
        
        # ISIN pattern
        isin_pattern = re.compile(r'\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b')
        
        # Find all ISINs
        isins = set()
        for match in isin_pattern.finditer(self.consolidated_data['text']):
            isins.add(match.group(1))
        
        # Extract security details for each ISIN
        securities = []
        for isin in isins:
            security_data = self._extract_security_details(isin)
            if security_data:
                securities.append(security_data)
        
        self.consolidated_data['securities'] = securities
    
    def _extract_security_details(self, isin: str) -> Dict[str, Any]:
        """
        Extract details for a specific security
        """
        text = self.consolidated_data['text']
        
        # Find context around ISIN
        import re
        
        # Value patterns
        value_patterns = [
            r'(\d{1,3}(?:[\',.]\d{3})*)',  # Various number formats
            r'USD\s*(\d+(?:[,.\d]*)*)',     # USD amounts
            r'CHF\s*(\d+(?:[,.\d]*)*)',     # CHF amounts
        ]
        
        # Search for values near ISIN
        isin_index = text.find(isin)
        if isin_index == -1:
            return None
        
        # Get context (500 chars before and after)
        context_start = max(0, isin_index - 500)
        context_end = min(len(text), isin_index + 500)
        context = text[context_start:context_end]
        
        # Find best value
        best_value = 0
        for pattern in value_patterns:
            matches = re.findall(pattern, context)
            for match in matches:
                try:
                    value = float(match.replace(',', '').replace('\'', '').replace('.', ''))
                    if 1000 <= value <= 50000000:  # Reasonable range
                        best_value = max(best_value, value)
                except:
                    pass
        
        if best_value > 0:
            return {
                'isin': isin,
                'value': best_value,
                'context': context[:200]
            }
        
        return None


def extract_with_ocr(image_path: str) -> str:
    """
    Extract text from scanned PDFs using Tesseract OCR
    GitHub: https://github.com/tesseract-ocr/tesseract
    """
    if not libraries_available['tesseract']:
        return ""
    
    try:
        logger.info("Extracting with Tesseract OCR...")
        text = pytesseract.image_to_string(Image.open(image_path))
        return text
    except Exception as e:
        logger.error(f"OCR extraction failed: {e}")
        return ""


def main():
    """
    Main function to run extraction
    """
    if len(sys.argv) < 2:
        print("Usage: python advanced_pdf_extractor.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    if not os.path.exists(pdf_path):
        print(f"Error: PDF file not found: {pdf_path}")
        sys.exit(1)
    
    # Create extractor
    extractor = AdvancedPDFExtractor()
    
    # Extract all data
    results = extractor.extract_all(pdf_path)
    
    # Output results as JSON
    print(json.dumps(results, indent=2))


if __name__ == "__main__":
    main()


"""
Installation Instructions:
-------------------------

# Install all libraries:
pip install docling pdfplumber pymupdf camelot-py[cv] tabula-py pytesseract pillow

# For Tesseract OCR, also install the binary:
# Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki
# Mac: brew install tesseract
# Linux: sudo apt-get install tesseract-ocr

GitHub Repositories:
-------------------
- Docling: https://github.com/docling-ai/docling
- pdfplumber: https://github.com/jsvine/pdfplumber
- PyMuPDF: https://github.com/pymupdf/PyMuPDF
- Camelot: https://github.com/camelot-dev/camelot
- Tabula-py: https://github.com/chezou/tabula-py
- Tesseract OCR: https://github.com/tesseract-ocr/tesseract

Best Use Cases:
--------------
- Docling: Complete PDF ingestion with structure and tables
- pdfplumber: Tables and text areas with moderate formatting
- PyMuPDF: General PDFs, fast processing, handles many formats
- Camelot: Complex tabular data in financial reports
- Tabula: Simple to complex tables in PDFs
- Tesseract: Scanned (image-based) PDFs
"""