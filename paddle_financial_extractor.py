# paddle_financial_extractor.py - Complete Financial PDF Processing with PaddleOCR 3.0
"""
Universal Financial PDF Extractor using PaddleOCR 3.0 with PP-StructureV3
Extracts ALL data from ANY financial document for complete AI analysis
Works with Cornerstone Bank, Schwab, Fidelity, Vanguard, and all financial institutions
"""

import os
import json
import re
import logging
from typing import Dict, List, Any, Optional, Tuple
from pathlib import Path
from dataclasses import dataclass
from datetime import datetime
import asyncio

# PaddleOCR 3.0 imports
try:
    from paddleocr import PaddleOCR
    # Try to import PPStructure - may not be available in all versions
    try:
        from paddleocr import PPStructure
        HAS_PPSTRUCTURE = True
    except ImportError:
        HAS_PPSTRUCTURE = False
    import cv2
    import numpy as np
    from pdf2image import convert_from_path
    import pandas as pd
    PADDLE_AVAILABLE = True
except ImportError as e:
    print(f"⚠️ PaddleOCR not installed: {e}")
    PADDLE_AVAILABLE = False
    HAS_PPSTRUCTURE = False
    # Fallback imports for type hints
    try:
        import numpy as np
    except ImportError:
        np = None

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

@dataclass
class FinancialSecurity:
    """Structure for financial security data"""
    isin: Optional[str] = None
    name: Optional[str] = None
    symbol: Optional[str] = None
    quantity: Optional[float] = None
    price: Optional[float] = None
    market_value: Optional[float] = None
    currency: Optional[str] = None
    percentage: Optional[float] = None

@dataclass
class ExtractionResult:
    """Complete extraction result"""
    success: bool
    document_type: str
    institution: str
    total_value: float
    securities: List[FinancialSecurity]
    accounts: List[Dict[str, Any]]
    tables: List[Dict[str, Any]]
    full_text: str
    confidence: float
    processing_time: float
    errors: List[str]
    raw_data: Dict[str, Any]

