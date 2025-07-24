#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class PuppeteerMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'puppeteer-mcp-server',
        version: '0.1.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
    
    this.server.onerror = (error) => console.error('[MCP Error]', error);
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  setupToolHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'generate_pdf',
          description: 'Generate PDF from webpage or HTML content',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to convert to PDF (optional if html_content provided)',
              },
              html_content: {
                type: 'string',
                description: 'HTML content to convert to PDF (optional if url provided)',
              },
              output_path: {
                type: 'string',
                description: 'Output PDF file path',
              },
              options: {
                type: 'object',
                description: 'PDF generation options',
                properties: {
                  format: {
                    type: 'string',
                    enum: ['A4', 'A3', 'A5', 'Legal', 'Letter', 'Tabloid'],
                    default: 'A4'
                  },
                  landscape: {
                    type: 'boolean',
                    description: 'Generate PDF in landscape orientation',
                    default: false
                  },
                  margin: {
                    type: 'object',
                    properties: {
                      top: { type: 'string', default: '1cm' },
                      right: { type: 'string', default: '1cm' },
                      bottom: { type: 'string', default: '1cm' },
                      left: { type: 'string', default: '1cm' }
                    }
                  },
                  displayHeaderFooter: {
                    type: 'boolean',
                    description: 'Display header and footer',
                    default: false
                  }
                }
              },
              wait_for: {
                type: 'string',
                description: 'CSS selector or timeout to wait for before PDF generation'
              }
            },
            required: ['output_path'],
          },
        },
        {
          name: 'scrape_webpage',
          description: 'Extract data from webpages using CSS selectors',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to scrape',
              },
              selectors: {
                type: 'object',
                description: 'CSS selectors to extract data',
                additionalProperties: {
                  type: 'string'
                }
              },
              wait_for: {
                type: 'string',
                description: 'CSS selector to wait for before scraping'
              },
              timeout: {
                type: 'number',
                description: 'Timeout in milliseconds',
                default: 30000
              },
              include_screenshots: {
                type: 'boolean',
                description: 'Include screenshot of the page',
                default: false
              }
            },
            required: ['url', 'selectors'],
          },
        },
        {
          name: 'extract_text_from_page',
          description: 'Extract all text content from a webpage',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to extract text from',
              },
              remove_elements: {
                type: 'array',
                items: { type: 'string' },
                description: 'CSS selectors of elements to remove before extraction',
                default: ['script', 'style', 'nav', 'footer', 'header']
              },
              format: {
                type: 'string',
                enum: ['text', 'markdown', 'html'],
                description: 'Output format',
                default: 'text'
              },
              save_to_file: {
                type: 'string',
                description: 'Optional file path to save extracted text'
              }
            },
            required: ['url'],
          },
        },
        {
          name: 'monitor_webpage_changes',
          description: 'Monitor webpage for changes and capture differences',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to monitor',
              },
              selector: {
                type: 'string',
                description: 'CSS selector to monitor for changes (optional)',
              },
              interval: {
                type: 'number',
                description: 'Check interval in seconds',
                default: 60
              },
              duration: {
                type: 'number',
                description: 'Total monitoring duration in seconds',
                default: 300
              },
              capture_screenshots: {
                type: 'boolean',
                description: 'Capture screenshots when changes detected',
                default: true
              }
            },
            required: ['url'],
          },
        },
        {
          name: 'batch_url_processing',
          description: 'Process multiple URLs for scraping or PDF generation',
          inputSchema: {
            type: 'object',
            properties: {
              urls: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of URLs to process',
              },
              operation: {
                type: 'string',
                enum: ['scrape', 'pdf', 'screenshot', 'text_extract'],
                description: 'Operation to perform on each URL'
              },
              output_directory: {
                type: 'string',
                description: 'Directory to save output files',
              },
              batch_config: {
                type: 'object',
                description: 'Configuration for batch processing',
                properties: {
                  concurrent_limit: {
                    type: 'number',
                    description: 'Maximum concurrent operations',
                    default: 3
                  },
                  delay_between: {
                    type: 'number',
                    description: 'Delay between operations in milliseconds',
                    default: 1000
                  }
                }
              }
            },
            required: ['urls', 'operation', 'output_directory'],
          },
        },
        {
          name: 'form_automation',
          description: 'Automate form filling and submission',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL containing the form',
              },
              form_data: {
                type: 'object',
                description: 'Form field data',
                additionalProperties: {
                  type: 'string'
                }
              },
              form_selector: {
                type: 'string',
                description: 'CSS selector for the form element',
                default: 'form'
              },
              submit: {
                type: 'boolean',
                description: 'Whether to submit the form after filling',
                default: false
              },
              wait_after_submit: {
                type: 'number',
                description: 'Time to wait after submission in milliseconds',
                default: 3000
              },
              capture_result: {
                type: 'boolean',
                description: 'Capture screenshot/text after form submission',
                default: true
              }
            },
            required: ['url', 'form_data'],
          },
        },
        {
          name: 'performance_analysis',
          description: 'Analyze webpage performance metrics',
          inputSchema: {
            type: 'object',
            properties: {
              url: {
                type: 'string',
                description: 'URL to analyze',
              },
              metrics: {
                type: 'array',
                items: { 
                  type: 'string',
                  enum: ['load_time', 'dom_ready', 'first_paint', 'largest_contentful_paint', 'network_requests', 'resource_sizes']
                },
                description: 'Performance metrics to collect',
                default: ['load_time', 'dom_ready', 'network_requests']
              },
              runs: {
                type: 'number',
                description: 'Number of test runs for averaging',
                default: 3
              },
              device: {
                type: 'string',
                enum: ['desktop', 'mobile', 'tablet'],
                description: 'Device type for testing',
                default: 'desktop'
              }
            },
            required: ['url'],
          },
        },
        {
          name: 'content_comparison',
          description: 'Compare content between two webpages or snapshots',
          inputSchema: {
            type: 'object',
            properties: {
              url1: {
                type: 'string',
                description: 'First URL to compare',
              },
              url2: {
                type: 'string',
                description: 'Second URL to compare',
              },
              comparison_type: {
                type: 'string',
                enum: ['text', 'visual', 'dom', 'combined'],
                description: 'Type of comparison to perform',
                default: 'combined'
              },
              selector: {
                type: 'string',
                description: 'CSS selector to focus comparison on specific elements'
              },
              threshold: {
                type: 'number',
                description: 'Similarity threshold (0-1)',
                default: 0.95
              }
            },
            required: ['url1', 'url2'],
          },
        }
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case 'generate_pdf':
          return await this.generatePDF(request.params.arguments);
        case 'scrape_webpage':
          return await this.scrapeWebpage(request.params.arguments);
        case 'extract_text_from_page':
          return await this.extractTextFromPage(request.params.arguments);
        case 'monitor_webpage_changes':
          return await this.monitorWebpageChanges(request.params.arguments);
        case 'batch_url_processing':
          return await this.batchUrlProcessing(request.params.arguments);
        case 'form_automation':
          return await this.formAutomation(request.params.arguments);
        case 'performance_analysis':
          return await this.performanceAnalysis(request.params.arguments);
        case 'content_comparison':
          return await this.contentComparison(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  async generatePDF(args) {
    try {
      const {
        url,
        html_content,
        output_path,
        options = {},
        wait_for
      } = args;

      if (!url && !html_content) {
        throw new Error('Either url or html_content must be provided');
      }

      // Note: This is a mock implementation since we can't actually import puppeteer
      // In a real implementation, you would use: const puppeteer = require('puppeteer');
      
      const result = {
        success: true,
        output_path,
        message: 'PDF generation completed successfully',
        details: {
          source: url || 'HTML content',
          format: options.format || 'A4',
          landscape: options.landscape || false,
          pages: 1, // This would be calculated from actual PDF
          file_size: '2.3 MB', // This would be actual file size
        }
      };

      // Mock PDF creation
      const mockPdfContent = `PDF Mock Content for: ${url || 'HTML Content'}
Generated with options: ${JSON.stringify(options, null, 2)}
Timestamp: ${new Date().toISOString()}`;

      await fs.writeFile(output_path, mockPdfContent, 'utf-8');

      let resultText = `📄 PDF Generation Results:\n\n`;
      resultText += `✅ Status: ${result.message}\n`;
      resultText += `📁 Output: ${result.output_path}\n`;
      resultText += `🌐 Source: ${result.details.source}\n`;
      resultText += `📄 Format: ${result.details.format}\n`;
      resultText += `📐 Landscape: ${result.details.landscape ? 'Yes' : 'No'}\n`;
      resultText += `📊 Estimated Pages: ${result.details.pages}\n`;
      resultText += `💾 Estimated Size: ${result.details.file_size}\n\n`;
      resultText += `⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  async scrapeWebpage(args) {
    try {
      const {
        url,
        selectors,
        wait_for,
        timeout = 30000,
        include_screenshots = false
      } = args;

      // Mock scraping results
      const scrapedData = {};
      for (const [key, selector] of Object.entries(selectors)) {
        // Simulate scraped content
        scrapedData[key] = `Mock content from selector '${selector}' on ${url}`;
      }

      const result = {
        url,
        timestamp: new Date().toISOString(),
        data: scrapedData,
        selectors_found: Object.keys(selectors).length,
        load_time: Math.floor(Math.random() * 3000) + 500, // Mock load time
        status: 'success'
      };

      let resultText = `🕷️ Web Scraping Results:\n\n`;
      resultText += `🌐 URL: ${url}\n`;
      resultText += `⏰ Scraped: ${result.timestamp}\n`;
      resultText += `🎯 Selectors Found: ${result.selectors_found}\n`;
      resultText += `⚡ Load Time: ${result.load_time}ms\n\n`;

      resultText += `📊 Extracted Data:\n`;
      for (const [key, value] of Object.entries(result.data)) {
        resultText += `• ${key}: ${value}\n`;
      }

      if (include_screenshots) {
        resultText += `\n📸 Screenshot: Captured (mock)\n`;
      }

      resultText += `\n⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to scrape webpage: ${error.message}`);
    }
  }

  async extractTextFromPage(args) {
    try {
      const {
        url,
        remove_elements = ['script', 'style', 'nav', 'footer', 'header'],
        format = 'text',
        save_to_file
      } = args;

      // Mock text extraction
      const extractedText = `Mock extracted text from: ${url}

This is a simulated text extraction result. In a real implementation, this would contain:
- Main article content
- Headings and paragraphs
- Links and important text elements
- Cleaned content without ${remove_elements.join(', ')} elements

The content would be formatted as: ${format}

Generated at: ${new Date().toISOString()}`;

      if (save_to_file) {
        await fs.writeFile(save_to_file, extractedText, 'utf-8');
      }

      const result = {
        url,
        format,
        text_length: extractedText.length,
        word_count: extractedText.split(/\s+/).length,
        removed_elements: remove_elements,
        saved_to_file: save_to_file || null
      };

      let resultText = `📝 Text Extraction Results:\n\n`;
      resultText += `🌐 URL: ${url}\n`;
      resultText += `📄 Format: ${format}\n`;
      resultText += `📏 Text Length: ${result.text_length} characters\n`;
      resultText += `📊 Word Count: ${result.word_count} words\n`;
      resultText += `🗑️ Removed Elements: ${remove_elements.join(', ')}\n`;
      
      if (save_to_file) {
        resultText += `💾 Saved to: ${save_to_file}\n`;
      }

      resultText += `\n📋 Extracted Text Preview:\n`;
      resultText += `${extractedText.substring(0, 500)}${extractedText.length > 500 ? '...' : ''}\n\n`;

      resultText += `⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  async monitorWebpageChanges(args) {
    try {
      const {
        url,
        selector,
        interval = 60,
        duration = 300,
        capture_screenshots = true
      } = args;

      const checks = Math.floor(duration / interval);
      const changes = Math.floor(Math.random() * 3); // Mock changes detected

      const result = {
        url,
        monitoring_duration: duration,
        check_interval: interval,
        total_checks: checks,
        changes_detected: changes,
        monitored_selector: selector || 'entire page',
        screenshots_captured: capture_screenshots ? changes : 0,
        start_time: new Date().toISOString(),
        end_time: new Date(Date.now() + duration * 1000).toISOString()
      };

      let resultText = `👁️ Webpage Monitoring Results:\n\n`;
      resultText += `🌐 URL: ${url}\n`;
      resultText += `🎯 Monitored: ${result.monitored_selector}\n`;
      resultText += `⏱️ Duration: ${duration} seconds\n`;
      resultText += `🔄 Check Interval: ${interval} seconds\n`;
      resultText += `📊 Total Checks: ${checks}\n`;
      resultText += `🚨 Changes Detected: ${changes}\n`;
      
      if (capture_screenshots) {
        resultText += `📸 Screenshots Captured: ${result.screenshots_captured}\n`;
      }

      resultText += `⏰ Started: ${result.start_time}\n`;
      resultText += `🏁 Ended: ${result.end_time}\n\n`;

      if (changes > 0) {
        resultText += `📋 Change Log:\n`;
        for (let i = 1; i <= changes; i++) {
          const changeTime = new Date(Date.now() + (i * interval * 1000 / changes));
          resultText += `• Change ${i}: ${changeTime.toLocaleTimeString()} - Content modification detected\n`;
        }
      } else {
        resultText += `✅ No changes detected during monitoring period\n`;
      }

      resultText += `\n⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to monitor webpage: ${error.message}`);
    }
  }

  async batchUrlProcessing(args) {
    try {
      const {
        urls,
        operation,
        output_directory,
        batch_config = {}
      } = args;

      const { concurrent_limit = 3, delay_between = 1000 } = batch_config;
      const results = [];

      // Simulate batch processing
      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        const filename = `${operation}_${i + 1}_${Date.now()}`;
        
        results.push({
          url,
          operation,
          output_file: path.join(output_directory, filename),
          status: Math.random() > 0.1 ? 'success' : 'failed',
          processing_time: Math.floor(Math.random() * 5000) + 1000,
          file_size: Math.floor(Math.random() * 1000000) + 10000
        });
      }

      const successful = results.filter(r => r.status === 'success').length;
      const failed = results.length - successful;
      const totalTime = Math.max(...results.map(r => r.processing_time));

      let resultText = `📦 Batch Processing Results:\n\n`;
      resultText += `📊 Summary:\n`;
      resultText += `• Total URLs: ${urls.length}\n`;
      resultText += `• Operation: ${operation}\n`;
      resultText += `• Successful: ${successful}\n`;
      resultText += `• Failed: ${failed}\n`;
      resultText += `• Concurrent Limit: ${concurrent_limit}\n`;
      resultText += `• Delay: ${delay_between}ms\n`;
      resultText += `• Total Time: ${totalTime}ms\n`;
      resultText += `• Output Directory: ${output_directory}\n\n`;

      resultText += `📋 Processing Results:\n`;
      results.forEach((result, index) => {
        const icon = result.status === 'success' ? '✅' : '❌';
        resultText += `${icon} ${index + 1}. ${result.url} (${result.processing_time}ms)\n`;
        if (result.status === 'success') {
          resultText += `   📁 Output: ${path.basename(result.output_file)}\n`;
          resultText += `   💾 Size: ${this.formatBytes(result.file_size)}\n`;
        }
      });

      resultText += `\n⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed batch processing: ${error.message}`);
    }
  }

  async formAutomation(args) {
    try {
      const {
        url,
        form_data,
        form_selector = 'form',
        submit = false,
        wait_after_submit = 3000,
        capture_result = true
      } = args;

      const result = {
        url,
        form_selector,
        fields_filled: Object.keys(form_data).length,
        submitted: submit,
        wait_time: submit ? wait_after_submit : 0,
        screenshot_captured: capture_result,
        timestamp: new Date().toISOString(),
        status: 'success'
      };

      let resultText = `🤖 Form Automation Results:\n\n`;
      resultText += `🌐 URL: ${url}\n`;
      resultText += `📝 Form Selector: ${form_selector}\n`;
      resultText += `📊 Fields Filled: ${result.fields_filled}\n`;
      resultText += `📤 Submitted: ${submit ? 'Yes' : 'No'}\n`;
      
      if (submit) {
        resultText += `⏱️ Wait After Submit: ${wait_after_submit}ms\n`;
      }
      
      resultText += `📸 Result Captured: ${capture_result ? 'Yes' : 'No'}\n`;
      resultText += `⏰ Completed: ${result.timestamp}\n\n`;

      resultText += `📋 Form Data Filled:\n`;
      for (const [field, value] of Object.entries(form_data)) {
        const displayValue = value.length > 50 ? value.substring(0, 50) + '...' : value;
        resultText += `• ${field}: ${displayValue}\n`;
      }

      if (submit) {
        resultText += `\n✅ Form submitted successfully\n`;
        if (capture_result) {
          resultText += `📸 Result page captured\n`;
        }
      }

      resultText += `\n⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed form automation: ${error.message}`);
    }
  }

  async performanceAnalysis(args) {
    try {
      const {
        url,
        metrics = ['load_time', 'dom_ready', 'network_requests'],
        runs = 3,
        device = 'desktop'
      } = args;

      // Mock performance data
      const mockMetrics = {
        load_time: Array.from({length: runs}, () => Math.floor(Math.random() * 3000) + 500),
        dom_ready: Array.from({length: runs}, () => Math.floor(Math.random() * 2000) + 300),
        first_paint: Array.from({length: runs}, () => Math.floor(Math.random() * 1500) + 200),
        largest_contentful_paint: Array.from({length: runs}, () => Math.floor(Math.random() * 2500) + 800),
        network_requests: Array.from({length: runs}, () => Math.floor(Math.random() * 50) + 10),
        resource_sizes: Array.from({length: runs}, () => Math.floor(Math.random() * 2000000) + 500000)
      };

      const results = {};
      metrics.forEach(metric => {
        const values = mockMetrics[metric] || [0];
        results[metric] = {
          values,
          average: values.reduce((a, b) => a + b, 0) / values.length,
          min: Math.min(...values),
          max: Math.max(...values)
        };
      });

      let resultText = `⚡ Performance Analysis Results:\n\n`;
      resultText += `🌐 URL: ${url}\n`;
      resultText += `📱 Device: ${device}\n`;
      resultText += `🔄 Test Runs: ${runs}\n`;
      resultText += `📊 Metrics Analyzed: ${metrics.length}\n`;
      resultText += `⏰ Analyzed: ${new Date().toISOString()}\n\n`;

      resultText += `📈 Performance Metrics:\n`;
      for (const [metric, data] of Object.entries(results)) {
        resultText += `\n🎯 ${metric.replace(/_/g, ' ').toUpperCase()}:\n`;
        resultText += `  • Average: ${this.formatMetric(metric, data.average)}\n`;
        resultText += `  • Best: ${this.formatMetric(metric, data.min)}\n`;
        resultText += `  • Worst: ${this.formatMetric(metric, data.max)}\n`;
        resultText += `  • Values: [${data.values.map(v => this.formatMetric(metric, v)).join(', ')}]\n`;
      }

      // Performance score (mock)
      const score = Math.floor(Math.random() * 30) + 70;
      resultText += `\n🏆 Overall Performance Score: ${score}/100\n`;
      
      if (score >= 90) resultText += `✅ Excellent performance!`;
      else if (score >= 70) resultText += `⚠️ Good performance with room for improvement`;
      else resultText += `❌ Poor performance - optimization needed`;

      resultText += `\n\n⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed performance analysis: ${error.message}`);
    }
  }

  async contentComparison(args) {
    try {
      const {
        url1,
        url2,
        comparison_type = 'combined',
        selector,
        threshold = 0.95
      } = args;

      // Mock comparison results
      const similarity = Math.random() * 0.4 + 0.6; // 60-100% similarity
      const differences = Math.floor(Math.random() * 10) + 1;

      const result = {
        url1,
        url2,
        comparison_type,
        selector: selector || 'entire page',
        similarity_score: similarity,
        threshold,
        meets_threshold: similarity >= threshold,
        differences_found: differences,
        timestamp: new Date().toISOString()
      };

      let resultText = `🔍 Content Comparison Results:\n\n`;
      resultText += `🌐 URL 1: ${url1}\n`;
      resultText += `🌐 URL 2: ${url2}\n`;
      resultText += `🎯 Comparison Type: ${comparison_type}\n`;
      resultText += `📍 Focus Area: ${result.selector}\n`;
      resultText += `📊 Similarity Score: ${(similarity * 100).toFixed(1)}%\n`;
      resultText += `🎚️ Threshold: ${(threshold * 100).toFixed(1)}%\n`;
      resultText += `✅ Meets Threshold: ${result.meets_threshold ? 'Yes' : 'No'}\n`;
      resultText += `🔢 Differences Found: ${differences}\n`;
      resultText += `⏰ Compared: ${result.timestamp}\n\n`;

      // Mock differences
      if (differences > 0) {
        resultText += `📋 Key Differences:\n`;
        for (let i = 1; i <= Math.min(differences, 5); i++) {
          resultText += `• Difference ${i}: Content variation in section ${i}\n`;
        }
        if (differences > 5) {
          resultText += `... and ${differences - 5} more differences\n`;
        }
      }

      resultText += `\n🎯 Comparison Summary:\n`;
      if (similarity >= 0.95) {
        resultText += `✅ Pages are nearly identical`;
      } else if (similarity >= 0.80) {
        resultText += `⚠️ Pages have minor differences`;
      } else if (similarity >= 0.60) {
        resultText += `🔄 Pages have moderate differences`;
      } else {
        resultText += `❌ Pages are significantly different`;
      }

      resultText += `\n\n⚠️ Note: This is a mock implementation. Install puppeteer for full functionality:\n`;
      resultText += `npm install puppeteer`;

      return {
        content: [
          {
            type: 'text',
            text: resultText,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed content comparison: ${error.message}`);
    }
  }

  // Helper methods
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatMetric(metric, value) {
    if (metric.includes('time') || metric.includes('paint')) {
      return `${Math.round(value)}ms`;
    } else if (metric.includes('size')) {
      return this.formatBytes(value);
    } else {
      return Math.round(value).toString();
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('PuppeteerMCP server running on stdio');
  }
}

const server = new PuppeteerMCPServer();
server.run().catch(console.error);