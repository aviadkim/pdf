const fs = require('fs').promises;
const path = require('path');
const UltraAdvancedExtractor = require('../simple-backend/ultraAdvancedExtractor');

async function extractMessosMarch() {
    try {
        console.log('📄 Starting extraction for 2. Messos - 31.03.2025.pdf...\n');
        
        // Load the PDF file
        const pdfPath = path.join(__dirname, '..', '2. Messos - 30.04.2025.pdf');
        console.log(`Reading PDF from: ${pdfPath}`);
        
        const pdfBuffer = await fs.readFile(pdfPath);
        console.log(`✅ PDF loaded: ${(pdfBuffer.length / 1024 / 1024).toFixed(2)} MB\n`);
        
        // Create extractor instance
        const extractor = new UltraAdvancedExtractor();
        
        // Extract data
        console.log('🚀 Starting extraction...\n');
        const result = await extractor.extractFromPDF(pdfBuffer);
        
        // Display results
        console.log('\n=== EXTRACTION RESULTS ===\n');
        
        // Portfolio Info
        if (result.portfolioInfo) {
            console.log('📊 PORTFOLIO INFORMATION:');
            console.log(`   Client: ${result.portfolioInfo.clientName || 'N/A'}`);
            console.log(`   Client Number: ${result.portfolioInfo.clientNumber || 'N/A'}`);
            console.log(`   Valuation Date: ${result.portfolioInfo.valuationDate || 'N/A'}`);
            console.log(`   Currency: ${result.portfolioInfo.currency || 'N/A'}`);
        }
        
        // Portfolio Total
        if (result.portfolioTotal) {
            console.log('\n💰 PORTFOLIO TOTAL:');
            console.log(`   Value: ${result.portfolioTotal.currency} ${result.portfolioTotal.value.toLocaleString()}`);
        }
        
        // Asset Allocation
        if (result.assetAllocation && result.assetAllocation.length > 0) {
            console.log('\n📈 ASSET ALLOCATION:');
            result.assetAllocation.forEach(asset => {
                console.log(`   ${asset.category}: ${asset.currency} ${asset.value.toLocaleString()} (${asset.percentage})`);
            });
        }
        
        // Individual Holdings
        if (result.individualHoldings && result.individualHoldings.length > 0) {
            console.log(`\n📋 INDIVIDUAL HOLDINGS (${result.individualHoldings.length} securities):\n`);
            
            result.individualHoldings.forEach((holding, index) => {
                console.log(`${index + 1}. ${holding.security}`);
                console.log(`   ISIN: ${holding.isin}`);
                console.log(`   Value: ${holding.currency || 'USD'} ${holding.value.toLocaleString()}`);
                if (holding.type) console.log(`   Type: ${holding.type}`);
                if (holding.maturity) console.log(`   Maturity: ${holding.maturity}`);
                console.log('');
            });
        }
        
        // Accuracy metrics
        if (result.accuracy) {
            console.log('\n📊 EXTRACTION ACCURACY:');
            console.log(`   Portfolio Info: ${result.accuracy.portfolioInfo.toFixed(1)}%`);
            console.log(`   Portfolio Total: ${result.accuracy.portfolioTotal.toFixed(1)}%`);
            console.log(`   Asset Allocation: ${result.accuracy.assetAllocation.toFixed(1)}%`);
            console.log(`   Holdings: ${result.accuracy.holdings.toFixed(1)}%`);
            console.log(`   Overall: ${result.accuracy.overall.toFixed(1)}%`);
        }
        
        // Save results to JSON file
        const outputPath = path.join(__dirname, 'messos-march-extraction-results.json');
        await fs.writeFile(outputPath, JSON.stringify(result, null, 2));
        console.log(`\n✅ Results saved to: ${outputPath}`);
        
    } catch (error) {
        console.error('\n❌ Extraction failed:', error.message);
        console.error(error.stack);
    }
}

// Run extraction
extractMessosMarch();