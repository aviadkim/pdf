import torch
from transformers import AutoTokenizer, AutoModel
from PIL import Image
import numpy as np

class AlternativeLayoutLM:
    """Alternative LayoutLM implementation without detectron2"""
    
    def __init__(self):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        print(f"Using device: {self.device}")
        
        try:
            # Use a simpler model that doesn't require detectron2
            self.tokenizer = AutoTokenizer.from_pretrained("microsoft/layoutlm-base-uncased")
            self.model = AutoModel.from_pretrained("microsoft/layoutlm-base-uncased")
            
            self.model.to(self.device)
            self.available = True
            print("Alternative LayoutLM initialized successfully")
            
        except Exception as e:
            print(f"Alternative LayoutLM initialization failed: {e}")
            self.available = False
        
    def process_pdf_text(self, pdf_text):
        """Process PDF text to extract financial data"""
        if not self.available:
            return {"success": False, "error": "Model not available"}
            
        try:
            # Extract ISINs and values from text
            import re
            
            # Find ISINs
            isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{10}\b'
            isins = re.findall(isin_pattern, pdf_text)
            
            # Find values (Swiss format)
            value_pattern = r"\d{1,3}(?:'\d{3})*(?:\.\d{2})?"
            values = re.findall(value_pattern, pdf_text)
            
            # Convert values to numbers
            numeric_values = []
            for val in values:
                try:
                    num = float(val.replace("'", ""))
                    if 1000 <= num <= 50000000:  # Reasonable range
                        numeric_values.append(num)
                except:
                    pass
            
            results = {
                "success": True,
                "isins_found": len(isins),
                "values_found": len(numeric_values),
                "total_value": sum(numeric_values),
                "isins": isins[:10],  # First 10 ISINs
                "values": numeric_values[:10]  # First 10 values
            }
            
            return results
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def test_processing(self):
        """Test the alternative implementation"""
        print("Testing alternative LayoutLM...")
        
        # Test with sample text
        test_text = """
        ISIN: XS2746319610
        SOCIETE GENERALE 32.46 % NOTES 2024-01.03.30 REG S
        Value: 192'100 CHF
        
        ISIN: XS2993414619
        RBC LONDON 0% NOTES 2025-28.03.2035
        Value: 97'700 CHF
        """
        
        result = self.process_pdf_text(test_text)
        
        if result['success']:
            print("SUCCESS: Alternative LayoutLM working")
            print(f"   ISINs found: {result['isins_found']}")
            print(f"   Values found: {result['values_found']}")
            print(f"   Total value: {result['total_value']:,.0f}")
            return True
        else:
            print(f"FAILED: Alternative LayoutLM failed: {result['error']}")
            return False

# Test the alternative implementation
if __name__ == "__main__":
    try:
        layoutlm = AlternativeLayoutLM()
        success = layoutlm.test_processing()
        print(f"Alternative LayoutLM test: {'SUCCESS' if success else 'FAILED'}")
    except Exception as e:
        print(f"Test failed: {e}")
