// 🧪 Simple Messos PDF Test
const fs = require('fs');
const path = require('path');

console.log('📄 MESSOS PDF SIMPLE TEST');
console.log('==========================');

async function testMessosPDF() {
    try {
        // Check if Messos PDF exists
        const messosPath = path.join(__dirname, '2. Messos - 30.04.2025.pdf');
        
        console.log('🔍 Looking for Messos PDF at:', messosPath);
        
        if (!fs.existsSync(messosPath)) {
            console.log('❌ Messos PDF not found!');
            
            // List all PDF files in directory
            console.log('\n📁 Available files in directory:');
            const files = fs.readdirSync(__dirname);
            const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
            
            if (pdfFiles.length > 0) {
                console.log('PDF files found:');
                pdfFiles.forEach(file => {
                    const filePath = path.join(__dirname, file);
                    const stats = fs.statSync(filePath);
                    console.log(`  📄 ${file} (${Math.round(stats.size / 1024)} KB)`);
                });
            } else {
                console.log('  No PDF files found in directory');
            }
            return;
        }

        const fileStats = fs.statSync(messosPath);
        console.log(`✅ Found Messos PDF!`);
        console.log(`📊 File size: ${Math.round(fileStats.size / 1024)} KB`);
        console.log(`📅 Modified: ${fileStats.mtime.toLocaleString()}`);

        // Test with production API using fetch (built-in in newer Node.js)
        console.log('\n🌐 Testing with Production API...');
        console.log('===================================');

        // Read file as buffer
        const fileBuffer = fs.readFileSync(messosPath);
        console.log(`📤 File loaded into memory: ${fileBuffer.length} bytes`);

        // Create form data manually
        const boundary = '----formdata-boundary-' + Math.random().toString(36);
        const formData = Buffer.concat([
            Buffer.from(`--${boundary}\r\n`),
            Buffer.from(`Content-Disposition: form-data; name="pdf"; filename="2. Messos - 30.04.2025.pdf"\r\n`),
            Buffer.from(`Content-Type: application/pdf\r\n\r\n`),
            fileBuffer,
            Buffer.from(`\r\n--${boundary}--\r\n`)
        ]);

        console.log(`📦 Form data prepared: ${formData.length} bytes`);

        // Test with curl command instead
        console.log('\n🔧 Alternative: Using curl command...');
        console.log('=====================================');
        
        const { spawn } = require('child_process');
        
        // Check if curl is available
        const curlTest = spawn('curl', ['--version'], { shell: true });
        
        curlTest.on('close', (code) => {
            if (code === 0) {
                console.log('✅ curl is available');
                
                // Run curl command to upload PDF
                const curlCommand = spawn('curl', [
                    '-X', 'POST',
                    '-F', `pdf=@"${messosPath}"`,
                    'https://pdf-five-nu.vercel.app/api/enhanced-swiss-extract',
                    '--max-time', '60',
                    '--connect-timeout', '30'
                ], { shell: true });

                let output = '';
                let errorOutput = '';

                curlCommand.stdout.on('data', (data) => {
                    output += data.toString();
                });

                curlCommand.stderr.on('data', (data) => {
                    errorOutput += data.toString();
                });

                curlCommand.on('close', (code) => {
                    console.log(`\n📊 Curl command completed with code: ${code}`);
                    
                    if (code === 0 && output) {
                        try {
                            const result = JSON.parse(output);
                            
                            if (result.success) {
                                const holdings = result.data.individualHoldings || [];
                                
                                console.log('\n🎉 EXTRACTION SUCCESSFUL!');
                                console.log('==========================');
                                console.log(`📊 Holdings Extracted: ${holdings.length}`);
                                console.log(`🎯 Expected Holdings: 42`);
                                console.log(`📈 Accuracy: ${holdings.length >= 40 ? '✅ EXCELLENT (40+)' : holdings.length >= 30 ? '⚠️ GOOD (30+)' : '❌ NEEDS IMPROVEMENT'}`);
                                
                                if (result.metadata) {
                                    console.log(`⏱️  Processing Time: ${result.metadata.processingTime}`);
                                    console.log(`🔧 Method: ${result.metadata.method}`);
                                    
                                    if (result.metadata.aiMonitoring) {
                                        console.log('\n🧠 AI MONITORING ACTIVE:');
                                        console.log(`📊 Quality Score: ${result.metadata.aiMonitoring.qualityScore}/100`);
                                        console.log(`📈 Completeness: ${result.metadata.aiMonitoring.completeness}%`);
                                        console.log(`🆔 Request ID: ${result.metadata.aiMonitoring.requestId}`);
                                    }
                                }

                                // Show first 5 holdings
                                console.log('\n📋 FIRST 5 HOLDINGS:');
                                console.log('====================');
                                holdings.slice(0, 5).forEach((holding, index) => {
                                    console.log(`${index + 1}. ${holding.security || 'N/A'}`);
                                    console.log(`   💰 ${holding.currentValue || 'N/A'} ${holding.currency || 'CHF'}`);
                                    if (holding.isin) console.log(`   🔢 ISIN: ${holding.isin}`);
                                    console.log('');
                                });

                                if (holdings.length > 5) {
                                    console.log(`... and ${holdings.length - 5} more holdings`);
                                }

                                // Calculate total
                                const totalValue = holdings.reduce((sum, h) => {
                                    const value = parseFloat(h.currentValue) || 0;
                                    return sum + value;
                                }, 0);

                                console.log('\n💰 PORTFOLIO SUMMARY:');
                                console.log('======================');
                                console.log(`Total Holdings: ${holdings.length}`);
                                console.log(`Total Value: ${totalValue.toLocaleString()} CHF`);
                                
                                if (holdings.length > 0) {
                                    console.log(`Average per Holding: ${Math.round(totalValue / holdings.length).toLocaleString()} CHF`);
                                }

                                // Save results
                                const resultsFile = `messos-results-${Date.now()}.json`;
                                fs.writeFileSync(resultsFile, JSON.stringify(result, null, 2));
                                console.log(`\n💾 Full results saved to: ${resultsFile}`);

                                console.log('\n🎯 CONCLUSION:');
                                console.log('===============');
                                if (holdings.length >= 40) {
                                    console.log('🏆 EXCELLENT! Messos extraction is working perfectly!');
                                    console.log('✅ Your PDF processing system is achieving the target accuracy');
                                } else if (holdings.length >= 30) {
                                    console.log('👍 GOOD! Extraction is working but could be optimized');
                                    console.log('⚡ Consider fine-tuning for better accuracy');
                                } else {
                                    console.log('⚠️  NEEDS IMPROVEMENT! Lower than expected extraction');
                                    console.log('🔧 May need algorithm adjustments');
                                }

                            } else {
                                console.log('❌ Extraction failed:', result.error);
                            }
                            
                        } catch (parseError) {
                            console.log('❌ Failed to parse response:', parseError.message);
                            console.log('Raw output:', output.substring(0, 500));
                        }
                    } else {
                        console.log('❌ Curl command failed');
                        if (errorOutput) {
                            console.log('Error:', errorOutput);
                        }
                        if (output) {
                            console.log('Output:', output.substring(0, 500));
                        }
                    }
                });

            } else {
                console.log('❌ curl not available, trying alternative method...');
                
                // Alternative: Show manual instructions
                console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
                console.log('================================');
                console.log('1. Open your browser to: https://pdf-five-nu.vercel.app/api/upload');
                console.log('2. Drag and drop the Messos PDF file');
                console.log('3. Click "Extract Financial Data"');
                console.log('4. Check if you get 40+ holdings extracted');
                console.log('');
                console.log('🧠 AI Dashboard: https://pdf-five-nu.vercel.app/api/ai-dashboard');
                console.log('📊 Real-time Monitor: https://pdf-five-nu.vercel.app/api/ai-realtime');
            }
        });

        curlTest.on('error', (error) => {
            console.log('⚠️  curl check failed, showing manual instructions...');
            
            console.log('\n📋 MANUAL TESTING INSTRUCTIONS:');
            console.log('================================');
            console.log('✅ Messos PDF found and ready for testing');
            console.log('📁 File location:', messosPath);
            console.log('📊 File size:', Math.round(fileStats.size / 1024), 'KB');
            console.log('');
            console.log('🌐 Production Website Testing:');
            console.log('1. Open: https://pdf-five-nu.vercel.app/api/upload');
            console.log('2. Upload the Messos PDF');
            console.log('3. Expected result: 40+ holdings extracted');
            console.log('');
            console.log('🧠 AI Monitoring:');
            console.log('- Dashboard: https://pdf-five-nu.vercel.app/api/ai-dashboard');
            console.log('- Real-time: https://pdf-five-nu.vercel.app/api/ai-realtime');
            console.log('');
            console.log('🎯 Success Criteria:');
            console.log('- 40+ holdings extracted from Messos PDF');
            console.log('- Processing time under 10 seconds');
            console.log('- AI quality score above 80/100');
        });

    } catch (error) {
        console.log('❌ Test error:', error.message);
    }
}

// Run the test
console.log('🚀 Starting Messos PDF test...');
testMessosPDF().then(() => {
    console.log('\n✅ Test completed!');
}).catch(error => {
    console.log('❌ Test failed:', error.message);
});
