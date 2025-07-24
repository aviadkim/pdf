#!/usr/bin/env node

/**
 * CREATE REAL MESSOS PDF
 * 
 * Creates a realistic 19-page MESSOS PDF with 35+ ISINs worth 19+ million
 */

const fs = require('fs');

function generateISINs() {
    const countries = ['CH', 'US', 'DE', 'FR', 'GB', 'IT', 'NL', 'ES', 'AT', 'BE', 'SE', 'DK', 'NO', 'FI', 'IE', 'LU'];
    const isins = [];
    
    // Generate 40 unique ISINs
    for (let i = 0; i < 40; i++) {
        const country = countries[i % countries.length];
        const code = String(Math.floor(Math.random() * 1000000000)).padStart(9, '0');
        const checkDigit = Math.floor(Math.random() * 10);
        isins.push(`${country}${code}${checkDigit}`);
    }
    
    return isins;
}

function generateSecurities(isins) {
    const companies = [
        'Nestlé SA', 'Roche Holding AG', 'Novartis AG', 'UBS Group AG', 'Zurich Insurance Group AG',
        'Apple Inc.', 'Microsoft Corporation', 'Amazon.com Inc.', 'Alphabet Inc.', 'Tesla Inc.',
        'SAP SE', 'Siemens AG', 'Allianz SE', 'BASF SE', 'Bayer AG',
        'ASML Holding NV', 'Royal Dutch Shell PLC', 'Unilever NV', 'ING Groep NV', 'Philips NV',
        'LVMH Moët Hennessy Louis Vuitton SE', 'TotalEnergies SE', 'Sanofi SA', 'L\'Oréal SA', 'Air Liquide SA',
        'Vodafone Group PLC', 'BP PLC', 'AstraZeneca PLC', 'British American Tobacco PLC', 'Diageo PLC',
        'Intesa Sanpaolo SpA', 'Enel SpA', 'ENI SpA', 'UniCredit SpA', 'Ferrari NV',
        'Banco Santander SA', 'Telefónica SA', 'Iberdrola SA', 'Inditex SA', 'BBVA SA'
    ];
    
    const currencies = ['CHF', 'USD', 'EUR', 'GBP'];
    const securities = [];
    
    isins.forEach((isin, index) => {
        const company = companies[index % companies.length];
        const currency = currencies[index % currencies.length];
        const shares = Math.floor(Math.random() * 10000) + 100;
        const price = (Math.random() * 500 + 50).toFixed(2);
        const value = (shares * parseFloat(price)).toFixed(2);
        
        securities.push({
            isin,
            company,
            shares,
            price: `${currency} ${price}`,
            value: `${currency} ${value.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`
        });
    });
    
    return securities;
}

function createPDFPage(pageNum, content) {
    const objNum = 3 + (pageNum - 1) * 2;
    const contentObjNum = objNum + 1;
    
    return `
${objNum} 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents ${contentObjNum} 0 R
/Resources <<
  /Font <<
    /F1 ${3 + 19 * 2} 0 R
  >>
>>
>>
endobj

${contentObjNum} 0 obj
<<
/Length ${content.length}
>>
stream
${content}
endstream
endobj`;
}

function generatePageContent(pageNum, securities, totalValue) {
    const startIndex = (pageNum - 1) * 2;
    const pageSecurities = securities.slice(startIndex, startIndex + 2);
    
    let content = `BT
/F1 12 Tf
50 750 Td
(MESSOS FINANCIAL SERVICES AG - PAGE ${pageNum}/19) Tj
0 -20 Td
(COMPREHENSIVE PORTFOLIO STATEMENT) Tj
0 -20 Td
(Total Portfolio Value: CHF ${totalValue.toLocaleString()}) Tj
0 -20 Td
(Report Date: 31.12.2024 | Client: Premium Portfolio) Tj

0 -40 Td
(SECURITIES HOLDINGS - PAGE ${pageNum}) Tj`;

    let yOffset = -25;
    pageSecurities.forEach((security, index) => {
        content += `
0 ${yOffset} Td
(ISIN: ${security.isin} | ${security.company}) Tj
0 -15 Td
(Shares: ${security.shares.toLocaleString()} | Price: ${security.price} | Value: ${security.value}) Tj`;
        yOffset = -25;
    });

    // Add some financial metrics for each page
    content += `

0 -40 Td
(PERFORMANCE METRICS - PAGE ${pageNum}) Tj
0 -20 Td
(YTD Performance: +${(Math.random() * 20 + 5).toFixed(2)}% | Volatility: ${(Math.random() * 15 + 10).toFixed(2)}%) Tj
0 -15 Td
(Sharpe Ratio: ${(Math.random() * 2 + 0.5).toFixed(2)} | Beta: ${(Math.random() * 1.5 + 0.5).toFixed(2)}) Tj

0 -30 Td
(RISK ANALYSIS) Tj
0 -20 Td
(Value at Risk (95%, 1 day): CHF ${(Math.random() * 100000 + 50000).toLocaleString()}) Tj
0 -15 Td
(Maximum Drawdown: -${(Math.random() * 10 + 2).toFixed(2)}%) Tj

0 -30 Td
(SECTOR ALLOCATION) Tj
0 -20 Td
(Technology: ${(Math.random() * 30 + 20).toFixed(1)}% | Healthcare: ${(Math.random() * 20 + 10).toFixed(1)}%) Tj
0 -15 Td
(Financials: ${(Math.random() * 25 + 15).toFixed(1)}% | Energy: ${(Math.random() * 15 + 5).toFixed(1)}%) Tj

0 -30 Td
(CURRENCY EXPOSURE) Tj
0 -20 Td
(CHF: ${(Math.random() * 40 + 30).toFixed(1)}% | USD: ${(Math.random() * 30 + 20).toFixed(1)}%) Tj
0 -15 Td
(EUR: ${(Math.random() * 25 + 15).toFixed(1)}% | GBP: ${(Math.random() * 10 + 5).toFixed(1)}%) Tj

0 -40 Td
(TRANSACTION HISTORY - RECENT) Tj`;

    // Add some transactions
    for (let i = 0; i < 3; i++) {
        const date = `${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}.12.2024`;
        const action = Math.random() > 0.5 ? 'BUY' : 'SELL';
        const randomSecurity = pageSecurities[Math.floor(Math.random() * pageSecurities.length)];
        const shares = Math.floor(Math.random() * 100) + 10;
        
        content += `
0 -20 Td
(${date} | ${action} | ISIN: ${randomSecurity.isin} | ${shares} shares) Tj`;
    }

    content += `
ET`;

    return content;
}

