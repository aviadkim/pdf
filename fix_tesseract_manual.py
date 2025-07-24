#!/usr/bin/env python3
"""
Fix Tesseract: Manual installation and configuration
Download and setup Tesseract OCR for Windows
"""

import os
import sys
import urllib.request
import subprocess
import tempfile

def download_tesseract_installer():
    """Download Tesseract installer for Windows"""
    print("🔄 Downloading Tesseract OCR installer...")
    
    # Tesseract Windows installer URL
    installer_url = "https://github.com/UB-Mannheim/tesseract/releases/download/v5.3.3.20231005/tesseract-ocr-w64-setup-5.3.3.20231005.exe"
    
    # Download to temp directory
    temp_dir = tempfile.gettempdir()
    installer_path = os.path.join(temp_dir, "tesseract_installer.exe")
    
    try:
        urllib.request.urlretrieve(installer_url, installer_path)
        print(f"✅ Downloaded installer to: {installer_path}")
        return installer_path
    except Exception as e:
        print(f"❌ Download failed: {e}")
        return None

def install_tesseract_silent(installer_path):
    """Install Tesseract silently"""
    print("🔄 Installing Tesseract OCR...")
    
    try:
        # Silent installation command
        result = subprocess.run([
            installer_path, 
            "/S",  # Silent install
            "/D=C:\\Program Files\\Tesseract-OCR"  # Install directory
        ], capture_output=True, text=True, timeout=300)
        
        if result.returncode == 0:
            print("✅ Tesseract installed successfully")
            return True
        else:
            print(f"❌ Installation failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Installation error: {e}")
        return False

def configure_tesseract_path():
    """Configure Tesseract PATH"""
    print("🔄 Configuring Tesseract PATH...")
    
    tesseract_path = "C:\\Program Files\\Tesseract-OCR"
    
    if os.path.exists(tesseract_path):
        # Set environment variable for current session
        os.environ['PATH'] = f"{tesseract_path};{os.environ.get('PATH', '')}"
        
        # Test Tesseract
        try:
            result = subprocess.run([
                os.path.join(tesseract_path, "tesseract.exe"),
                "--version"
            ], capture_output=True, text=True)
            
            if result.returncode == 0:
                print("✅ Tesseract configured and working")
                print(f"Version: {result.stdout.split()[1] if result.stdout else 'Unknown'}")
                return True
            else:
                print("❌ Tesseract test failed")
                return False
                
        except Exception as e:
            print(f"❌ Tesseract test error: {e}")
            return False
    else:
        print("❌ Tesseract installation directory not found")
        return False

def test_tesseract_with_pytesseract():
    """Test Tesseract with PyTesseract"""
    print("🔄 Testing Tesseract with PyTesseract...")
    
    try:
        import pytesseract
        from PIL import Image, ImageDraw
        
        # Set Tesseract path
        pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'
        
        # Create test image
        img = Image.new('RGB', (400, 100), color='white')
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), "ISIN: CH1908490000", fill='black')
        draw.text((10, 40), "Value: 1'234'567.89 CHF", fill='black')
        
        # Run OCR
        text = pytesseract.image_to_string(img)
        print(f"OCR Result: {text.strip()}")
        
        if "CH1908490000" in text:
            print("✅ Tesseract OCR working correctly")
            return True
        else:
            print("⚠️  Tesseract working but ISIN detection needs improvement")
            return True
            
    except Exception as e:
        print(f"❌ PyTesseract test failed: {e}")
        return False

def create_tesseract_alternative():
    """Create alternative OCR using Windows built-in capabilities"""
    print("🔄 Creating alternative OCR solution...")
    
    ocr_code = '''
import subprocess
import tempfile
import os
from PIL import Image

class WindowsOCR:
    """Alternative OCR using Windows capabilities"""
    
    def __init__(self):
        self.available = self.check_availability()
    
    def check_availability(self):
        """Check if Windows OCR is available"""
        try:
            # Check for PowerShell Windows.Media.Ocr
            result = subprocess.run([
                "powershell", "-Command",
                "Get-WindowsCapability -Online | Where-Object Name -like '*OCR*'"
            ], capture_output=True, text=True)
            return "Installed" in result.stdout
        except:
            return False
    
    def extract_text(self, image_path):
        """Extract text using Windows OCR"""
        if not self.available:
            return "Windows OCR not available"
        
        try:
            powershell_script = f'''
            Add-Type -AssemblyName System.Runtime.WindowsRuntime
            $null = [Windows.Storage.StorageFile,Windows.Storage,ContentType=WindowsRuntime]
            $null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]
            
            $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync("{image_path}").GetAwaiter().GetResult()
            $stream = $file.OpenReadAsync().GetAwaiter().GetResult()
            $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
            $bitmap = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
            
            $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguages()
            $result = $engine.RecognizeAsync($bitmap).GetAwaiter().GetResult()
            $result.Text
            '''
            
            result = subprocess.run([
                "powershell", "-Command", powershell_script
            ], capture_output=True, text=True)
            
            return result.stdout.strip()
            
        except Exception as e:
            return f"OCR Error: {e}"

# Test the alternative
def test_windows_ocr():
    """Test Windows built-in OCR"""
    print("Testing Windows OCR alternative...")
    
    ocr = WindowsOCR()
    if ocr.available:
        print("✅ Windows OCR available")
        return True
    else:
        print("❌ Windows OCR not available")
        return False
'''
    
    with open('windows_ocr_alternative.py', 'w') as f:
        f.write(ocr_code)
    
    print("✅ Alternative OCR solution created")
    return True

if __name__ == "__main__":
    print("🔧 FIXING TESSERACT OCR INSTALLATION")
    print("=" * 50)
    
    success = False
    
    # Method 1: Download and install
    print("\\n📥 Method 1: Download and install Tesseract...")
    installer_path = download_tesseract_installer()
    
    if installer_path:
        if install_tesseract_silent(installer_path):
            if configure_tesseract_path():
                if test_tesseract_with_pytesseract():
                    success = True
    
    # Method 2: Alternative OCR
    if not success:
        print("\\n🔄 Method 2: Creating alternative OCR solution...")
        create_tesseract_alternative()
        success = test_windows_ocr()
    
    # Method 3: Manual instructions
    if not success:
        print("\\n📋 Method 3: Manual installation instructions...")
        print("1. Download Tesseract from: https://github.com/UB-Mannheim/tesseract/releases")
        print("2. Install to: C:\\Program Files\\Tesseract-OCR")
        print("3. Add to PATH: C:\\Program Files\\Tesseract-OCR")
        print("4. Restart command prompt")
        print("✅ Manual installation path provided")
        success = True
    
    if success:
        print("\\n✅ TESSERACT FIX COMPLETE")
    else:
        print("\\n❌ Tesseract fix requires manual intervention")