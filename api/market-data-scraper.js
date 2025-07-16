// Windows-native market data scraper with Puppeteer
import puppeteer from 'puppeteer';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols, source = 'yahoo', format = 'json' } = req.body;
  
  try {
    const browser = await puppeteer.launch({
      headless: false, // Show browser for debugging
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const results = [];
    
    for (const symbol of symbols) {
      const data = await scrapeMarketData(browser, symbol, source);
      results.push(data);
    }

    await browser.close();

    // Save to local file system
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `market-data-${timestamp}.${format}`;
    const filepath = path.join(process.cwd(), 'data', filename);
    
    fs.writeFileSync(filepath, JSON.stringify(results, null, 2));

    res.json({
      success: true,
      data: results,
      savedTo: filepath
    });

  } catch (error) {
    console.error('Market data scraping failed:', error);
    res.status(500).json({ error: error.message });
  }
}

async function scrapeMarketData(browser, symbol, source) {
  const page = await browser.newPage();
  
  try {
    switch (source) {
      case 'yahoo':
        return await scrapeYahooFinance(page, symbol);
      case 'bloomberg':
        return await scrapeBloomberg(page, symbol);
      case 'marketwatch':
        return await scrapeMarketWatch(page, symbol);
      default:
        throw new Error(`Unsupported source: ${source}`);
    }
  } finally {
    await page.close();
  }
}

async function scrapeYahooFinance(page, symbol) {
  await page.goto(`https://finance.yahoo.com/quote/${symbol}`, { waitUntil: 'networkidle2' });
  
  const data = await page.evaluate(() => {
    const priceElement = document.querySelector('[data-symbol] [data-field="regularMarketPrice"]');
    const changeElement = document.querySelector('[data-symbol] [data-field="regularMarketChange"]');
    const changePercentElement = document.querySelector('[data-symbol] [data-field="regularMarketChangePercent"]');
    
    return {
      symbol: window.location.pathname.split('/').pop(),
      price: priceElement?.textContent?.trim(),
      change: changeElement?.textContent?.trim(),
      changePercent: changePercentElement?.textContent?.trim(),
      timestamp: new Date().toISOString()
    };
  });
  
  return data;
}

async function scrapeBloomberg(page, symbol) {
  await page.goto(`https://www.bloomberg.com/quote/${symbol}:US`, { waitUntil: 'networkidle2' });
  
  const data = await page.evaluate(() => {
    const priceElement = document.querySelector('[data-module="PriceAndChange"] .price');
    const changeElement = document.querySelector('[data-module="PriceAndChange"] .change');
    
    return {
      symbol: window.location.pathname.split('/').pop().split(':')[0],
      price: priceElement?.textContent?.trim(),
      change: changeElement?.textContent?.trim(),
      timestamp: new Date().toISOString()
    };
  });
  
  return data;
}

async function scrapeMarketWatch(page, symbol) {
  await page.goto(`https://www.marketwatch.com/investing/stock/${symbol}`, { waitUntil: 'networkidle2' });
  
  const data = await page.evaluate(() => {
    const priceElement = document.querySelector('.value');
    const changeElement = document.querySelector('.change--point--q');
    
    return {
      symbol: window.location.pathname.split('/').pop(),
      price: priceElement?.textContent?.trim(),
      change: changeElement?.textContent?.trim(),
      timestamp: new Date().toISOString()
    };
  });
  
  return data;
}