async function createRealMessosPDF() {
    console.log('🏦 CREATING REALISTIC 19-PAGE MESSOS PDF');
    console.log('========================================');
    
    const isins = generateISINs();
    const securities = generateSecurities(isins);
    const totalValue = 19500000; // 19.5 million CHF
    
    console.log(`📊 Generated ${isins.length} ISINs`);
    console.log(`💰 Total portfolio value: CHF ${totalValue.toLocaleString()}`);
    console.log(`📄 Creating 19 pages...`);
    
    // PDF Header
    let pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [`;

    // Add page references
    for (let i = 1; i <= 19; i++) {
        const objNum = 3 + (i - 1) * 2;
        pdfContent += `${objNum} 0 R `;
    }
    
    pdfContent += `]
/Count 19
>>
endobj
`;

    // Generate all pages
    for (let pageNum = 1; pageNum <= 19; pageNum++) {
        const pageContent = generatePageContent(pageNum, securities, totalValue);
        pdfContent += createPDFPage(pageNum, pageContent);
    }

    // Font object
    const fontObjNum = 3 + 19 * 2;
    pdfContent += `
${fontObjNum} 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
`;

    // XRef table
    pdfContent += `
xref
0 ${fontObjNum + 1}
0000000000 65535 f `;

    // Calculate approximate offsets (simplified)
    let offset = 100;
    for (let i = 1; i <= fontObjNum; i++) {
        pdfContent += `
${String(offset).padStart(10, '0')} 00000 n `;
        offset += 200; // Approximate object size
    }

    pdfContent += `
trailer
<<
/Size ${fontObjNum + 1}
/Root 1 0 R
>>
startxref
${offset}
%%EOF`;

    // Write the file
    await fs.writeFileSync('real-messos-19pages.pdf', pdfContent);
    
    const stats = fs.statSync('real-messos-19pages.pdf');
    
    console.log('\n✅ REAL MESSOS PDF CREATED');
    console.log('==========================');
    console.log(`📄 File: real-messos-19pages.pdf`);
    console.log(`📊 Size: ${stats.size} bytes (${(stats.size/1024).toFixed(2)} KB)`);
    console.log(`📑 Pages: 19 pages`);
    console.log(`🏢 ISINs: ${isins.length} securities`);
    console.log(`💰 Total Value: CHF ${totalValue.toLocaleString()}`);
    
    console.log('\n📋 CONTENT INCLUDES:');
    console.log('====================');
    console.log(`✅ ${isins.length} unique ISIN numbers from 16 countries`);
    console.log('✅ Major companies: Nestlé, Roche, Apple, Microsoft, SAP, etc.');
    console.log('✅ Multi-currency values: CHF, USD, EUR, GBP');
    console.log('✅ Performance metrics on each page');
    console.log('✅ Risk analysis and sector allocation');
    console.log('✅ Transaction history');
    console.log('✅ Portfolio value over CHF 19 million');
    
    console.log('\n⚠️ THIS WILL TEST:');
    console.log('==================');
    console.log('- Large file processing (19 pages)');
    console.log('- Memory usage with complex content');
    console.log('- Multi-page text extraction');
    console.log('- Pattern recognition at scale');
    console.log('- Processing timeout limits');
    console.log('- Frontend handling of many pages');
    
    return 'real-messos-19pages.pdf';
}

createRealMessosPDF().catch(console.error);
