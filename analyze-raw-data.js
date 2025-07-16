// 📊 Analyze Raw Data - Show complete extracted data for manual review
import fs from 'fs';

function analyzeRawData() {
    console.log('📊 ANALYZING COMPLETE RAW DATA FROM MESSOS PDF');
    console.log('=' * 70);
    
    try {
        const rawDataJson = JSON.parse(fs.readFileSync('messos_complete_raw_data.json', 'utf8'));
        const completeJSON = rawDataJson.completeJSON;
        
        console.log('📄 METADATA:');
        console.log(`Filename: ${completeJSON.metadata.filename}`);
        console.log(`PDF Size: ${Math.round(completeJSON.metadata.pdfSize / 1024)}KB`);
        console.log(`Total Elements: ${completeJSON.metadata.totalElements.toLocaleString()}`);
        console.log(`Methods Used: ${completeJSON.metadata.methods.join(', ')}`);
        console.log('');
        
        console.log('📊 STATISTICS:');
        const stats = completeJSON.metadata.statistics;
        console.log(`Total Words: ${stats.totalWords.toLocaleString()}`);
        console.log(`Total Numbers: ${stats.totalNumbers.toLocaleString()}`);
        console.log(`Total ISINs: ${stats.totalISINs}`);
        console.log(`Total Amounts: ${stats.totalAmounts.toLocaleString()}`);
        console.log(`Total Currencies: ${stats.totalCurrencies}`);
        console.log('');
        
        console.log('💼 ALL ISINs FOUND (with context):');
        console.log('-' * 70);
        completeJSON.patterns.isins.forEach((isin, index) => {
            console.log(`${index + 1}. ${isin.isin}`);
            console.log(`   Context: ${isin.context}`);
            console.log('');
        });
        
        console.log('💰 SAMPLE AMOUNTS (first 20):');
        console.log('-' * 70);
        completeJSON.patterns.amounts.slice(0, 20).forEach((amount, index) => {
            console.log(`${index + 1}. ${amount.amount} (parsed: ${amount.parsed?.toLocaleString() || 'N/A'})`);
            console.log(`   Context: ${amount.context.substring(0, 60)}...`);
            console.log('');
        });
        
        console.log('🔤 SAMPLE TEXT LINES (showing structure):');
        console.log('-' * 70);
        completeJSON.rawText.lines.slice(0, 50).forEach((line, index) => {
            if (line.text && line.text.trim().length > 0) {
                console.log(`${index + 1}. ${line.text}`);
            }
        });
        
        // Save structured analysis
        const analysis = {
            metadata: completeJSON.metadata,
            uniqueISINs: [...new Set(completeJSON.patterns.isins.map(i => i.isin))],
            largeAmounts: completeJSON.patterns.amounts
                .filter(a => a.parsed && a.parsed > 10000)
                .sort((a, b) => b.parsed - a.parsed)
                .slice(0, 50),
            sampleLines: completeJSON.rawText.lines
                .filter(line => line.text && line.text.trim().length > 0)
                .slice(0, 100)
        };
        
        fs.writeFileSync('messos_analysis.json', JSON.stringify(analysis, null, 2));
        console.log('');
        console.log('💾 Analysis saved to: messos_analysis.json');
        console.log('📄 Complete raw data available in: messos_complete_raw_data.json');
        
    } catch (error) {
        console.error('❌ Error analyzing raw data:', error.message);
    }
}

analyzeRawData();