class FinancialPDFExtractor:
    """
    Complete financial PDF extraction using PaddleOCR 3.0 PP-StructureV3
    Designed for ANY financial institution and document type
    """
    
    def __init__(self):
        """Initialize PaddleOCR components"""
        self.paddle_available = PADDLE_AVAILABLE
        
        if self.paddle_available:
            try:
                # Initialize structure parser if available
                self.structure_parser = None
                if HAS_PPSTRUCTURE:
                    try:
                        self.structure_parser = PPStructure(
                            recovery=True,  # Enable reading order recovery
                            save_rebuild_result=True,  # Save results
                        )
                        logger.info("✅ PPStructure initialized")
                    except Exception as e:
                        logger.warning(f"⚠️ PPStructure initialization failed: {e}")
                
                # Initialize OCR for text extraction
                self.ocr = PaddleOCR(
                    use_angle_cls=True, 
                    lang='en'
                )
                
                logger.info("✅ PaddleOCR 3.0 initialized successfully")
                
            except Exception as e:
                logger.error(f"❌ PaddleOCR initialization failed: {e}")
                self.paddle_available = False
        else:
            logger.warning("❌ PaddleOCR not available - install with: pip install paddlepaddle paddleocr pdf2image")
    
    async def extract_financial_data(self, pdf_path: str, output_dir: str = "extracted_data") -> ExtractionResult:
        """
        Extract ALL financial data from PDF
        
        Args:
            pdf_path: Path to the financial PDF
            output_dir: Directory to save results
            
        Returns:
            Complete financial data extraction
        """
        start_time = datetime.now()
        
        try:
            logger.info(f"🔍 Processing financial PDF: {pdf_path}")
            
            if not self.paddle_available:
                return ExtractionResult(
                    success=False,
                    document_type="unknown",
                    institution="unknown",
                    total_value=0.0,
                    securities=[],
                    accounts=[],
                    tables=[],
                    full_text="",
                    confidence=0.0,
                    processing_time=0.0,
                    errors=["PaddleOCR not available"],
                    raw_data={}
                )
            
            # Create output directory
            Path(output_dir).mkdir(exist_ok=True)
            
            # Convert PDF to images
            images = self._pdf_to_images(pdf_path)
            
            # Process all pages
            all_text = ""
            all_tables = []
            all_securities = []
            all_accounts = []
            total_confidence = 0.0
            raw_data = {"pages": [], "metadata": self._get_file_metadata(pdf_path)}
            
            for page_num, image in enumerate(images):
                logger.info(f"📄 Processing page {page_num + 1}/{len(images)}")
                
                # Process page with PaddleOCR
                if np is not None:
                    page_result = await self._process_page(np.array(image), page_num + 1)
                else:
                    page_result = await self._process_page(image, page_num + 1)
                
                # Aggregate results
                all_text += page_result.get("full_text", "") + "\n"
                all_tables.extend(page_result.get("tables", []))
                all_securities.extend(page_result.get("securities", []))
                all_accounts.extend(page_result.get("accounts", []))
                total_confidence += page_result.get("confidence", 0.0)
                
                raw_data["pages"].append(page_result)
            
            # Calculate totals and analyze
            total_value = sum(sec.market_value for sec in all_securities if sec.market_value)
            avg_confidence = total_confidence / len(images) if images else 0.0
            
            # Identify document and institution
            document_type = self._identify_document_type(all_text)
            institution = self._identify_institution(all_text)
            
            # Create final result
            result = ExtractionResult(
                success=True,
                document_type=document_type,
                institution=institution,
                total_value=total_value,
                securities=all_securities,
                accounts=all_accounts,
                tables=all_tables,
                full_text=all_text.strip(),
                confidence=avg_confidence,
                processing_time=(datetime.now() - start_time).total_seconds(),
                errors=[],
                raw_data=raw_data
            )
            
            # Save results
            await self._save_results(result, output_dir)
            
            logger.info(f"✅ Extraction complete: {len(all_securities)} securities, ${total_value:,.2f} total value")
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Extraction failed: {e}")
            return ExtractionResult(
                success=False,
                document_type="error",
                institution="error",
                total_value=0.0,
                securities=[],
                accounts=[],
                tables=[],
                full_text="",
                confidence=0.0,
                processing_time=(datetime.now() - start_time).total_seconds(),
                errors=[str(e)],
                raw_data={}
            )
    
    def _pdf_to_images(self, pdf_path: str) -> List:
        """Convert PDF pages to images"""
        try:
            images = convert_from_path(pdf_path, dpi=300, fmt='PNG')
            logger.info(f"📄 Converted {len(images)} pages to images")
            return images
        except Exception as e:
            logger.error(f"❌ PDF conversion failed: {e}")
            raise
    
    async def _process_page(self, image: Any, page_num: int) -> Dict[str, Any]:
        """Process single page with complete analysis"""
        try:
            # Structure analysis if available
            structure_result = None
            if self.structure_parser:
                try:
                    structure_result = self.structure_parser(image)
                except Exception as e:
                    logger.warning(f"Structure analysis failed: {e}")
            
            # OCR for comprehensive text
            ocr_result = self.ocr.ocr(image, cls=True)
            
            page_data = {
                "page_number": page_num,
                "full_text": "",
                "tables": [],
                "securities": [],
                "accounts": [],
                "confidence": 0.0
            }
            
            # Process structure results if structure parser is available
            if self.structure_parser and structure_result:
                try:
                    if len(structure_result) > 0:
                        for region in structure_result[0]:
                            region_type = region.get('type', 'unknown')
                            
                            if region_type == 'table':
                                table_data = self._extract_table_financial_data(region)
                                if table_data:
                                    page_data["tables"].append(table_data["table_info"])
                                    page_data["securities"].extend(table_data["securities"])
                                    page_data["accounts"].extend(table_data["accounts"])
                            
                            # Extract text from all regions
                            text_content = self._extract_text_from_region(region)
                            if text_content:
                                page_data["full_text"] += text_content + " "
                except Exception as e:
                    logger.warning(f"Structure processing failed: {e}")
            
            # Process OCR results
            if ocr_result and ocr_result[0]:
                total_confidence = 0.0
                text_count = 0
                
                for line in ocr_result[0]:
                    if line and len(line) >= 2:
                        coords, (text, confidence) = line
                        page_data["full_text"] += text + " "
                        total_confidence += confidence
                        text_count += 1
                
                page_data["confidence"] = total_confidence / max(text_count, 1)
            
            # Extract additional financial entities from text
            text_entities = self._extract_financial_entities_from_text(page_data["full_text"])
            page_data["securities"].extend(text_entities.get("securities", []))
            page_data["accounts"].extend(text_entities.get("accounts", []))
            
            return page_data
            
        except Exception as e:
            logger.error(f"❌ Page {page_num} processing failed: {e}")
            return {"page_number": page_num, "error": str(e)}
    
    def _extract_table_financial_data(self, table_region: Dict) -> Optional[Dict[str, Any]]:
        """Extract financial data from table region"""
        try:
            # Get table HTML
            html_content = table_region.get('res', {}).get('html', '')
            if not html_content:
                return None
            
            # Parse HTML to structured data
            try:
                tables = pd.read_html(html_content)
                if not tables:
                    return None
                
                table_array = tables[0].fillna('').values.tolist()
            except:
                return None
            
            # Analyze table for financial data
            result = {
                "table_info": {
                    "coordinates": table_region.get('bbox', []),
                    "confidence": table_region.get('confidence', 0.0),
                    "rows": len(table_array),
                    "columns": len(table_array[0]) if table_array else 0,
                    "data": table_array[:5]  # Sample data
                },
                "securities": [],
                "accounts": []
            }
            
            if len(table_array) < 2:
                return result
            
            # Assume first row is headers
            headers = [str(cell).strip().lower() for cell in table_array[0]]
            
            # Process each data row
            for row in table_array[1:]:
                if len(row) < 2:
                    continue
                
                # Extract security data
                security = self._extract_security_from_row(headers, row)
                if security:
                    result["securities"].append(security)
                
                # Extract account data
                account = self._extract_account_from_row(headers, row)
                if account:
                    result["accounts"].append(account)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Table extraction failed: {e}")
            return None
    
    def _extract_security_from_row(self, headers: List[str], row: List) -> Optional[FinancialSecurity]:
        """Extract security information from table row"""
        security = FinancialSecurity()
        found_data = False
        
        # Map headers to row data
        row_data = {}
        for i, header in enumerate(headers):
            if i < len(row):
                row_data[header] = str(row[i]).strip()
        
        # Extract based on header names
        for header, value in row_data.items():
            if not value or value in ['', 'nan', 'None']:
                continue
            
            # ISIN detection
            if any(term in header for term in ['isin', 'identifier']) or self._is_isin(value):
                security.isin = value
                found_data = True
            
            # Security name
            elif any(term in header for term in ['name', 'security', 'description', 'instrument']):
                if len(value) > 2:
                    security.name = value
                    found_data = True
            
            # Symbol/Ticker
            elif any(term in header for term in ['symbol', 'ticker', 'code']):
                security.symbol = value
                found_data = True
            
            # Quantity
            elif any(term in header for term in ['quantity', 'shares', 'units', 'qty', 'amount']):
                qty = self._extract_number(value)
                if qty is not None:
                    security.quantity = qty
                    found_data = True
            
            # Price
            elif any(term in header for term in ['price', 'unit_price', 'cost_price', 'unit_cost']):
                price = self._extract_currency_amount(value)
                if price is not None:
                    security.price = price
                    found_data = True
            
            # Market value
            elif any(term in header for term in ['value', 'market_value', 'total_value', 'market_val', 'total']):
                market_val = self._extract_currency_amount(value)
                if market_val is not None:
                    security.market_value = market_val
                    found_data = True
            
            # Currency
            elif any(term in header for term in ['currency', 'ccy']):
                security.currency = value
                found_data = True
            
            # Percentage
            elif any(term in header for term in ['percentage', 'percent', '%', 'weight']):
                pct = self._extract_percentage(value)
                if pct is not None:
                    security.percentage = pct
                    found_data = True
        
        # Also scan row for ISIN patterns even without headers
        for cell in row:
            cell_str = str(cell).strip()
            if self._is_isin(cell_str) and not security.isin:
                security.isin = cell_str
                found_data = True
        
        return security if found_data else None
    
    def _extract_account_from_row(self, headers: List[str], row: List) -> Optional[Dict[str, Any]]:
        """Extract account information from table row"""
        account = {}
        
        row_data = {}
        for i, header in enumerate(headers):
            if i < len(row):
                row_data[header] = str(row[i]).strip()
        
        for header, value in row_data.items():
            if not value or value in ['', 'nan', 'None']:
                continue
            
            # Account number
            if any(term in header for term in ['account', 'acct']) and re.search(r'\d', value):
                account['account_number'] = value
            
            # Account type
            elif any(term in header for term in ['type', 'category']):
                account['account_type'] = value
        
        return account if account else None
    
    def _extract_text_from_region(self, region: Dict) -> str:
        """Extract text from structure region"""
        if 'res' in region:
            res = region['res']
            if isinstance(res, dict):
                return res.get('text', '')
            elif isinstance(res, str):
                return res
        return ""
    
    def _extract_financial_entities_from_text(self, text: str) -> Dict[str, List]:
        """Extract financial entities from plain text"""
        entities = {"securities": [], "accounts": []}
        
        # Find ISIN codes in text
        isin_pattern = r'\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b'
        isin_matches = re.findall(isin_pattern, text)
        
        for isin in isin_matches:
            security = FinancialSecurity(isin=isin)
            entities["securities"].append(security)
        
        # Find account numbers
        account_pattern = r'\b(\d{8,12})\b'
        account_matches = re.findall(account_pattern, text)
        
        for account_num in account_matches:
            account = {"account_number": account_num}
            entities["accounts"].append(account)
        
        return entities
    
    # Helper functions
    def _is_isin(self, text: str) -> bool:
        """Check if text is ISIN format"""
        return bool(re.match(r'^[A-Z]{2}[A-Z0-9]{9}[0-9]$', text.strip()))
    
    def _extract_number(self, text: str) -> Optional[float]:
        """Extract numeric value from text"""
        try:
            clean_text = re.sub(r'[,\s]', '', str(text))
            match = re.search(r'([\d.]+)', clean_text)
            return float(match.group(1)) if match else None
        except:
            return None
    
    def _extract_currency_amount(self, text: str) -> Optional[float]:
        """Extract currency amount from text"""
        try:
            # Remove currency symbols and commas
            clean_text = re.sub(r'[\$£€¥,\s()]', '', str(text))
            # Handle negative numbers in parentheses
            if '(' in str(text) and ')' in str(text):
                clean_text = '-' + clean_text
            match = re.search(r'([\d.]+)', clean_text)
            return float(match.group(1)) if match else None
        except:
            return None
    
    def _extract_percentage(self, text: str) -> Optional[float]:
        """Extract percentage from text"""
        try:
            clean_text = re.sub(r'[%,\s]', '', str(text))
            match = re.search(r'([\d.]+)', clean_text)
            return float(match.group(1)) if match else None
        except:
            return None
    
    def _identify_document_type(self, text: str) -> str:
        """Identify financial document type"""
        text_lower = text.lower()
        
        if any(term in text_lower for term in ['portfolio', 'holdings', 'positions']):
            return "portfolio_statement"
        elif any(term in text_lower for term in ['trade', 'transaction', 'confirmation']):
            return "trade_confirmation"
        elif any(term in text_lower for term in ['statement', 'account summary']):
            return "account_statement"
        elif any(term in text_lower for term in ['performance', 'report']):
            return "performance_report"
        else:
            return "financial_document"
    
    def _identify_institution(self, text: str) -> str:
        """Identify financial institution"""
        text_lower = text.lower()
        
        institutions = {
            'cornerstone': 'Cornerstone Bank',
            'schwab': 'Charles Schwab',
            'fidelity': 'Fidelity',
            'vanguard': 'Vanguard',
            'merrill': 'Merrill Lynch',
            'morgan stanley': 'Morgan Stanley',
            'wells fargo': 'Wells Fargo',
            'bank of america': 'Bank of America',
            'chase': 'JPMorgan Chase',
            'goldman sachs': 'Goldman Sachs'
        }
        
        for key, name in institutions.items():
            if key in text_lower:
                return name
        
        return "Unknown Institution"
    
    def _get_file_metadata(self, pdf_path: str) -> Dict[str, Any]:
        """Get file metadata"""
        return {
            "filename": Path(pdf_path).name,
            "file_size": os.path.getsize(pdf_path) if os.path.exists(pdf_path) else 0,
            "processing_date": datetime.now().isoformat()
        }
    
    async def _save_results(self, result: ExtractionResult, output_dir: str):
        """Save extraction results to files"""
        try:
            # Convert result to dict for JSON serialization
            result_dict = {
                "success": result.success,
                "document_type": result.document_type,
                "institution": result.institution,
                "total_value": result.total_value,
                "securities": [
                    {
                        "isin": sec.isin,
                        "name": sec.name,
                        "symbol": sec.symbol,
                        "quantity": sec.quantity,
                        "price": sec.price,
                        "market_value": sec.market_value,
                        "currency": sec.currency,
                        "percentage": sec.percentage
                    } for sec in result.securities
                ],
                "accounts": result.accounts,
                "tables": result.tables,
                "full_text": result.full_text,
                "confidence": result.confidence,
                "processing_time": result.processing_time,
                "errors": result.errors,
                "raw_data": result.raw_data
            }
            
            # Save complete results as JSON
            output_file = Path(output_dir) / "financial_extraction_results.json"
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(result_dict, f, indent=2, ensure_ascii=False, default=str)
            
            # Save securities as CSV
            if result.securities:
                securities_df = pd.DataFrame([
                    {
                        "ISIN": sec.isin,
                        "Name": sec.name,
                        "Symbol": sec.symbol,
                        "Quantity": sec.quantity,
                        "Price": sec.price,
                        "Market_Value": sec.market_value,
                        "Currency": sec.currency,
                        "Percentage": sec.percentage
                    } for sec in result.securities
                ])
                securities_df.to_csv(Path(output_dir) / "securities.csv", index=False)
            
            logger.info(f"✅ Results saved to {output_dir}")
            
        except Exception as e:
            logger.error(f"❌ Failed to save results: {e}")

