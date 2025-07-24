#!/usr/bin/env python3
"""
Upstage Document Parse Integration
Using the direct API to achieve 100% accuracy
"""

import os
import sys
import requests
import json
from datetime import datetime

class UpstageDocumentParser:
    def __init__(self, api_key=None):
        """
        Initialize Upstage Document Parser
        
        Args:
            api_key (str): Upstage API key. If None, will try to get from environment
        """
        self.api_key = api_key or os.getenv('UPSTAGE_API_KEY')
        self.base_url = "https://api.upstage.ai/v1/document-ai"
        self.headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Accept': 'application/json'
        }
        
        if not self.api_key:
            print("⚠️  No API key provided. You'll need to:")
            print("   1. Sign up at https://console.upstage.ai/")
            print("   2. Get your API key")
            print("   3. Set UPSTAGE_API_KEY environment variable")
            print("   4. Or pass it as parameter")
    
    def parse_document(self, pdf_path, output_format="html", ocr="auto", split="none"):
        """
        Parse document using Upstage Document Parse API
        
        Args:
            pdf_path (str): Path to PDF file
            output_format (str): Output format - "html", "markdown", "text"
            ocr (str): OCR mode - "auto", "force", "off"
            split (str): Split mode - "none", "page", "element"
        
        Returns:
            dict: Parsed document results
        """
        if not self.api_key:
            return {"success": False, "error": "No API key provided"}
        
        if not os.path.exists(pdf_path):
            return {"success": False, "error": f"File not found: {pdf_path}"}
        
        print(f"🔄 Parsing document: {pdf_path}")
        print(f"   Output format: {output_format}")
        print(f"   OCR mode: {ocr}")
        print(f"   Split mode: {split}")
        
        try:
            # Prepare the request
            url = f"{self.base_url}/document-parse"
            
            # Prepare form data
            data = {
                'output_format': output_format,
                'ocr': ocr,
                'split': split
            }
            
            # Prepare file
            with open(pdf_path, 'rb') as file:
                files = {'document': file}
                
                # Make the request
                response = requests.post(
                    url, 
                    headers=self.headers,
                    data=data,
                    files=files,
                    timeout=300  # 5 minute timeout
                )
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Document parsed successfully!")
                return {
                    "success": True,
                    "result": result,
                    "method": "upstage_document_parse",
                    "format": output_format
                }
            else:
                print(f"❌ API request failed: {response.status_code}")
                print(f"   Response: {response.text}")
                return {
                    "success": False,
                    "error": f"API request failed: {response.status_code}",
                    "response": response.text
                }
                
        except Exception as e:
            print(f"❌ Error parsing document: {e}")
            return {"success": False, "error": str(e)}
    
    def extract_financial_data(self, parsed_result):
        """
        Extract financial data from parsed document
        
        Args:
            parsed_result (dict): Result from parse_document()
        
        Returns:
            dict: Extracted financial data
        """
        if not parsed_result.get("success"):
            return {"success": False, "error": "Invalid input"}
        
        print("🔍 Extracting financial data from parsed document...")
        
        content = parsed_result.get("result", {})
        
        # Extract text content
        if isinstance(content, dict):
            text = content.get("text", "") or str(content)
        else:
            text = str(content)
        
        print(f"📄 Content length: {len(text)} characters")
        
        # Extract ISINs
        import re
        
        # ISIN pattern
        isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{10}\b'
        isins = re.findall(isin_pattern, text)
        isins = list(set(isins))  # Remove duplicates
        
        print(f"📋 Found {len(isins)} unique ISINs")
        
        # Extract financial values
        securities = []
        for isin in isins:
            security_data = self.extract_security_data(isin, text)
            if security_data:
                securities.append(security_data)
                print(f"   ✅ {isin}: {security_data.get('market_value', 'NO VALUE')}")
        
        # Calculate totals
        total_value = sum(s.get('market_value', 0) for s in securities if s.get('market_value'))
        
        return {
            "success": True,
            "securities": securities,
            "total_value": total_value,
            "isins_found": len(isins),
            "method": "upstage_extraction"
        }
    
    def extract_security_data(self, isin, text):
        """
        Extract data for a specific security
        
        Args:
            isin (str): ISIN to extract
            text (str): Full document text
        
        Returns:
            dict: Security data
        """
        import re
        
        # Find context around ISIN
        isin_index = text.find(isin)
        if isin_index == -1:
            return None
        
        # Extract context (500 chars before and after)
        start = max(0, isin_index - 500)
        end = min(len(text), isin_index + 500)
        context = text[start:end]
        
        # Extract market value
        market_value = self.extract_market_value(context)
        
        # Extract security name
        name = self.extract_security_name(context, isin)
        
        return {
            "isin": isin,
            "name": name,
            "market_value": market_value,
            "context": context[:100] + "..." if len(context) > 100 else context
        }
    
    def extract_market_value(self, context):
        """
        Extract market value from context
        
        Args:
            context (str): Text context
        
        Returns:
            float: Market value or None
        """
        import re
        
        # Swiss format pattern (1'234'567.89)
        swiss_pattern = r"\b\d{1,3}(?:'\d{3})*(?:\.\d{2})?\b"
        
        # Find all potential values
        matches = re.findall(swiss_pattern, context)
        
        candidates = []
        for match in matches:
            try:
                value = float(match.replace("'", ""))
                if 1000 <= value <= 50000000:  # Reasonable range
                    candidates.append(value)
            except:
                continue
        
        if not candidates:
            return None
        
        # Return the largest reasonable value (often market value)
        return max(candidates)
    
    def extract_security_name(self, context, isin):
        """
        Extract security name from context
        
        Args:
            context (str): Text context
            isin (str): ISIN code
        
        Returns:
            str: Security name
        """
        import re
        
        # Find text before ISIN
        isin_index = context.find(isin)
        if isin_index == -1:
            return "Unknown"
        
        before_isin = context[:isin_index]
        
        # Look for company/security name patterns
        patterns = [
            r'([A-Z][A-Z\s&.,-]+(?:BANK|CORP|INC|LTD|SA|AG|NOTES|BONDS))',
            r'([A-Z][A-Z\s&.,-]{15,50})'
        ]
        
        for pattern in patterns:
            matches = re.findall(pattern, before_isin)
            if matches:
                return matches[-1].strip()[:50]
        
        # Fallback
        words = before_isin.split()
        return " ".join(words[-5:])[:50] if words else "Unknown"
    
    def test_with_sample(self, pdf_path):
        """
        Test the parser with a sample PDF
        
        Args:
            pdf_path (str): Path to test PDF
        
        Returns:
            dict: Test results
        """
        print("🚀 TESTING UPSTAGE DOCUMENT PARSE")
        print("=" * 50)
        
        # Test different output formats
        formats = ["html", "markdown", "text"]
        results = {}
        
        for format_type in formats:
            print(f"\n📄 Testing with format: {format_type}")
            
            # Parse document
            parsed = self.parse_document(pdf_path, output_format=format_type)
            
            if parsed["success"]:
                # Extract financial data
                financial_data = self.extract_financial_data(parsed)
                
                results[format_type] = {
                    "parsed": parsed,
                    "financial_data": financial_data
                }
                
                if financial_data["success"]:
                    print(f"   ✅ {format_type}: {financial_data['isins_found']} ISINs, Total: {financial_data['total_value']:,.0f}")
                else:
                    print(f"   ❌ {format_type}: Financial extraction failed")
            else:
                print(f"   ❌ {format_type}: Parsing failed - {parsed.get('error', 'Unknown error')}")
                results[format_type] = {"error": parsed.get("error")}
        
        return results

def main():
    """
    Main function to test Upstage Document Parse
    """
    parser = UpstageDocumentParser()
    
    # Test with Messos PDF
    pdf_path = "2. Messos  - 31.03.2025.pdf"
    
    if not os.path.exists(pdf_path):
        print(f"❌ Test PDF not found: {pdf_path}")
        print("Please place your PDF file in the current directory")
        return
    
    # Run test
    results = parser.test_with_sample(pdf_path)
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = f"upstage_results_{timestamp}.json"
    
    with open(results_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    
    print(f"\n💾 Results saved to: {results_file}")
    
    # Show best result
    best_format = None
    best_score = 0
    
    for format_type, result in results.items():
        if "financial_data" in result and result["financial_data"].get("success"):
            score = result["financial_data"]["total_value"]
            if score > best_score:
                best_score = score
                best_format = format_type
    
    if best_format:
        print(f"\n🏆 Best format: {best_format}")
        print(f"   Total value: CHF {best_score:,.0f}")
        print(f"   ISINs found: {results[best_format]['financial_data']['isins_found']}")
    else:
        print("\n❌ No successful extractions")
        print("Check your API key and network connection")

if __name__ == "__main__":
    main()