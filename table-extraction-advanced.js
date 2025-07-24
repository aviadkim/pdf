// Advanced table extraction using pdfjs-dist for positional data
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.mjs');
const fs = require('fs');

// Advanced table extraction with positioning
async function extractTablesWithPositions(pdfPath) {
    console.log('🔍 Starting advanced table extraction...');
    
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    
    const allTables = [];
    
    // Process each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        console.log(`\n📄 Processing page ${pageNum}/${pdf.numPages}`);
        const page = await pdf.getPage(pageNum);
        
        // Get text content with positions
        const textContent = await page.getTextContent();
        
        // Extract table data with positioning
        const pageTable = await extractPageTable(textContent, pageNum);
        if (pageTable) {
            allTables.push(pageTable);
        }
    }
    
    // Merge multi-page tables
    const mergedTables = mergeContinuationTables(allTables);
    
    // Extract securities from tables
    const securities = extractSecuritiesFromTables(mergedTables);
    
    return securities;
}

// Extract table structure from page
async function extractPageTable(textContent, pageNum) {
    const items = textContent.items;
    
    // Group items by Y position (rows)
    const rows = {};
    
    items.forEach(item => {
        const y = Math.round(item.transform[5]); // Y position
        const x = Math.round(item.transform[4]); // X position
        
        if (!rows[y]) {
            rows[y] = [];
        }
        
        rows[y].push({
            text: item.str,
            x: x,
            y: y,
            width: item.width,
            height: item.height
        });
    });
    
    // Sort rows by Y position (top to bottom)
    const sortedRows = Object.keys(rows)
        .map(y => parseInt(y))
        .sort((a, b) => b - a) // PDF Y coordinates are bottom-up
        .map(y => rows[y]);
    
    // Detect table structure
    const tableData = detectTableStructure(sortedRows, pageNum);
    
    return tableData;
}

// Detect table structure based on alignment
function detectTableStructure(rows, pageNum) {
    console.log(`🔍 Analyzing ${rows.length} rows for table structure...`);
    
    const tableRows = [];
    let headers = null;
    let inTable = false;
    
    for (const row of rows) {
        // Sort items in row by X position
        row.sort((a, b) => a.x - b.x);
        
        const rowText = row.map(item => item.text).join(' ');
        
        // Detect table headers
        if (rowText.includes('ISIN') && (rowText.includes('Value') || rowText.includes('Valorn'))) {
            headers = row;
            inTable = true;
            console.log(`📊 Found table headers: ${rowText}`);
            continue;
        }
        
        // Extract table rows
        if (inTable) {
            // Check if this is end of table
            if (rowText.includes('Total') && rowText.includes('100') || 
                rowText.includes('Portfolio Total') ||
                rowText.includes('Total assets')) {
                console.log(`📊 End of table detected: ${rowText}`);
                break;
            }
            
            // Check if row has ISIN pattern
            const isinMatch = rowText.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/);
            if (isinMatch) {
                const cells = extractCellsFromRow(row, headers);
                if (cells) {
                    tableRows.push(cells);
                }
            }
        }
    }
    
    console.log(`📊 Found ${tableRows.length} securities on page ${pageNum}`);
    
    return {
        page: pageNum,
        headers: headers,
        rows: tableRows
    };
}