# Example usage and testing
async def main():
    """Example usage of the Financial PDF Extractor"""
    
    print("🏦 FinanceAI Pro - PaddleOCR Financial PDF Extractor")
    print("=" * 60)
    
    # Initialize extractor
    extractor = FinancialPDFExtractor()
    
    if not extractor.paddle_available:
        print("❌ PaddleOCR not available!")
        print("📦 Install with: pip install paddlepaddle paddleocr pdf2image opencv-python pandas")
        return
    
    # Example PDF processing
    pdf_path = "sample_financial_document.pdf"  # Replace with your PDF
    
    if not os.path.exists(pdf_path):
        print(f"📄 Sample PDF not found: {pdf_path}")
        print("📁 Place your financial PDF in the same directory and update the path")
        return
    
    try:
        print(f"🔍 Processing: {pdf_path}")
        
        # Extract financial data
        result = await extractor.extract_financial_data(pdf_path, "output")
        
        if result.success:
            print("\n✅ EXTRACTION SUCCESSFUL!")
            print(f"🏦 Institution: {result.institution}")
            print(f"📄 Document Type: {result.document_type}")
            print(f"💰 Total Portfolio Value: ${result.total_value:,.2f}")
            print(f"📊 Securities Found: {len(result.securities)}")
            print(f"🏧 Accounts Found: {len(result.accounts)}")
            print(f"📋 Tables Processed: {len(result.tables)}")
            print(f"⚡ Processing Time: {result.processing_time:.2f} seconds")
            print(f"🎯 Confidence: {result.confidence:.1%}")
            
            # Show sample securities
            if result.securities:
                print("\n📈 SAMPLE SECURITIES:")
                for i, security in enumerate(result.securities[:5]):
                    print(f"  {i+1}. {security.name or 'Unknown'}")
                    if security.isin:
                        print(f"     ISIN: {security.isin}")
                    if security.quantity and security.price:
                        print(f"     Qty: {security.quantity:,.0f} @ ${security.price:.2f}")
                    if security.market_value:
                        print(f"     Value: ${security.market_value:,.2f}")
                    print()
            
            print(f"💾 Results saved to: output/")
            
        else:
            print("❌ EXTRACTION FAILED!")
            for error in result.errors:
                print(f"   Error: {error}")
                
    except Exception as e:
        print(f"❌ Processing failed: {e}")

if __name__ == "__main__":
    asyncio.run(main())