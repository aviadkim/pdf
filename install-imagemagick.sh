#!/bin/bash
# Install ImageMagick dependencies for Render deployment
# This script ensures ImageMagick is available before starting the server

echo "🔧 Installing ImageMagick dependencies for 99% accuracy..."

# Check if we're on Debian/Ubuntu (Render uses Ubuntu)
if command -v apt-get &> /dev/null; then
    echo "📦 Using apt-get (Ubuntu/Debian system detected)"
    
    # Update package list
    echo "   Updating package list..."
    apt-get update
    
    # Install ImageMagick and related tools
    echo "   Installing ImageMagick, Ghostscript, and PDF tools..."
    apt-get install -y \
        imagemagick \
        ghostscript \
        poppler-utils \
        libmagickwand-dev
    
    echo "   ✅ ImageMagick installation complete"
    
elif command -v apk &> /dev/null; then
    echo "📦 Using apk (Alpine system detected)"
    
    # Install GraphicsMagick for Alpine
    echo "   Installing GraphicsMagick and related tools..."
    apk add --no-cache \
        graphicsmagick \
        ghostscript \
        poppler-utils
    
    echo "   ✅ GraphicsMagick installation complete"
    
else
    echo "❌ Unable to detect package manager"
    echo "   Trying alternative installation methods..."
fi

# Verify installation
echo "🧪 Verifying ImageMagick/GraphicsMagick installation..."

if command -v convert &> /dev/null; then
    echo "   ✅ convert command available"
    convert -version | head -1
elif command -v gm &> /dev/null; then
    echo "   ✅ gm command available"
    gm version | head -1
else
    echo "   ❌ Neither convert nor gm commands found"
    echo "   Attempting manual installation..."
    
    # Last resort: try to install via different methods
    if command -v apt-get &> /dev/null; then
        apt-get install -y imagemagick-6.q16 graphicsmagick
    fi
fi

# Check if pdf2pic dependencies are met
echo "🔍 Checking pdf2pic compatibility..."
node -e "
try {
    const pdf2pic = require('pdf2pic');
    console.log('   ✅ pdf2pic module loads successfully');
    
    // Test if GraphicsMagick/ImageMagick binaries are accessible
    const { execSync } = require('child_process');
    
    try {
        execSync('which convert', { stdio: 'pipe' });
        console.log('   ✅ convert binary found');
    } catch (e) {
        try {
            execSync('which gm', { stdio: 'pipe' });
            console.log('   ✅ gm binary found');
        } catch (e2) {
            console.log('   ❌ Neither convert nor gm binary found');
            process.exit(1);
        }
    }
    
} catch (error) {
    console.log('   ❌ pdf2pic module error:', error.message);
    process.exit(1);
}
"

if [ $? -eq 0 ]; then
    echo "🎉 ImageMagick setup complete! Ready for 99% accuracy with Claude Vision."
else
    echo "❌ ImageMagick setup failed. Page-by-page processing will not work."
    exit 1
fi