// Extract cells from row based on header positions
function extractCellsFromRow(row, headers) {
    if (!headers) return null;
    
    const cells = {};
    
    // Find ISIN
    const isinItem = row.find(item => item.text.match(/[A-Z]{2}[A-Z0-9]{9}[0-9]/));
    if (isinItem) {
        cells.isin = isinItem.text;
    }
    
    // Find value - look for numbers with Swiss format
    const valueItems = row.filter(item => {
        const text = item.text.trim();
        return text.match(/\d{1,3}(?:[',]\d{3})*(?:\.\d+)?/);
    });
    
    // Extract values and find the most likely portfolio value
    const values = valueItems.map(item => {
        const text = item.text.trim();
        const numStr = text.replace(/[',]/g, '');
        return parseFloat(numStr);
    }).filter(v => v > 1000 && v < 50000000);
    
    if (values.length > 0) {
        // Take the median value to avoid outliers
        values.sort((a, b) => a - b);
        cells.value = values[Math.floor(values.length / 2)];
    }
    
    // Extract security name (usually after ISIN)
    const isinIndex = row.findIndex(item => item === isinItem);
    if (isinIndex >= 0 && isinIndex < row.length - 1) {
        const nameItems = [];
        for (let i = isinIndex + 1; i < row.length; i++) {
            const text = row[i].text.trim();
            if (text && !text.match(/^\d/) && text.length > 2) {
                nameItems.push(text);
                if (nameItems.length >= 3) break; // Max 3 parts for name
            }
        }
        cells.name = nameItems.join(' ');
    }
    
    return cells;
}

// Merge tables that continue across pages
function mergeContinuationTables(tables) {
    console.log('\n🔗 Merging multi-page tables...');
    
    const merged = [];
    let currentTable = null;
    
    for (const table of tables) {
        if (!table || !table.rows || table.rows.length === 0) continue;
        
        if (!currentTable) {
            currentTable = table;
        } else {
            // Check if this is a continuation
            const firstRow = table.rows[0];
            const lastRow = currentTable.rows[currentTable.rows.length - 1];
            
            // If pages are consecutive, merge
            if (table.page === currentTable.page + 1) {
                console.log(`📋 Merging page ${currentTable.page} with page ${table.page}`);
                currentTable.rows.push(...table.rows);
            } else {
                merged.push(currentTable);
                currentTable = table;
            }
        }
    }
    
    if (currentTable) {
        merged.push(currentTable);
    }
    
    return merged;
}

// Extract securities from table data
function extractSecuritiesFromTables(tables) {
    const securities = [];
    const seenISINs = new Set();
    
    for (const table of tables) {
        if (!table || !table.rows) continue;
        
        for (const row of table.rows) {
            if (row.isin && row.value && !seenISINs.has(row.isin)) {
                seenISINs.add(row.isin);
                securities.push({
                    isin: row.isin,
                    name: row.name || '',
                    value: row.value,
                    currency: 'USD',
                    extractionMethod: 'table-advanced',
                    page: table.page
                });
                
                console.log(`✅ ${row.isin}: $${row.value.toLocaleString()} (page ${table.page})`);
            }
        }
    }
    
    return securities;
}

// Test the advanced extraction
async function testAdvancedExtraction() {
    try {
        console.log('=== TESTING ADVANCED TABLE EXTRACTION ===');
        
        const securities = await extractTablesWithPositions('2. Messos  - 31.03.2025.pdf');
        
        console.log('\n=== FINAL RESULTS ===');
        console.log(`Securities found: ${securities.length}`);
        
        const total = securities.reduce((sum, s) => sum + s.value, 0);
        console.log(`Total: $${total.toLocaleString()}`);
        console.log(`Expected: $19,464,431`);
        
        const accuracy = Math.min(total, 19464431) / Math.max(total, 19464431) * 100;
        console.log(`Accuracy: ${accuracy.toFixed(2)}%`);
        
        // Compare with current results
        console.log('\n=== COMPARISON ===');
        console.log(`Current method: 23 securities, 92.21% accuracy`);
        console.log(`Advanced method: ${securities.length} securities, ${accuracy.toFixed(2)}% accuracy`);
        
        // Show all securities
        console.log('\n=== ALL SECURITIES FOUND ===');
        securities.forEach((s, i) => {
            console.log(`${i+1}. ${s.isin}: $${s.value.toLocaleString()} - ${s.name || 'No name'}`);
        });
        
        return securities;
        
    } catch (error) {
        console.error('Error:', error);
    }
}

// Export for use in server
module.exports = { extractTablesWithPositions };

// Run test if executed directly
if (require.main === module) {
    testAdvancedExtraction();
}