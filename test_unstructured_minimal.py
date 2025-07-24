import sys
import os

try:
    # Change to UTF-8 encoding
    import locale
    print(f"System encoding: {locale.getpreferredencoding()}")
    
    # Test import step by step
    print("Step 1: Testing unstructured import...")
    import unstructured
    print("OK")
    
    print("Step 2: Testing partition import...")
    from unstructured.partition.auto import partition
    print("OK")
    
    print("Step 3: Creating test file...")
    with open("simple.txt", "w", encoding="utf-8") as f:
        f.write("Test ISIN: CH1234567890")
    print("OK")
    
    print("Step 4: Testing partition on text...")
    elements = partition("simple.txt")
    print(f"OK - Found {len(elements)} elements")
    
    print("SUCCESS: Unstructured is working!")
    
except Exception as e:
    print(f"ERROR: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()