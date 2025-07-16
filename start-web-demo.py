# Simple script to show the web demo
import webbrowser
import os
import time

def show_web_demo():
    print("=" * 80)
    print("🌐 PHASE 3 WEB DEMO - LOCAL PREVIEW")
    print("=" * 80)
    print("This shows how the system would look when deployed to the web!")
    print()
    
    # Path to the HTML file
    html_file = os.path.abspath("web-demo-simple.html")
    
    print(f"Opening web demo: {html_file}")
    print()
    print("Features demonstrated:")
    print("✓ Modern web interface")
    print("✓ Real-time processing visualization")
    print("✓ Interactive buttons for demo vs full extraction")
    print("✓ Beautiful results display")
    print("✓ Professional UI ready for production")
    print()
    print("You'll see:")
    print("• Demo mode: Shows 4 securities with 99.5% accuracy")
    print("• Full mode: Simulates extracting all 38-41 securities")
    print("• Processing animations and progress bars")
    print("• Professional portfolio display")
    print()
    
    try:
        # Open in default browser
        webbrowser.open(f"file:///{html_file}")
        print("✅ Web demo opened in your default browser!")
        print()
        print("Click the buttons to see:")
        print("• '🚀 Start Phase 3 Demo' - Shows 4 test securities with 99.5% accuracy")
        print("• '📊 Extract ALL Securities' - Simulates full 41-security extraction")
        print()
        print("This demonstrates exactly how it would work when deployed!")
        
    except Exception as e:
        print(f"❌ Error opening browser: {e}")
        print(f"Manual option: Open this file in your browser:")
        print(f"file:///{html_file}")

if __name__ == "__main__":
    show_web_demo()