const data = require('./enhanced-test-response.json');

console.log('=== ENHANCED EXTRACTION ANALYSIS ===');
console.log('Total Securities:', data.securities.length);
console.log('Total Value: $' + data.totalValue.toLocaleString());

const withNames = data.securities.filter(s => s.name && s.name.length > 0);
const withoutNames = data.securities.filter(s => !s.name || s.name.length === 0);

console.log('\nSecurity Names:');
console.log('- With names:', withNames.length);
console.log('- Without names:', withoutNames.length);

console.log('\nSample securities with names:');
withNames.slice(0, 5).forEach(s => {
    console.log(`  ${s.isin}: ${s.name} = $${s.value.toLocaleString()}`);
});

console.log('\nKey issues identified:');
console.log('1. Missing quantity/price data (all securities)');
console.log(`2. Many securities missing names (${withoutNames.length}/${data.securities.length})`);
console.log('3. OCR was not triggered (ocrPagesProcessed: 0)');
console.log('4. Duplicate values for some securities');

console.log('\nSpecific issues:');
data.securities.forEach(s => {
    if (s.isin === 'XS2530201644') {
        console.log(`- XS2530201644 should be $19,839,820 but got $${s.value.toLocaleString()}`);
    }
});

console.log('\nRecommendations:');
console.log('1. Force OCR triggering for better name extraction');
console.log('2. Implement table parsing for quantity/price data');
console.log('3. Add mathematical validation (quantity × price = value)');
console.log('4. Apply known corrections for key securities');