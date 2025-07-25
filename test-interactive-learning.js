// Test the Interactive Learning PDF Processor
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const API_URL = 'http://localhost:3002';
const TEST_PDF = 'FUM-2024-10-31-2402748607.pdf';

async function testInteractiveLearning() {
    console.log('🎯 Testing Interactive Learning PDF Processor\n');
    
    try {
        // 1. Load test PDF
        console.log('📄 Loading test PDF...');
        const pdfPath = path.join(__dirname, TEST_PDF);
        const pdfBuffer = await fs.readFile(pdfPath);
        const pdfBase64 = pdfBuffer.toString('base64');
        
        // 2. Initial extraction
        console.log('\n📊 INITIAL EXTRACTION (without learning):');
        const extractResponse = await fetch(`${API_URL}/api/interactive-extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                pdfBase64: pdfBase64,
                sessionId: 'test-session-1'
            })
        });
        
        const extractResult = await extractResponse.json();
        
        if (extractResult.success) {
            const data = extractResult.data;
            console.log(`✅ Extracted ${data.securities.length} securities`);
            console.log(`💰 Total Value: $${data.totalValue.toLocaleString()}`);
            console.log(`📊 Accuracy: ${data.accuracy.toFixed(2)}%`);
            
            // Show first 5 securities
            console.log('\n🔍 Sample Securities:');
            data.securities.slice(0, 5).forEach((sec, idx) => {
                console.log(`${idx + 1}. ${sec.securityName} (${sec.isin})`);
                console.log(`   Value: $${sec.totalValue.toLocaleString()} | Confidence: ${sec.confidence}%`);
            });
            
            // 3. Simulate human corrections
            console.log('\n👤 SIMULATING HUMAN CORRECTIONS:');
            const corrections = [];
            
            // Known corrections from the 92% accurate implementation
            const knownCorrections = [
                { isin: 'XS2567543397', correctValue: 10202418.06, name: 'GS 10Y CALLABLE NOTE' },
                { isin: 'CH0024899483', correctValue: 18995, name: 'UBS AG SHARES' },
                { isin: 'XS2665592833', correctValue: 1507550, name: 'HARP ISSUER PLC' }
            ];
            
            data.securities.forEach(sec => {
                const known = knownCorrections.find(k => k.isin === sec.isin);
                if (known && Math.abs(sec.totalValue - known.correctValue) > 1000) {
                    corrections.push({
                        isin: sec.isin,
                        field: 'totalValue',
                        oldValue: sec.totalValue,
                        newValue: known.correctValue,
                        context: {
                            securityName: sec.securityName,
                            gridPosition: sec.gridPosition,
                            documentType: 'swiss'
                        }
                    });
                    console.log(`📝 Correcting ${sec.isin}: $${sec.totalValue.toLocaleString()} → $${known.correctValue.toLocaleString()}`);
                }
            });
            
            if (corrections.length > 0) {
                // 4. Apply corrections
                console.log(`\n🔧 Applying ${corrections.length} corrections...`);
                const correctResponse = await fetch(`${API_URL}/api/apply-corrections`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        sessionId: data.sessionId,
                        corrections: corrections,
                        feedback: {
                            source: 'test-script',
                            timestamp: new Date().toISOString()
                        }
                    })
                });
                
                const correctResult = await correctResponse.json();
                console.log('✅ Corrections applied:', correctResult.stats);
            }
            
            // 5. Test with learning applied
            console.log('\n📊 RE-EXTRACTION (with learning applied):');
            const learnedResponse = await fetch(`${API_URL}/api/interactive-extract`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    pdfBase64: pdfBase64,
                    sessionId: 'test-session-2'
                })
            });
            
            const learnedResult = await learnedResponse.json();
            
            if (learnedResult.success) {
                const learnedData = learnedResult.data;
                console.log(`✅ Extracted ${learnedData.securities.length} securities`);
                console.log(`💰 Total Value: $${learnedData.totalValue.toLocaleString()}`);
                console.log(`📊 Accuracy: ${learnedData.accuracy.toFixed(2)}%`);
                console.log(`📈 Improvement: ${(learnedData.accuracy - data.accuracy).toFixed(2)}%`);
                
                // Show learned corrections
                console.log('\n✨ Applied Learned Corrections:');
                learnedData.securities.forEach(sec => {
                    if (sec.source === 'learned') {
                        console.log(`- ${sec.isin}: ${sec.securityName} = $${sec.totalValue.toLocaleString()} (99% confidence)`);
                    }
                });
            }
            
            // 6. Show learning statistics
            console.log('\n📚 LEARNING STATISTICS:');
            const statsResponse = await fetch(`${API_URL}/api/learning-stats`);
            const stats = await statsResponse.json();
            console.log(`- Patterns Learned: ${stats.patterns}`);
            console.log(`- Value Mappings: ${stats.valueMappings}`);
            console.log(`- Grid Mappings: ${stats.gridMappings}`);
            console.log(`- Total Corrections: ${stats.totalCorrections}`);
            
        } else {
            console.error('❌ Extraction failed:', extractResult.error);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Instructions
console.log('📋 INTERACTIVE LEARNING SYSTEM TEST');
console.log('===================================');
console.log('This demonstrates the human-in-the-loop learning system.');
console.log('');
console.log('Features:');
console.log('- 92% base accuracy without API keys');
console.log('- Interactive correction interface');
console.log('- Learning from human feedback');
console.log('- Smart grid-based extraction');
console.log('');
console.log('To use the web interface:');
console.log('1. Start the server: node interactive-learning-processor.js');
console.log('2. Open http://localhost:3002/interactive-review.html');
console.log('3. Upload a PDF and correct any mistakes');
console.log('4. The system learns and improves!');
console.log('');
console.log('Running automated test...\n');

// Check if server is running
fetch(`${API_URL}/api/learning-stats`)
    .then(() => {
        console.log('✅ Server is running\n');
        testInteractiveLearning();
    })
    .catch(() => {
        console.error('❌ Server is not running!');
        console.error('Please start the server first:');
        console.error('  node interactive-learning-processor.js');
    });