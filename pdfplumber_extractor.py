
import pdfplumber
import json
import sys
import re
from pathlib import Path

class SwissFinancialExtractor:
    def __init__(self, pdf_path):
        self.pdf_path = pdf_path
        self.data = {
            "metadata": {},
            "tables": [],
            "text_blocks": [],
            "securities": [],
            "portfolio_summary": {},
            "raw_text": []
        }
        
    def parse_swiss_number(self, text):
        """Parse Swiss number format (e.g., 1'234'567.89)"""
        if not text:
            return None
        # Remove spaces and convert apostrophes
        cleaned = str(text).replace("'", "").replace(" ", "").replace(",", ".")
        try:
            return float(cleaned)
        except:
            return None
    
    def extract_isin(self, text):
        """Extract ISIN codes from text"""
        isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b'
        return re.findall(isin_pattern, str(text))
    
    def extract_all_data(self):
        """Main extraction method"""
        with pdfplumber.open(self.pdf_path) as pdf:
            # Metadata
            self.data["metadata"] = {
                "pages": len(pdf.pages),
                "file_path": str(self.pdf_path)
            }
            
            all_isins = set()
            all_text = []
            
            # Process each page
            for page_num, page in enumerate(pdf.pages):
                print(f"Processing page {page_num + 1}...")
                
                # Extract text
                page_text = page.extract_text()
                if page_text:
                    all_text.append(page_text)
                    # Find ISINs in text
                    isins_in_page = self.extract_isin(page_text)
                    all_isins.update(isins_in_page)
                
                # Extract tables with settings for financial documents
                tables = page.extract_tables(table_settings={
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                    "explicit_vertical_lines": [],
                    "explicit_horizontal_lines": [],
                    "snap_tolerance": 3,
                    "join_tolerance": 3,
                    "edge_min_length": 3,
                    "min_words_vertical": 2,
                    "min_words_horizontal": 1,
                    "text_tolerance": 3,
                    "text_x_tolerance": None,
                    "text_y_tolerance": None,
                    "intersection_tolerance": 3,
                    "intersection_x_tolerance": None,
                    "intersection_y_tolerance": None
                })
                
                if tables:
                    for table_idx, table in enumerate(tables):
                        if table and len(table) > 0:
                            # Process table data
                            processed_table = []
                            for row in table:
                                processed_row = []
                                for cell in row:
                                    if cell:
                                        # Check for ISINs in cells
                                        cell_isins = self.extract_isin(cell)
                                        all_isins.update(cell_isins)
                                        processed_row.append(str(cell).strip())
                                    else:
                                        processed_row.append("")
                                processed_table.append(processed_row)
                            
                            self.data["tables"].append({
                                "page": page_num + 1,
                                "table_index": table_idx,
                                "data": processed_table,
                                "rows": len(processed_table),
                                "columns": len(processed_table[0]) if processed_table else 0
                            })
                
                # Extract text blocks with positions
                chars = page.chars
                if chars:
                    current_line = []
                    current_y = None
                    
                    for char in chars:
                        if current_y is None or abs(char['y0'] - current_y) < 2:
                            current_line.append(char)
                            current_y = char['y0']
                        else:
                            if current_line:
                                text = ''.join([c['text'] for c in current_line])
                                self.data["text_blocks"].append({
                                    "page": page_num + 1,
                                    "text": text.strip(),
                                    "x": current_line[0]['x0'],
                                    "y": current_line[0]['y0'],
                                    "width": current_line[-1]['x1'] - current_line[0]['x0'],
                                    "height": current_line[-1]['y1'] - current_line[0]['y0']
                                })
                            current_line = [char]
                            current_y = char['y0']
            
            # Store all text
            self.data["raw_text"] = all_text
            
            # Process securities from ISINs found
            for isin in all_isins:
                self.data["securities"].append({
                    "isin": isin,
                    "type": self.get_security_type(isin)
                })
            
            print(f"Found {len(all_isins)} unique ISINs")
            print(f"Extracted {len(self.data['tables'])} tables")
            
            return self.data
    
    def get_security_type(self, isin):
        """Determine security type from ISIN"""
        if isin.startswith("XS"):
            return "International Bond"
        elif isin.startswith("CH"):
            return "Swiss Security"
        elif isin.startswith("LU"):
            return "Luxembourg Fund"
        else:
            return "Other"

# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python script.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    extractor = SwissFinancialExtractor(pdf_path)
    
    try:
        data = extractor.extract_all_data()
        print(json.dumps(data))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
