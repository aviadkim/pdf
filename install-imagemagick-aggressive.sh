#!/bin/bash
# AGGRESSIVE ImageMagick installation for Render - Multiple approaches
echo "🔥 AGGRESSIVE ImageMagick installation starting..."

# Function to test if ImageMagick/GraphicsMagick is working
test_imagemagick() {
    echo "🧪 Testing ImageMagick/GraphicsMagick..."
    
    if command -v convert &> /dev/null; then
        echo "✅ convert command found"
        if convert -version &> /dev/null; then
            echo "✅ convert working"
            return 0
        fi
    fi
    
    if command -v gm &> /dev/null; then
        echo "✅ gm command found"
        if gm version &> /dev/null; then
            echo "✅ gm working"
            return 0
        fi
    fi
    
    if command -v magick &> /dev/null; then
        echo "✅ magick command found"
        if magick -version &> /dev/null; then
            echo "✅ magick working"
            return 0
        fi
    fi
    
    echo "❌ No working ImageMagick/GraphicsMagick found"
    return 1
}

# Initial test
if test_imagemagick; then
    echo "🎉 ImageMagick already working - exiting"
    exit 0
fi

echo "🔧 Starting aggressive installation..."

# Approach 1: Standard package installation
echo "📦 Approach 1: Standard packages..."
if command -v apt-get &> /dev/null; then
    echo "Using apt-get..."
    apt-get update -y
    apt-get install -y \
        imagemagick \
        graphicsmagick \
        ghostscript \
        poppler-utils \
        libmagickwand-dev \
        libmagickcore-dev \
        libgraphicsmagick++1-dev \
        libwebp-dev \
        libjpeg-dev \
        libpng-dev \
        libtiff-dev
elif command -v apk &> /dev/null; then
    echo "Using apk..."
    apk add --no-cache \
        imagemagick \
        imagemagick-dev \
        graphicsmagick \
        ghostscript \
        poppler-utils
fi

test_imagemagick && echo "✅ Approach 1 successful" && exit 0

# Approach 2: Alternative package names
echo "📦 Approach 2: Alternative packages..."
if command -v apt-get &> /dev/null; then
    apt-get install -y \
        imagemagick-6.q16 \
        imagemagick-6.q16-dev \
        graphicsmagick-imagemagick-compat \
        imagemagick-common
elif command -v apk &> /dev/null; then
    apk add --no-cache \
        imagemagick6 \
        imagemagick6-dev
fi

test_imagemagick && echo "✅ Approach 2 successful" && exit 0

# Approach 3: Force installation with --fix-missing
echo "📦 Approach 3: Force installation..."
if command -v apt-get &> /dev/null; then
    apt-get install -y --fix-missing \
        imagemagick \
        graphicsmagick
fi

test_imagemagick && echo "✅ Approach 3 successful" && exit 0

# Approach 4: Manual binary download and installation
echo "📦 Approach 4: Manual installation..."
cd /tmp

# Download and install portable ImageMagick
echo "Downloading portable ImageMagick..."
if command -v wget &> /dev/null; then
    wget -q https://imagemagick.org/archive/binaries/magick -O /usr/local/bin/magick || true
    wget -q https://github.com/ImageMagick/ImageMagick/releases/download/7.1.1-15/ImageMagick-7.1.1-15-portable-Q16-x64.tar.gz -O imagemagick.tar.gz || true
elif command -v curl &> /dev/null; then
    curl -sL https://imagemagick.org/archive/binaries/magick -o /usr/local/bin/magick || true
    curl -sL https://github.com/ImageMagick/ImageMagick/releases/download/7.1.1-15/ImageMagick-7.1.1-15-portable-Q16-x64.tar.gz -o imagemagick.tar.gz || true
fi

# Make magick executable
chmod +x /usr/local/bin/magick || true

# Create symlinks
ln -sf /usr/local/bin/magick /usr/local/bin/convert || true
ln -sf /usr/local/bin/magick /usr/local/bin/identify || true

test_imagemagick && echo "✅ Approach 4 successful" && exit 0

# Approach 5: System-specific fixes
echo "📦 Approach 5: System fixes..."

# Update PATH
export PATH="/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:$PATH"

# Create missing symlinks
if [ -f /usr/bin/gm ]; then
    ln -sf /usr/bin/gm /usr/local/bin/convert || true
    ln -sf /usr/bin/gm /usr/local/bin/identify || true
fi

if [ -f /usr/bin/convert ]; then
    ln -sf /usr/bin/convert /usr/local/bin/convert || true
fi

# Fix library paths
export LD_LIBRARY_PATH="/usr/lib:/usr/local/lib:$LD_LIBRARY_PATH"

test_imagemagick && echo "✅ Approach 5 successful" && exit 0

# Final test and report
echo "🏁 Final test..."
if test_imagemagick; then
    echo "🎉 SUCCESS: ImageMagick is now working!"
    
    # Show what we have
    echo "📋 Available commands:"
    command -v convert && echo "  ✅ convert"
    command -v gm && echo "  ✅ gm" 
    command -v magick && echo "  ✅ magick"
    command -v identify && echo "  ✅ identify"
    
    # Test with node
    echo "🧪 Testing with Node.js..."
    node -e "
    try {
        const gm = require('gm');
        console.log('✅ gm module loads');
        
        // Test basic functionality
        gm('/dev/null').identify((err, data) => {
            if (err && !err.message.includes('No such file')) {
                console.log('❌ gm test failed:', err.message);
                process.exit(1);
            } else {
                console.log('✅ gm functionality working');
                process.exit(0);
            }
        });
    } catch (error) {
        console.log('❌ gm module error:', error.message);
        process.exit(1);
    }
    " && echo "✅ Node.js integration working"
    
    exit 0
else
    echo "❌ FAILED: Could not install working ImageMagick"
    echo "📋 System information:"
    echo "  OS: $(uname -a)"
    echo "  Available package managers:"
    command -v apt-get && echo "    ✅ apt-get"
    command -v apk && echo "    ✅ apk"
    command -v yum && echo "    ✅ yum"
    echo "  PATH: $PATH"
    echo "  Files in /usr/bin:"
    ls -la /usr/bin/*magick* /usr/bin/gm /usr/bin/convert 2>/dev/null || echo "    None found"
    exit 1
fi