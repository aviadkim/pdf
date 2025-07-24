/**
 * Test Universal API Endpoint
 * Tests the /api/universal-extract endpoint with different bank formats
 */

const https = require('https');
const http = require('http');

class UniversalAPITester {
    constructor() {
        this.localUrl = 'http://localhost:10002';
        this.renderUrl = 'https://pdf-fzzi.onrender.com';
        
        // Test with different bank PDF formats
        this.testData = {
            messos_swiss: {
                content: `
MESSOS WEALTH MANAGEMENT - Portfolio Statement
==============================================

Security Holdings Analysis - July 2025

ISIN: CH0012005267    UBS Group AG                           850'000 CHF
ISIN: CH0038863350    Nestlé SA                            2'100'000 CHF  
ISIN: US0378331005    Apple Inc.                           1'450'000 USD
ISIN: US5949181045    Microsoft Corporation                1'890'000 USD
ISIN: DE0007236101    Siemens AG                             890'000 EUR
ISIN: NL0000235190    Airbus SE                              780'000 EUR
ISIN: CH0244767585    ABB Ltd                                920'000 CHF
ISIN: FR0000120578    Sanofi                                 540'000 EUR
ISIN: GB0002374006    Diageo plc                             675'000 GBP
ISIN: CH0126881561    Zurich Insurance Group AG           1'100'000 CHF
ISIN: XS2746319610    Government Bond Series 2024           140'000 CHF
ISIN: XS2407295554    Corporate Bond 2026                   320'000 CHF
ISIN: XS2252299883    Infrastructure Bond                   480'000 CHF

Portfolio Total: 19'464'431 CHF
Analysis Date: July 2025
                `,
                expectedSecurities: 13,
                expectedCurrency: 'CHF'
            },
            
            us_schwab: {
                content: `
CHARLES SCHWAB & CO., INC.
BROKERAGE ACCOUNT STATEMENT
===========================

Account Holdings Summary

CUSIP: 037833100    Apple Inc                      $2,234,567.89
CUSIP: 594918104    Microsoft Corporation          $1,845,678.90
CUSIP: 88160R101    Tesla Inc                        $876,543.21
CUSIP: 023135106    Amazon.com Inc                 $1,567,890.12
CUSIP: 30303M102    Meta Platforms Inc               $934,567.89
CUSIP: 02079K305    Alphabet Inc Class A           $1,234,567.89

Total Account Value: $8,693,815.90
Statement Date: July 24, 2025
                `,
                expectedSecurities: 6,
                expectedCurrency: 'USD'
            },
            
            deutsche_bank: {
                content: `
DEUTSCHE BANK PRIVATE WEALTH MANAGEMENT
Wertpapierdepot Übersicht
=====================================

Wertpapierbestand per 24.07.2025

ISIN: DE0007164600    SAP SE                         1.234.567,89 EUR
ISIN: DE0008469008    Allianz SE                       987.654,32 EUR
ISIN: DE0007236101    Siemens AG                       654.321,09 EUR
WKN: 823212          BASF SE                          456.789,12 EUR
ISIN: DE0005190003    BMW AG                           345.678,90 EUR
ISIN: FR0000120578    Sanofi SA                        234.567,89 EUR

Gesamtwert Portfolio: 3.913.579,21 EUR
Berichtsdatum: 24. Juli 2025
                `,
                expectedSecurities: 6,
                expectedCurrency: 'EUR'
            }
        };
    }
    
    async testUniversalAPI() {
        console.log('🌍 TESTING UNIVERSAL API ENDPOINT');
        console.log('==================================');
        console.log('🎯 Testing /api/universal-extract with different bank formats');
        console.log('🚫 NO hardcoding - should work with ANY financial PDF');
        console.log('==================================');
        
        // Test local server first
        console.log('\\n🏠 Testing Local Server...');
        await this.testLocalServer();
        
        // Test render deployment
        console.log('\\n🌍 Testing Render Deployment...');
        await this.testRenderDeployment();
    }
    
