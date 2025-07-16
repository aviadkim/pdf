// 🧪 Test Messos PDF with New PaddleOCR Implementation
const fs = require('fs');
const path = require('path');

console.log('🚀 TESTING CLAUDE\'S RECOMMENDED PADDLEOCR WORKFLOW');
console.log('===================================================');
console.log('📋 Method: 100% JSON First, Then Build Tables');
console.log('🎯 Target: 42 holdings from Messos PDF');

async function testPaddleOCRWorkflow() {
    try {
        // Find the correct Messos PDF file
        const messosPath = path.join(__dirname, '2. Messos  - 31.03.2025.pdf');
        
        if (!fs.existsSync(messosPath)) {
            console.log('❌ Messos PDF not found at:', messosPath);
            
            // List available PDF files
            const files = fs.readdirSync(__dirname);
            const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
            
            console.log('\n📁 Available PDF files:');
            pdfFiles.forEach(file => {
                const filePath = path.join(__dirname, file);
                const stats = fs.statSync(filePath);
                console.log(`  📄 ${file} (${Math.round(stats.size / 1024)} KB)`);
            });
            return;
        }

        const fileStats = fs.statSync(messosPath);
        console.log(`\n✅ Found Messos PDF: ${Math.round(fileStats.size / 1024)} KB`);

        // Test with production API using PowerShell
        console.log('\n🌐 Testing with Production API...');
        console.log('==================================');
        
        // Use PowerShell to make the API call
        const { spawn } = require('child_process');
        
        const powershellScript = `
$messosPath = "${messosPath.replace(/\\/g, '\\\\')}"
$uri = "https://pdf-five-nu.vercel.app/api/enhanced-swiss-extract"

Write-Host "📤 Uploading Messos PDF to PaddleOCR endpoint..."
Write-Host "🔗 URL: $uri"
Write-Host "📄 File: $(Split-Path $messosPath -Leaf)"

try {
    # Create multipart form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $fileBytes = [System.IO.File]::ReadAllBytes($messosPath)
    $fileName = Split-Path $messosPath -Leaf
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"pdf`"; filename=`"$fileName`"",
        "Content-Type: application/pdf$LF",
        [System.Text.Encoding]::GetEncoding("iso-8859-1").GetString($fileBytes),
        "--$boundary--$LF"
    ) -join $LF
    
    $response = Invoke-RestMethod -Uri $uri -Method POST -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary" -TimeoutSec 60
    
    if ($response.success) {
        $holdings = $response.data.individualHoldings.Count
        Write-Host ""
        Write-Host "🎉 PADDLEOCR EXTRACTION SUCCESSFUL!"
        Write-Host "==================================="
        Write-Host "📊 Holdings Extracted: $holdings"
        Write-Host "🎯 Expected: 42 holdings"
        Write-Host "📈 Accuracy: $(if($holdings -ge 40){'✅ EXCELLENT (40+)'}elseif($holdings -ge 30){'⚠️ GOOD (30+)'}else{'❌ NEEDS IMPROVEMENT'})"
        
        if ($response.metadata.processingTime) {
            Write-Host "⏱️ Processing Time: $($response.metadata.processingTime)"
        }
        
        if ($response.metadata.method) {
            Write-Host "🔧 Method: $($response.metadata.method)"
        }
        
        if ($response.metadata.workflow) {
            Write-Host ""
            Write-Host "📋 CLAUDE'S WORKFLOW EXECUTED:"
            Write-Host "Step 1: $($response.metadata.workflow.step1)"
            Write-Host "Step 2: $($response.metadata.workflow.step2)"
            Write-Host "Step 3: $($response.metadata.workflow.step3)"
            Write-Host "Step 4: $($response.metadata.workflow.step4)"
        }
        
        if ($response.metadata.aiMonitoring) {
            Write-Host ""
            Write-Host "🧠 AI MONITORING RESULTS:"
            Write-Host "📊 Quality Score: $($response.metadata.aiMonitoring.qualityScore)/100"
            Write-Host "📈 Completeness: $($response.metadata.aiMonitoring.completeness)%"
            Write-Host "🆔 Request ID: $($response.metadata.aiMonitoring.requestId)"
        }
        
        # Show first 5 holdings
        Write-Host ""
        Write-Host "📋 FIRST 5 HOLDINGS EXTRACTED:"
        Write-Host "==============================="
        for ($i = 0; $i -lt [Math]::Min(5, $response.data.individualHoldings.Count); $i++) {
            $holding = $response.data.individualHoldings[$i]
            Write-Host "$($i + 1). $($holding.security)"
            Write-Host "   💰 $($holding.currentValue) $($holding.currency)"
            if ($holding.isin) { Write-Host "   🔢 ISIN: $($holding.isin)" }
            Write-Host ""
        }
        
        if ($response.data.individualHoldings.Count -gt 5) {
            Write-Host "... and $($response.data.individualHoldings.Count - 5) more holdings"
        }
        
        # Calculate total value
        $totalValue = ($response.data.individualHoldings | Measure-Object -Property currentValue -Sum).Sum
        
        Write-Host ""
        Write-Host "💰 PORTFOLIO SUMMARY:"
        Write-Host "======================"
        Write-Host "Total Holdings: $($response.data.individualHoldings.Count)"
        Write-Host "Total Value: $($totalValue.ToString('N0')) CHF"
        if ($response.data.individualHoldings.Count -gt 0) {
            $avgValue = $totalValue / $response.data.individualHoldings.Count
            Write-Host "Average per Holding: $($avgValue.ToString('N0')) CHF"
        }
        
        Write-Host ""
        Write-Host "🎯 PADDLEOCR WORKFLOW CONCLUSION:"
        Write-Host "=================================="
        if ($holdings -ge 40) {
            Write-Host "🏆 EXCELLENT! Claude's PaddleOCR workflow is working perfectly!"
            Write-Host "✅ 100% JSON → Tables approach achieved target accuracy"
            Write-Host "🎉 Your PDF processing system is optimized for maximum accuracy"
        } elseif ($holdings -ge 30) {
            Write-Host "👍 GOOD! PaddleOCR workflow is working well"
            Write-Host "⚡ Consider fine-tuning for even better accuracy"
        } else {
            Write-Host "⚠️ NEEDS IMPROVEMENT! Lower than expected extraction"
            Write-Host "🔧 May need PaddleOCR parameter adjustments"
        }
        
    } else {
        Write-Host "❌ Extraction failed: $($response.error)"
    }
    
} catch {
    Write-Host "❌ API Error: $($_.Exception.Message)"
    Write-Host ""
    Write-Host "📋 MANUAL TESTING INSTRUCTIONS:"
    Write-Host "================================"
    Write-Host "1. Open: https://pdf-five-nu.vercel.app/api/upload"
    Write-Host "2. Upload: 2. Messos - 31.03.2025.pdf (613 KB)"
    Write-Host "3. Expected: 40+ holdings with PaddleOCR workflow"
    Write-Host "4. Check AI Dashboard: https://pdf-five-nu.vercel.app/api/ai-dashboard"
    Write-Host ""
    Write-Host "🧠 AI Monitoring:"
    Write-Host "- Dashboard: https://pdf-five-nu.vercel.app/api/ai-dashboard"
    Write-Host "- Real-time: https://pdf-five-nu.vercel.app/api/ai-realtime"
}
`;

        const powershell = spawn('powershell', ['-Command', powershellScript], { 
            stdio: ['pipe', 'pipe', 'pipe'],
            shell: true 
        });

        let output = '';
        let errorOutput = '';

        powershell.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });

        powershell.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        powershell.on('close', (code) => {
            if (code !== 0) {
                console.log(`\n❌ PowerShell command failed with code: ${code}`);
                if (errorOutput) {
                    console.log('Error:', errorOutput);
                }
                
                console.log('\n📋 FALLBACK: Manual Testing Instructions');
                console.log('=========================================');
                console.log('✅ Messos PDF ready for testing');
                console.log('📁 File:', messosPath);
                console.log('📊 Size:', Math.round(fileStats.size / 1024), 'KB');
                console.log('');
                console.log('🌐 Test with PaddleOCR workflow:');
                console.log('1. Open: https://pdf-five-nu.vercel.app/api/upload');
                console.log('2. Upload the Messos PDF');
                console.log('3. Expected: 40+ holdings with new workflow');
                console.log('');
                console.log('🧠 Monitor AI system:');
                console.log('- Dashboard: https://pdf-five-nu.vercel.app/api/ai-dashboard');
                console.log('- Real-time: https://pdf-five-nu.vercel.app/api/ai-realtime');
            }
        });

        powershell.on('error', (error) => {
            console.log('⚠️ PowerShell execution failed:', error.message);
            
            console.log('\n📋 MANUAL TESTING INSTRUCTIONS');
            console.log('===============================');
            console.log('✅ Messos PDF found and ready');
            console.log('📁 Location:', messosPath);
            console.log('📊 Size:', Math.round(fileStats.size / 1024), 'KB');
            console.log('');
            console.log('🚀 Claude\'s PaddleOCR Workflow:');
            console.log('1. PDF → High-quality images');
            console.log('2. Images → 100% JSON with PaddleOCR');
            console.log('3. JSON → Structured tables');
            console.log('4. Tables → Financial holdings');
            console.log('');
            console.log('🌐 Test URL: https://pdf-five-nu.vercel.app/api/upload');
            console.log('🎯 Expected: 42 holdings extracted');
            console.log('🧠 AI Dashboard: https://pdf-five-nu.vercel.app/api/ai-dashboard');
        });

    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
}

// Run the test
console.log('🚀 Starting PaddleOCR workflow test...');
testPaddleOCRWorkflow().then(() => {
    console.log('\n✅ PaddleOCR test completed!');
}).catch(error => {
    console.log('❌ Test failed:', error.message);
});
