#!/usr/bin/env python3
"""
Simple test of Unstructured-IO - minimal version to avoid crashes
"""

try:
    print("Testing imports...")
    
    # Test basic import
    import unstructured
    print("✅ Unstructured base import successful")
    
    # Test partition import
    from unstructured.partition.auto import partition
    print("✅ Partition import successful")
    
    # Test with a simple text file first
    print("\n📝 Testing with simple text...")
    
    # Create a simple test file
    with open("test_simple.txt", "w") as f:
        f.write("This is a test document.\nISIN: CH1234567890\nValue: 1'000'000.00 CHF")
    
    # Test partition on text file
    elements = partition("test_simple.txt")
    print(f"✅ Partition successful: {len(elements)} elements found")
    
    for i, element in enumerate(elements):
        print(f"   Element {i+1}: {element.category} - {str(element)[:50]}...")
    
    print("\n🎯 Basic functionality working. Ready for PDF test.")
    
except ImportError as e:
    print(f"❌ Import error: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()