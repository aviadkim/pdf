#!/usr/bin/env python3
"""
Basic test of Unstructured-IO - no emojis for Windows compatibility
"""

try:
    print("Testing imports...")
    
    # Test basic import
    import unstructured
    print("SUCCESS: Unstructured base import successful")
    
    # Test partition import
    from unstructured.partition.auto import partition
    print("SUCCESS: Partition import successful")
    
    # Test with a simple text file first
    print("\nTesting with simple text...")
    
    # Create a simple test file
    with open("test_simple.txt", "w") as f:
        f.write("This is a test document.\nISIN: CH1234567890\nValue: 1'000'000.00 CHF")
    
    # Test partition on text file
    elements = partition("test_simple.txt")
    print(f"SUCCESS: Partition successful: {len(elements)} elements found")
    
    for i, element in enumerate(elements):
        print(f"   Element {i+1}: {element.category} - {str(element)[:50]}...")
    
    print("\nBasic functionality working. Testing PDF now...")
    
    # Test PDF partition
    pdf_path = "2. Messos  - 31.03.2025.pdf"
    print(f"Testing PDF: {pdf_path}")
    
    # Use fast strategy first to avoid crashes
    pdf_elements = partition(pdf_path, strategy="fast")
    print(f"SUCCESS: PDF partition successful: {len(pdf_elements)} elements found")
    
    # Count element types
    tables = [e for e in pdf_elements if e.category == "Table"]
    text_elements = [e for e in pdf_elements if e.category == "Text"]
    
    print(f"Found:")
    print(f"  - {len(tables)} table elements")
    print(f"  - {len(text_elements)} text elements")
    print(f"  - {len(pdf_elements) - len(tables) - len(text_elements)} other elements")
    
    # Look for ISINs
    import re
    isin_pattern = r'\b[A-Z]{2}[A-Z0-9]{9}[0-9]\b'
    total_isins = 0
    
    for element in pdf_elements:
        isins = re.findall(isin_pattern, str(element.text))
        total_isins += len(isins)
    
    print(f"\nISIN ANALYSIS:")
    print(f"  - Total ISINs found: {total_isins}")
    
    # Show first few elements
    print(f"\nFirst 3 elements:")
    for i, element in enumerate(pdf_elements[:3]):
        print(f"  {i+1}. {element.category}: {str(element)[:100]}...")
    
    print("\nSUCCESS: Unstructured-IO basic test completed!")
    
except ImportError as e:
    print(f"ERROR: Import error: {e}")
except Exception as e:
    print(f"ERROR: {e}")
    import traceback
    traceback.print_exc()