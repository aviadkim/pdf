#!/usr/bin/env node

// MCP Server for Puppeteer integration with WSL optimization
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { browserPool, convertPDFToImages, WSL_PUPPETEER_CONFIG } from './lib/puppeteer-config.js';

class PuppeteerMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'puppeteer-pdf-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'convert_pdf_to_images',
            description: 'Convert PDF to images using optimized Puppeteer configuration for WSL',
            inputSchema: {
              type: 'object',
              properties: {
                pdfBase64: {
                  type: 'string',
                  description: 'Base64 encoded PDF content'
                },
                options: {
                  type: 'object',
                  properties: {
                    maxPages: { type: 'number', default: 10 },
                    quality: { type: 'number', default: 80 },
                    format: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
                    scale: { type: 'number', default: 1.5 }
                  }
                }
              },
              required: ['pdfBase64']
            }
          },
          {
            name: 'capture_webpage',
            description: 'Capture webpage screenshot using WSL-optimized Puppeteer',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to capture'
                },
                options: {
                  type: 'object',
                  properties: {
                    fullPage: { type: 'boolean', default: true },
                    format: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
                    quality: { type: 'number', default: 80 },
                    viewport: {
                      type: 'object',
                      properties: {
                        width: { type: 'number', default: 1200 },
                        height: { type: 'number', default: 800 }
                      }
                    }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'extract_page_content',
            description: 'Extract text content from webpage using Puppeteer',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to extract content from'
                },
                selector: {
                  type: 'string',
                  description: 'CSS selector to target specific elements (optional)'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'browser_status',
            description: 'Get status of browser pool and WSL configuration',
            inputSchema: {
              type: 'object',
              properties: {}
            }
          }
        ]
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'convert_pdf_to_images':
            return await this.convertPDFToImages(args);
          
          case 'capture_webpage':
            return await this.captureWebpage(args);
          
          case 'extract_page_content':
            return await this.extractPageContent(args);
          
          case 'browser_status':
            return await this.getBrowserStatus();
          
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{
            type: 'text',
            text: `Error: ${error.message}`
          }],
          isError: true
        };
      }
    });
  }

  async convertPDFToImages(args) {
    const { pdfBase64, options = {} } = args;
    
    if (!pdfBase64) {
      throw new Error('pdfBase64 is required');
    }

    try {
      const pdfBuffer = Buffer.from(pdfBase64, 'base64');
      const result = await convertPDFToImages(pdfBuffer, options);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            totalPages: result.totalPages,
            imagesGenerated: result.images.length,
            metadata: result.metadata,
            // Include first image as example
            firstImage: result.images[0] ? {
              page: result.images[0].page,
              base64: result.images[0].base64.substring(0, 100) + '...'
            } : null
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`PDF conversion failed: ${error.message}`);
    }
  }

  async captureWebpage(args) {
    const { url, options = {} } = args;
    
    if (!url) {
      throw new Error('url is required');
    }

    try {
      const browser = await browserPool.getBrowser();
      const page = await browser.newPage();

      // Set viewport if specified
      if (options.viewport) {
        await page.setViewport(options.viewport);
      }

      // Navigate to URL
      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      // Capture screenshot
      const screenshot = await page.screenshot({
        type: options.format || 'png',
        quality: options.format === 'jpeg' ? (options.quality || 80) : undefined,
        fullPage: options.fullPage !== false
      });

      await page.close();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: url,
            format: options.format || 'png',
            size: screenshot.length,
            base64: screenshot.toString('base64').substring(0, 100) + '...',
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Webpage capture failed: ${error.message}`);
    }
  }

  async extractPageContent(args) {
    const { url, selector } = args;
    
    if (!url) {
      throw new Error('url is required');
    }

    try {
      const browser = await browserPool.getBrowser();
      const page = await browser.newPage();

      await page.goto(url, { 
        waitUntil: 'networkidle0',
        timeout: 30000 
      });

      let content;
      if (selector) {
        content = await page.$eval(selector, el => el.textContent);
      } else {
        content = await page.evaluate(() => document.body.textContent);
      }

      await page.close();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: url,
            selector: selector || 'body',
            contentLength: content.length,
            content: content.substring(0, 1000) + (content.length > 1000 ? '...' : ''),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Content extraction failed: ${error.message}`);
    }
  }

  async getBrowserStatus() {
    const isWSL = !!process.env.WSL_DISTRO_NAME;
    const browserCount = browserPool.browsers.length;
    const activeBrowser = browserPool.currentBrowser ? 'connected' : 'none';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          environment: {
            isWSL: isWSL,
            wslDistro: process.env.WSL_DISTRO_NAME || 'none',
            nodeVersion: process.version,
            platform: process.platform
          },
          browserPool: {
            activeBrowsers: browserCount,
            currentBrowser: activeBrowser,
            maxBrowsers: browserPool.maxBrowsers
          },
          configuration: {
            headless: WSL_PUPPETEER_CONFIG.headless,
            args: WSL_PUPPETEER_CONFIG.args.length,
            timeout: WSL_PUPPETEER_CONFIG.timeout
          },
          status: 'ready',
          timestamp: new Date().toISOString()
        }, null, 2)
      }]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Puppeteer MCP Server running with WSL optimization');
  }
}

// Start the server
const server = new PuppeteerMCPServer();
server.run().catch(console.error);