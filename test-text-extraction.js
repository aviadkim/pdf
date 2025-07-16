// Test text extraction capabilities
const express = require('express');
const cors = require('cors');

// Test with raw text that simulates PDF content
const testTextContent = `
Portfolio Statement - Messos Bank
Date: 31.03.2025

SECURITIES:

TORONTO DOMINION BANK NOTES
ISIN: XS2530201644
Currency: USD
Value: 199'080.00

CANADIAN IMPERIAL BANK NOTES  
ISIN: XS2588105036
Currency: USD
Value: 200'288.00

TOTAL PORTFOLIO VALUE: 399'368.00 USD
`;

async function testTextExtraction() {
    try {
        console.log('🚀 Testing Text Extraction on Render...\n');
        
        const response = await fetch('https://pdf-fzzi.onrender.com/api/pdf-extract', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                textContent: testTextContent,
                testMode: false
            })
        });
        
        const result = await response.json();
        console.log('Text Extraction Result:');
        console.log(JSON.stringify(result, null, 2));
        
        if (result.success && result.extractedData) {
            console.log('\n📊 Summary:');
            console.log(`Securities found: ${result.extractedData.securities.length}`);
            console.log(`Total value: $${result.extractedData.totalValue.toLocaleString()}`);
            
            result.extractedData.securities.forEach((security, index) => {
                console.log(`\n${index + 1}. ${security.name}`);
                console.log(`   ISIN: ${security.isin}`);
                console.log(`   Value: ${security.currency} ${security.value.toLocaleString()}`);
            });
        }
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test
testTextExtraction();