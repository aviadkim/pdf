// Automated bank statement downloader with Puppeteer
import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { bank, credentials, dateRange, format = 'pdf' } = req.body;
  
  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      defaultViewport: { width: 1920, height: 1080 }
    });

    const result = await downloadBankStatements(browser, bank, credentials, dateRange, format);
    await browser.close();

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Bank statement download failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function downloadBankStatements(browser, bank, credentials, dateRange, format) {
  const page = await browser.newPage();
  
  // Set download behavior
  const downloadPath = path.join(process.cwd(), 'downloads', 'bank-statements');
  if (!fs.existsSync(downloadPath)) {
    fs.mkdirSync(downloadPath, { recursive: true });
  }
  
  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: downloadPath
  });

  switch (bank.toLowerCase()) {
    case 'chase':
      return await downloadChaseStatements(page, credentials, dateRange, format);
    case 'bofa':
    case 'bankofamerica':
      return await downloadBofAStatements(page, credentials, dateRange, format);
    case 'wells':
    case 'wellsfargo':
      return await downloadWellsStatements(page, credentials, dateRange, format);
    case 'citi':
    case 'citibank':
      return await downloadCitiStatements(page, credentials, dateRange, format);
    default:
      throw new Error(`Unsupported bank: ${bank}`);
  }
}

async function downloadChaseStatements(page, credentials, dateRange, format) {
  await page.goto('https://secure01a.chase.com/web/auth/dashboard', { waitUntil: 'networkidle2' });
  
  // Login process
  await page.waitForSelector('#userId-input-field');
  await page.type('#userId-input-field', credentials.username);
  await page.type('#password-input-field', credentials.password);
  await page.click('#signin-button');
  
  // Wait for dashboard
  await page.waitForSelector('.account-tile', { timeout: 30000 });
  
  // Navigate to statements
  await page.click('a[href*="statements"]');
  await page.waitForSelector('.statement-list');
  
  // Select date range and download
  const downloads = [];
  const statements = await page.$$('.statement-row');
  
  for (let i = 0; i < Math.min(statements.length, 12); i++) {
    const statement = statements[i];
    const date = await statement.$eval('.statement-date', el => el.textContent);
    
    if (isDateInRange(date, dateRange)) {
      await statement.click();
      await page.waitForTimeout(2000);
      
      const downloadButton = await page.$('.download-statement');
      if (downloadButton) {
        await downloadButton.click();
        downloads.push({
          date,
          status: 'downloaded',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return {
    bank: 'Chase',
    downloads,
    downloadPath: path.join(process.cwd(), 'downloads', 'bank-statements')
  };
}

async function downloadBofAStatements(page, credentials, dateRange, format) {
  await page.goto('https://secure.bankofamerica.com/login/', { waitUntil: 'networkidle2' });
  
  // Login
  await page.waitForSelector('#onlineId1');
  await page.type('#onlineId1', credentials.username);
  await page.type('#passcode1', credentials.password);
  await page.click('#hp-sign-in-btn');
  
  // Wait for account overview
  await page.waitForSelector('.AccountName', { timeout: 30000 });
  
  // Navigate to statements
  await page.click('a[href*="statements"]');
  await page.waitForSelector('.statement-list');
  
  const downloads = [];
  const statements = await page.$$('.statement-item');
  
  for (const statement of statements) {
    const date = await statement.$eval('.date', el => el.textContent);
    
    if (isDateInRange(date, dateRange)) {
      const downloadLink = await statement.$('.download-pdf');
      if (downloadLink) {
        await downloadLink.click();
        downloads.push({
          date,
          status: 'downloaded',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return {
    bank: 'Bank of America',
    downloads,
    downloadPath: path.join(process.cwd(), 'downloads', 'bank-statements')
  };
}

async function downloadWellsStatements(page, credentials, dateRange, format) {
  await page.goto('https://connect.secure.wellsfargo.com/auth/login/', { waitUntil: 'networkidle2' });
  
  // Login
  await page.waitForSelector('#userid');
  await page.type('#userid', credentials.username);
  await page.type('#password', credentials.password);
  await page.click('.btn-primary');
  
  // Wait for dashboard
  await page.waitForSelector('.account-summary', { timeout: 30000 });
  
  // Navigate to statements
  await page.click('a[href*="statements"]');
  await page.waitForSelector('.statement-list');
  
  const downloads = [];
  const statements = await page.$$('.statement-row');
  
  for (const statement of statements) {
    const date = await statement.$eval('.statement-date', el => el.textContent);
    
    if (isDateInRange(date, dateRange)) {
      const downloadBtn = await statement.$('.download-btn');
      if (downloadBtn) {
        await downloadBtn.click();
        downloads.push({
          date,
          status: 'downloaded',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return {
    bank: 'Wells Fargo',
    downloads,
    downloadPath: path.join(process.cwd(), 'downloads', 'bank-statements')
  };
}

async function downloadCitiStatements(page, credentials, dateRange, format) {
  await page.goto('https://online.citi.com/US/login.do', { waitUntil: 'networkidle2' });
  
  // Login
  await page.waitForSelector('#username');
  await page.type('#username', credentials.username);
  await page.type('#password', credentials.password);
  await page.click('#signInBtn');
  
  // Wait for account summary
  await page.waitForSelector('.account-tile', { timeout: 30000 });
  
  // Navigate to statements
  await page.click('a[href*="statements"]');
  await page.waitForSelector('.statement-list');
  
  const downloads = [];
  const statements = await page.$$('.statement-item');
  
  for (const statement of statements) {
    const date = await statement.$eval('.date', el => el.textContent);
    
    if (isDateInRange(date, dateRange)) {
      const downloadLink = await statement.$('.download-statement');
      if (downloadLink) {
        await downloadLink.click();
        downloads.push({
          date,
          status: 'downloaded',
          timestamp: new Date().toISOString()
        });
      }
    }
  }
  
  return {
    bank: 'Citibank',
    downloads,
    downloadPath: path.join(process.cwd(), 'downloads', 'bank-statements')
  };
}

function isDateInRange(dateString, range) {
  const date = new Date(dateString);
  const start = new Date(range.start);
  const end = new Date(range.end);
  
  return date >= start && date <= end;
}

// Security helper for credential encryption
export function encryptCredentials(credentials, key) {
  const cipher = crypto.createCipher('aes-256-cbc', key);
  let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decryptCredentials(encryptedCredentials, key) {
  const decipher = crypto.createDecipher('aes-256-cbc', key);
  let decrypted = decipher.update(encryptedCredentials, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return JSON.parse(decrypted);
}