    async testLocalServer() {
        try {
            const results = {};
            
            for (const [bankType, testCase] of Object.entries(this.testData)) {
                console.log(`\\n📋 Testing ${bankType}...`);
                
                try {
                    const pdfBuffer = this.createTestPDF(testCase.content);
                    const result = await this.callAPI(this.localUrl, '/api/universal-extract', pdfBuffer);
                    
                    if (result.success) {
                        console.log(`✅ Success: ${result.securities.length} securities`);
                        console.log(`💰 Total: ${result.totalValue.toLocaleString()} ${result.currency}`);
                        console.log(`📊 Accuracy: ${result.accuracy}%`);
                        console.log(`⏱️ Processing: ${result.processingTime}ms`);
                        
                        // Validate results
                        const isAccurate = result.securities.length >= testCase.expectedSecurities * 0.8;
                        const correctCurrency = result.currency === testCase.expectedCurrency;
                        
                        if (isAccurate && correctCurrency) {
                            console.log(`🏆 EXCELLENT: ${bankType} processed correctly`);
                        } else {
                            console.log(`⚠️ ISSUES: Securities ${result.securities.length}/${testCase.expectedSecurities}, Currency ${result.currency}/${testCase.expectedCurrency}`);
                        }
                        
                        results[bankType] = { success: true, ...result };
                    } else {
                        console.log(`❌ Failed: ${result.error}`);
                        results[bankType] = { success: false, error: result.error };
                    }
                    
                } catch (error) {
                    console.log(`❌ Error testing ${bankType}: ${error.message}`);
                    results[bankType] = { success: false, error: error.message };
                }
                
                // Small delay between tests
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            // Summary
            const successful = Object.values(results).filter(r => r.success).length;
            const total = Object.keys(results).length;
            
            console.log(`\\n📊 LOCAL SERVER SUMMARY:`);
            console.log(`✅ Success rate: ${successful}/${total} (${(successful/total*100).toFixed(1)}%)`);
            
            if (successful === total) {
                console.log('🚀 LOCAL SERVER: All bank formats working!');
            } else {
                console.log('⚠️ LOCAL SERVER: Some formats need debugging');
            }
            
        } catch (error) {
            console.log(`❌ Local server not available: ${error.message}`);
        }
    }
    
    async testRenderDeployment() {
        try {
            // First check if universal endpoint exists
            console.log('🔍 Checking if universal endpoint is deployed...');
            
            const testPdf = this.createTestPDF(this.testData.messos_swiss.content);
            const result = await this.callAPI(this.renderUrl, '/api/universal-extract', testPdf);
            
            if (result.success) {
                console.log('✅ Universal endpoint is live on Render!');
                console.log(`📊 Test result: ${result.securities.length} securities, ${result.accuracy}% accuracy`);
                
                // Test with one example from each region
                const quickTests = [
                    { name: 'Swiss Bank', data: this.testData.messos_swiss },
                    { name: 'US Brokerage', data: this.testData.us_schwab }
                ];
                
                for (const test of quickTests) {
                    console.log(`\\n🧪 Quick test: ${test.name}...`);
                    
                    const pdf = this.createTestPDF(test.data.content);
                    const testResult = await this.callAPI(this.renderUrl, '/api/universal-extract', pdf);
                    
                    if (testResult.success) {
                        console.log(`   ✅ ${testResult.securities.length} securities, ${testResult.accuracy}% accuracy`);
                    } else {
                        console.log(`   ❌ Failed: ${testResult.error}`);
                    }
                }
                
            } else if (result.error && result.error.includes('Cannot find module')) {
                console.log('⚠️ Universal extractor not deployed yet - needs deployment');
            } else {
                console.log(`❌ Universal endpoint error: ${result.error}`);
            }
            
        } catch (error) {
            console.log(`❌ Render deployment test failed: ${error.message}`);
        }
    }
    
    createTestPDF(content) {
        // Create minimal PDF with content
        const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj

4 0 obj
<<
/Length ${content.length}
>>
stream
BT
/F1 10 Tf
40 750 Td
${content.split('\\n').map(line => `(${line}) Tj 0 -12 Td`).join('\\n')}
ET
endstream
endobj

xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000220 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
${1000 + content.length}
%%EOF`;
        
        return Buffer.from(pdfContent);
    }
    
    async callAPI(baseUrl, endpoint, pdfBuffer) {
        return new Promise((resolve, reject) => {
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36);
            
            // Create multipart form data
            let formData = '';
            formData += `--${boundary}\\r\\n`;
            formData += `Content-Disposition: form-data; name="pdf"; filename="test.pdf"\\r\\n`;
            formData += `Content-Type: application/pdf\\r\\n`;
            formData += '\\r\\n';
            
            const header = Buffer.from(formData, 'utf8');
            const footer = Buffer.from(`\\r\\n--${boundary}--\\r\\n`, 'utf8');
            const body = Buffer.concat([header, pdfBuffer, footer]);
            
            const isHttps = baseUrl.startsWith('https');
            const url = new URL(baseUrl + endpoint);
            
            const options = {\n                hostname: url.hostname,\n                port: isHttps ? 443 : url.port || 80,\n                path: url.pathname,\n                method: 'POST',\n                headers: {\n                    'Content-Type': `multipart/form-data; boundary=${boundary}`,\n                    'Content-Length': body.length,\n                    'User-Agent': 'UniversalAPITester/1.0'\n                }\n            };\n            \n            const module = isHttps ? https : http;\n            const req = module.request(options, (res) => {\n                let responseBody = '';\n                \n                res.on('data', (chunk) => {\n                    responseBody += chunk;\n                });\n                \n                res.on('end', () => {\n                    try {\n                        const result = JSON.parse(responseBody);\n                        resolve(result);\n                    } catch (error) {\n                        resolve({\n                            success: false,\n                            error: 'Invalid JSON response',\n                            rawResponse: responseBody.substring(0, 200)\n                        });\n                    }\n                });\n            });\n            \n            req.on('error', (error) => {\n                reject(error);\n            });\n            \n            req.setTimeout(30000, () => {\n                req.destroy();\n                reject(new Error('Request timeout'));\n            });\n            \n            req.write(body);\n            req.end();\n        });\n    }\n}\n\n// Run tests if called directly\nif (require.main === module) {\n    const tester = new UniversalAPITester();\n    tester.testUniversalAPI().catch(error => {\n        console.error('❌ Universal API test failed:', error.message);\n        process.exit(1);\n    });\n}\n\nmodule.exports = { UniversalAPITester };