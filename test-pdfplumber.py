import pdfplumber
import json
import re
import sys
import traceback

def extract_pdf_data(pdf_path):
    try:
        data = {
            "metadata": {},
            "tables": [],
            "securities": [],
            "all_text": []
        }
        
        with pdfplumber.open(pdf_path) as pdf:
            print(f"Processing {len(pdf.pages)} pages...", file=sys.stderr)
            
            data["metadata"]["pages"] = len(pdf.pages)
            
            # Extract ISINs pattern
            isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b'
            all_isins = set()
            
            for page_num, page in enumerate(pdf.pages):
                page_text = page.extract_text()
                if page_text:
                    data["all_text"].append(page_text)
                    
                    # Find ISINs
                    isins = re.findall(isin_pattern, page_text)
                    all_isins.update(isins)
                    
                    # Extract tables
                    tables = page.extract_tables()
                    if tables:
                        for table_idx, table in enumerate(tables):
                            if table:
                                data["tables"].append({
                                    "page": page_num + 1,
                                    "table_index": table_idx,
                                    "rows": len(table),
                                    "data": table[:5]  # First 5 rows for preview
                                })
            
            # Add securities
            for isin in all_isins:
                data["securities"].append({
                    "isin": isin,
                    "type": "Bond" if isin.startswith("XS") else "Other"
                })
            
            print(f"Found {len(all_isins)} ISINs", file=sys.stderr)
            print(f"Found {len(data['tables'])} tables", file=sys.stderr)
            
            return data
            
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        traceback.print_exc(file=sys.stderr)
        return {"error": str(e)}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test-pdfplumber.py <pdf_path>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    result = extract_pdf_data(pdf_path)
    
    # Print JSON to stdout
    print(json.dumps(result, indent=2))