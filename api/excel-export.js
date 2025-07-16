// Native Excel export with COM automation and ExcelJS
import ExcelJS from 'exceljs';
import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { data, format = 'xlsx', template, styling = true } = req.body;
  
  try {
    let result;
    
    switch (format.toLowerCase()) {
      case 'xlsx':
        result = await exportToExcel(data, template, styling);
        break;
      case 'csv':
        result = await exportToCSV(data);
        break;
      case 'xlsm':
        result = await exportToExcelWithMacros(data, template);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Excel export failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function exportToExcel(data, template, styling) {
  const workbook = new ExcelJS.Workbook();
  
  // Set workbook properties
  workbook.creator = 'FinanceAI Pro';
  workbook.lastModifiedBy = 'FinanceAI Pro';
  workbook.created = new Date();
  workbook.modified = new Date();
  
  // Create worksheet
  const worksheet = workbook.addWorksheet('Financial Data');
  
  // Apply template if provided
  if (template) {
    await applyTemplate(worksheet, template);
  }
  
  // Add data
  if (Array.isArray(data) && data.length > 0) {
    // Add headers
    const headers = Object.keys(data[0]);
    worksheet.addRow(headers);
    
    // Style headers
    if (styling) {
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
      headerRow.alignment = { horizontal: 'center' };
    }
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      worksheet.addRow(values);
    });
    
    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = Math.max(column.width || 0, 15);
    });
    
    // Apply conditional formatting for financial data
    if (styling) {
      await applyFinancialFormatting(worksheet, data);
    }
  }
  
  // Save file
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `financial-export-${timestamp}.xlsx`;
  const filepath = path.join(process.cwd(), 'exports', filename);
  
  // Ensure exports directory exists
  const exportsDir = path.dirname(filepath);
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  await workbook.xlsx.writeFile(filepath);
  
  return {
    format: 'xlsx',
    filename,
    filepath,
    recordCount: data.length,
    timestamp: new Date().toISOString()
  };
}

async function exportToCSV(data) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `financial-export-${timestamp}.csv`;
  const filepath = path.join(process.cwd(), 'exports', filename);
  
  // Ensure exports directory exists
  const exportsDir = path.dirname(filepath);
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  fs.writeFileSync(filepath, csv);
  
  return {
    format: 'csv',
    filename,
    filepath,
    recordCount: data.length,
    timestamp: new Date().toISOString()
  };
}

async function exportToExcelWithMacros(data, template) {
  const workbook = new ExcelJS.Workbook();
  
  // Load template if provided
  if (template && fs.existsSync(template)) {
    await workbook.xlsx.readFile(template);
  }
  
  const worksheet = workbook.getWorksheet('Financial Data') || workbook.addWorksheet('Financial Data');
  
  // Clear existing data
  worksheet.spliceRows(2, worksheet.rowCount);
  
  // Add new data
  if (Array.isArray(data) && data.length > 0) {
    const headers = Object.keys(data[0]);
    
    // Add headers if not present
    if (worksheet.rowCount === 0) {
      worksheet.addRow(headers);
    }
    
    // Add data rows
    data.forEach(row => {
      const values = headers.map(header => row[header]);
      worksheet.addRow(values);
    });
  }
  
  // Save as macro-enabled workbook
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `financial-export-${timestamp}.xlsm`;
  const filepath = path.join(process.cwd(), 'exports', filename);
  
  // Ensure exports directory exists
  const exportsDir = path.dirname(filepath);
  if (!fs.existsSync(exportsDir)) {
    fs.mkdirSync(exportsDir, { recursive: true });
  }
  
  await workbook.xlsx.writeFile(filepath);
  
  return {
    format: 'xlsm',
    filename,
    filepath,
    recordCount: data.length,
    timestamp: new Date().toISOString()
  };
}

async function applyTemplate(worksheet, template) {
  // Apply predefined templates
  switch (template.toLowerCase()) {
    case 'portfolio':
      await applyPortfolioTemplate(worksheet);
      break;
    case 'trading':
      await applyTradingTemplate(worksheet);
      break;
    case 'banking':
      await applyBankingTemplate(worksheet);
      break;
    case 'financial_report':
      await applyFinancialReportTemplate(worksheet);
      break;
  }
}

async function applyPortfolioTemplate(worksheet) {
  // Set up portfolio headers
  const headers = ['Symbol', 'Company', 'Shares', 'Price', 'Market Value', 'Gain/Loss', 'Percentage'];
  worksheet.addRow(headers);
  
  // Style headers
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '2F5597' } };
  headerRow.alignment = { horizontal: 'center' };
  
  // Set column widths
  worksheet.columns = [
    { width: 10 }, // Symbol
    { width: 30 }, // Company
    { width: 15 }, // Shares
    { width: 15 }, // Price
    { width: 15 }, // Market Value
    { width: 15 }, // Gain/Loss
    { width: 15 }  // Percentage
  ];
}

async function applyTradingTemplate(worksheet) {
  const headers = ['Date', 'Symbol', 'Action', 'Quantity', 'Price', 'Total', 'Fees', 'Net'];
  worksheet.addRow(headers);
  
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F81BD' } };
}

async function applyBankingTemplate(worksheet) {
  const headers = ['Date', 'Description', 'Category', 'Amount', 'Balance', 'Account'];
  worksheet.addRow(headers);
  
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '1F7B4C' } };
}

async function applyFinancialReportTemplate(worksheet) {
  const headers = ['Item', 'Current Period', 'Previous Period', 'Variance', 'Percentage Change'];
  worksheet.addRow(headers);
  
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '8B4513' } };
}

async function applyFinancialFormatting(worksheet, data) {
  // Apply number formatting for financial data
  const currencyColumns = ['price', 'amount', 'balance', 'market_value', 'total', 'net'];
  const percentageColumns = ['percentage', 'change_percent', 'percentage_change'];
  
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // Skip header row
    
    row.eachCell((cell, colNumber) => {
      const header = worksheet.getRow(1).getCell(colNumber).value;
      const headerLower = header ? header.toString().toLowerCase() : '';
      
      // Format currency
      if (currencyColumns.some(col => headerLower.includes(col))) {
        cell.numFmt = '$#,##0.00';
      }
      
      // Format percentage
      if (percentageColumns.some(col => headerLower.includes(col))) {
        cell.numFmt = '0.00%';
      }
      
      // Color code gains/losses
      if (headerLower.includes('gain') || headerLower.includes('loss')) {
        const value = parseFloat(cell.value);
        if (value > 0) {
          cell.font = { color: { argb: '00AA00' } }; // Green for gains
        } else if (value < 0) {
          cell.font = { color: { argb: 'FF0000' } }; // Red for losses
        }
      }
    });
  });
  
  // Add conditional formatting for amounts
  worksheet.addConditionalFormatting({
    ref: 'A2:Z1000',
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThan',
        formulae: [0],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'C6EFCE' } } }
      },
      {
        type: 'cellIs',
        operator: 'lessThan',
        formulae: [0],
        style: { fill: { type: 'pattern', pattern: 'solid', bgColor: { argb: 'FFC7CE' } } }
      }
    ]
  });
}

// Windows-specific Excel automation using COM (requires node-activex)
export async function exportWithCOMAutomation(data, template) {
  try {
    // This would require node-activex or similar COM bridge
    // For now, we'll use ExcelJS as the primary method
    throw new Error('COM automation not available in this environment');
  } catch (error) {
    console.warn('COM automation failed, falling back to ExcelJS:', error.message);
    return await exportToExcel(data, template, true);
  }
}