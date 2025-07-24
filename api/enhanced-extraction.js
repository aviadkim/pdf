
// 🤖 Auto-generated accuracy improvement
function enhancedExtractionLogic(tableData) {
  // Improved column detection
  const columnMap = detectColumnsIntelligently(tableData);
  
  // Better value extraction
  const values = extractValuesWithValidation(tableData, columnMap);
  
  // Cross-validation
  return validateAndCorrectValues(values);
}

function detectColumnsIntelligently(tableData) {
  // Smart column detection based on header patterns
  const headers = tableData.headers || [];
  const mapping = {};
  
  headers.forEach((header, index) => {
    const h = header.toLowerCase();
    if (h.includes('valuation') && h.includes('usd')) {
      mapping.usdValue = index;
    }
    if (h.includes('description') || h.includes('security')) {
      mapping.description = index;
    }
    if (h.includes('isin')) {
      mapping.isin = index;
    }
  });
  
  return mapping;
}
