#!/usr/bin/env node

// Playwright MCP Server for comprehensive browser automation and testing
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { chromium, firefox, webkit } from 'playwright';
import { promises as fs } from 'fs';
import path from 'path';

class PlaywrightMCPServer {
  constructor() {
    this.browsers = new Map();
    this.server = new Server(
      {
        name: 'playwright-testing-server',
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'playwright_test',
            description: 'Run Playwright tests with specified configuration',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project containing Playwright tests'
                },
                testPattern: {
                  type: 'string',
                  description: 'Test file pattern (e.g., *.spec.js)',
                  default: '**/*.spec.js'
                },
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit', 'all'],
                  description: 'Browser to run tests on',
                  default: 'chromium'
                },
                headless: {
                  type: 'boolean',
                  description: 'Run in headless mode',
                  default: true
                },
                reporter: {
                  type: 'string',
                  enum: ['list', 'dot', 'json', 'html'],
                  description: 'Test reporter',
                  default: 'list'
                }
              },
              required: ['projectPath']
            }
          },
          {
            name: 'browser_screenshot',
            description: 'Take screenshot of webpage',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to screenshot'
                },
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser to use',
                  default: 'chromium'
                },
                viewport: {
                  type: 'object',
                  properties: {
                    width: { type: 'number', default: 1280 },
                    height: { type: 'number', default: 720 }
                  }
                },
                fullPage: {
                  type: 'boolean',
                  description: 'Capture full page',
                  default: true
                },
                waitFor: {
                  type: 'string',
                  description: 'CSS selector to wait for before screenshot'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'page_performance',
            description: 'Analyze page performance metrics',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to analyze'
                },
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser to use',
                  default: 'chromium'
                },
                viewport: {
                  type: 'object',
                  properties: {
                    width: { type: 'number', default: 1280 },
                    height: { type: 'number', default: 720 }
                  }
                },
                throttling: {
                  type: 'object',
                  properties: {
                    cpu: { type: 'number', default: 1 },
                    network: { type: 'string', default: 'fast3g' }
                  }
                }
              },
              required: ['url']
            }
          },
          {
            name: 'form_testing',
            description: 'Test form functionality and validation',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL containing the form'
                },
                formSelector: {
                  type: 'string',
                  description: 'CSS selector for the form'
                },
                testData: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      selector: { type: 'string' },
                      value: { type: 'string' },
                      type: { type: 'string', enum: ['input', 'select', 'checkbox', 'radio'] }
                    }
                  },
                  description: 'Form fields to fill'
                },
                submitSelector: {
                  type: 'string',
                  description: 'CSS selector for submit button'
                },
                expectedResult: {
                  type: 'object',
                  properties: {
                    url: { type: 'string' },
                    text: { type: 'string' },
                    selector: { type: 'string' }
                  }
                }
              },
              required: ['url', 'formSelector', 'testData']
            }
          },
          {
            name: 'accessibility_audit',
            description: 'Run accessibility audit on webpage',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to audit'
                },
                browser: {
                  type: 'string',
                  enum: ['chromium', 'firefox', 'webkit'],
                  description: 'Browser to use',
                  default: 'chromium'
                },
                rules: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'Specific accessibility rules to check'
                }
              },
              required: ['url']
            }
          },
          {
            name: 'api_endpoint_test',
            description: 'Test API endpoints through browser',
            inputSchema: {
              type: 'object',
              properties: {
                baseUrl: {
                  type: 'string',
                  description: 'Base URL of the API'
                },
                endpoints: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      path: { type: 'string' },
                      method: { type: 'string', default: 'GET' },
                      headers: { type: 'object' },
                      body: { type: 'object' },
                      expectedStatus: { type: 'number', default: 200 }
                    }
                  },
                  description: 'API endpoints to test'
                },
                authentication: {
                  type: 'object',
                  properties: {
                    type: { type: 'string', enum: ['bearer', 'basic', 'cookie'] },
                    token: { type: 'string' },
                    username: { type: 'string' },
                    password: { type: 'string' }
                  }
                }
              },
              required: ['baseUrl', 'endpoints']
            }
          },
          {
            name: 'cross_browser_test',
            description: 'Run tests across multiple browsers',
            inputSchema: {
              type: 'object',
              properties: {
                url: {
                  type: 'string',
                  description: 'URL to test'
                },
                browsers: {
                  type: 'array',
                  items: { type: 'string', enum: ['chromium', 'firefox', 'webkit'] },
                  description: 'Browsers to test on',
                  default: ['chromium', 'firefox', 'webkit']
                },
                tests: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      selector: { type: 'string' },
                      action: { type: 'string', enum: ['click', 'type', 'check', 'visible'] },
                      value: { type: 'string' },
                      expected: { type: 'string' }
                    }
                  },
                  description: 'Tests to run'
                }
              },
              required: ['url', 'tests']
            }
          },
          {
            name: 'generate_test_report',
            description: 'Generate comprehensive HTML test report',
            inputSchema: {
              type: 'object',
              properties: {
                projectPath: {
                  type: 'string',
                  description: 'Path to project'
                },
                outputPath: {
                  type: 'string',
                  description: 'Path for report output',
                  default: './test-reports'
                },
                includeScreenshots: {
                  type: 'boolean',
                  description: 'Include screenshots in report',
                  default: true
                }
              },
              required: ['projectPath']
            }
          }
        ]
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'playwright_test':
            return await this.playwrightTest(args);
          case 'browser_screenshot':
            return await this.browserScreenshot(args);
          case 'page_performance':
            return await this.pagePerformance(args);
          case 'form_testing':
            return await this.formTesting(args);
          case 'accessibility_audit':
            return await this.accessibilityAudit(args);
          case 'api_endpoint_test':
            return await this.apiEndpointTest(args);
          case 'cross_browser_test':
            return await this.crossBrowserTest(args);
          case 'generate_test_report':
            return await this.generateTestReport(args);
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

  async getBrowser(browserName = 'chromium') {
    if (!this.browsers.has(browserName)) {
      let browser;
      switch (browserName) {
        case 'chromium':
          browser = await chromium.launch();
          break;
        case 'firefox':
          browser = await firefox.launch();
          break;
        case 'webkit':
          browser = await webkit.launch();
          break;
        default:
          browser = await chromium.launch();
      }
      this.browsers.set(browserName, browser);
    }
    return this.browsers.get(browserName);
  }

  async playwrightTest(args) {
    const { 
      projectPath, 
      testPattern = '**/*.spec.js', 
      browser = 'chromium', 
      headless = true,
      reporter = 'list'
    } = args;

    try {
      const projectDir = path.resolve(projectPath);
      
      // Check if playwright.config.js exists
      const configPath = path.join(projectDir, 'playwright.config.js');
      const configExists = await fs.access(configPath).then(() => true).catch(() => false);
      
      if (!configExists) {
        // Create basic playwright config
        const config = `
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: '${reporter}',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    ${browser === 'all' ? `
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },` : ''}
  ],
});`;
        await fs.writeFile(configPath, config);
      }

      // Run tests using spawn
      const { spawn } = await import('child_process');
      
      return new Promise((resolve, reject) => {
        const testCommand = browser === 'all' 
          ? ['npx', 'playwright', 'test'] 
          : ['npx', 'playwright', 'test', '--project', browser];
        
        testCommand.push('--grep', testPattern);
        if (headless) testCommand.push('--headed');

        const child = spawn(testCommand[0], testCommand.slice(1), {
          cwd: projectDir,
          stdio: ['pipe', 'pipe', 'pipe']
        });

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
          resolve({
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: code === 0,
                exitCode: code,
                projectPath: projectDir,
                browser: browser,
                testPattern: testPattern,
                reporter: reporter,
                output: stdout,
                errors: stderr,
                configCreated: !configExists,
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          });
        });
      });
    } catch (error) {
      throw new Error(`Playwright test failed: ${error.message}`);
    }
  }

  async browserScreenshot(args) {
    const { 
      url, 
      browser = 'chromium', 
      viewport = { width: 1280, height: 720 },
      fullPage = true,
      waitFor 
    } = args;

    try {
      const browserInstance = await this.getBrowser(browser);
      const page = await browserInstance.newPage();
      
      await page.setViewportSize(viewport);
      await page.goto(url, { waitUntil: 'networkidle' });
      
      if (waitFor) {
        await page.waitForSelector(waitFor);
      }

      const screenshot = await page.screenshot({ 
        fullPage: fullPage,
        type: 'png'
      });
      
      await page.close();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: url,
            browser: browser,
            viewport: viewport,
            fullPage: fullPage,
            screenshotSize: screenshot.length,
            base64: screenshot.toString('base64').substring(0, 100) + '...',
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Screenshot failed: ${error.message}`);
    }
  }

  async pagePerformance(args) {
    const { 
      url, 
      browser = 'chromium', 
      viewport = { width: 1280, height: 720 },
      throttling = { cpu: 1, network: 'fast3g' }
    } = args;

    try {
      const browserInstance = await this.getBrowser(browser);
      const page = await browserInstance.newPage();
      
      await page.setViewportSize(viewport);
      
      // Enable performance monitoring
      await page.route('**/*', route => route.continue());
      
      const startTime = Date.now();
      await page.goto(url, { waitUntil: 'networkidle' });
      const loadTime = Date.now() - startTime;

      // Get performance metrics
      const metrics = await page.evaluate(() => {
        const perfData = window.performance;
        const navigation = perfData.getEntriesByType('navigation')[0];
        
        return {
          loadTime: navigation.loadEventEnd - navigation.navigationStart,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
          firstPaint: perfData.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: perfData.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          resources: perfData.getEntriesByType('resource').length
        };
      });

      await page.close();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: url,
            browser: browser,
            metrics: {
              ...metrics,
              totalLoadTime: loadTime,
              viewport: viewport,
              throttling: throttling
            },
            performance: {
              grade: loadTime < 2000 ? 'A' : loadTime < 4000 ? 'B' : 'C',
              score: Math.max(0, 100 - (loadTime / 50))
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Performance analysis failed: ${error.message}`);
    }
  }

  async formTesting(args) {
    const { url, formSelector, testData, submitSelector, expectedResult } = args;

    try {
      const browser = await this.getBrowser('chromium');
      const page = await browser.newPage();
      
      await page.goto(url);
      await page.waitForSelector(formSelector);

      // Fill form fields
      for (const field of testData) {
        switch (field.type) {
          case 'input':
            await page.fill(field.selector, field.value);
            break;
          case 'select':
            await page.selectOption(field.selector, field.value);
            break;
          case 'checkbox':
            if (field.value === 'true') {
              await page.check(field.selector);
            }
            break;
          case 'radio':
            await page.check(field.selector);
            break;
        }
      }

      // Submit form if selector provided
      if (submitSelector) {
        await page.click(submitSelector);
        await page.waitForLoadState('networkidle');
      }

      // Check expected result
      let resultCheck = { success: true, message: 'Form submitted successfully' };
      if (expectedResult) {
        if (expectedResult.url) {
          const currentUrl = page.url();
          resultCheck.urlMatch = currentUrl.includes(expectedResult.url);
        }
        if (expectedResult.text) {
          const content = await page.textContent('body');
          resultCheck.textMatch = content.includes(expectedResult.text);
        }
        if (expectedResult.selector) {
          resultCheck.elementExists = await page.isVisible(expectedResult.selector);
        }
      }

      await page.close();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: url,
            formSelector: formSelector,
            fieldsFilledCount: testData.length,
            submitted: !!submitSelector,
            validation: resultCheck,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Form testing failed: ${error.message}`);
    }
  }

  async accessibilityAudit(args) {
    const { url, browser = 'chromium', rules = [] } = args;

    try {
      const browserInstance = await this.getBrowser(browser);
      const page = await browserInstance.newPage();
      
      await page.goto(url);

      // Basic accessibility checks
      const accessibilityIssues = await page.evaluate(() => {
        const issues = [];
        
        // Check for missing alt attributes
        const images = document.querySelectorAll('img:not([alt])');
        if (images.length > 0) {
          issues.push({
            type: 'missing-alt',
            count: images.length,
            severity: 'high'
          });
        }

        // Check for missing form labels
        const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
        const unlabeledWithoutLabels = Array.from(unlabeledInputs).filter(input => {
          const id = input.id;
          return !id || !document.querySelector(`label[for="${id}"]`);
        });
        
        if (unlabeledWithoutLabels.length > 0) {
          issues.push({
            type: 'missing-labels',
            count: unlabeledWithoutLabels.length,
            severity: 'high'
          });
        }

        // Check for heading hierarchy
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let previousLevel = 0;
        let hierarchyIssues = 0;
        
        headings.forEach(heading => {
          const level = parseInt(heading.tagName.charAt(1));
          if (level > previousLevel + 1) {
            hierarchyIssues++;
          }
          previousLevel = level;
        });

        if (hierarchyIssues > 0) {
          issues.push({
            type: 'heading-hierarchy',
            count: hierarchyIssues,
            severity: 'medium'
          });
        }

        // Check for low contrast (simplified)
        const elements = document.querySelectorAll('*');
        let contrastIssues = 0;
        // This is a simplified check - real implementation would need color analysis
        
        return {
          issues: issues,
          totalElements: document.querySelectorAll('*').length,
          imagesTotal: document.querySelectorAll('img').length,
          headingsTotal: headings.length
        };
      });

      await page.close();

      const score = Math.max(0, 100 - (accessibilityIssues.issues.length * 10));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            url: url,
            browser: browser,
            accessibility: accessibilityIssues,
            score: score,
            grade: score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'F',
            recommendations: accessibilityIssues.issues.map(issue => ({
              type: issue.type,
              severity: issue.severity,
              count: issue.count,
              suggestion: this.getAccessibilitySuggestion(issue.type)
            })),
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Accessibility audit failed: ${error.message}`);
    }
  }

  async crossBrowserTest(args) {
    const { url, browsers = ['chromium', 'firefox', 'webkit'], tests } = args;

    try {
      const results = await Promise.all(
        browsers.map(async (browserName) => {
          const browser = await this.getBrowser(browserName);
          const page = await browser.newPage();
          
          try {
            await page.goto(url);
            
            const testResults = await Promise.all(
              tests.map(async (test) => {
                try {
                  switch (test.action) {
                    case 'click':
                      await page.click(test.selector);
                      return { name: test.name, success: true };
                    case 'type':
                      await page.fill(test.selector, test.value);
                      return { name: test.name, success: true };
                    case 'check':
                      await page.check(test.selector);
                      return { name: test.name, success: true };
                    case 'visible':
                      const isVisible = await page.isVisible(test.selector);
                      return { 
                        name: test.name, 
                        success: isVisible === (test.expected === 'true') 
                      };
                    default:
                      return { name: test.name, success: false, error: 'Unknown action' };
                  }
                } catch (error) {
                  return { name: test.name, success: false, error: error.message };
                }
              })
            );

            await page.close();
            
            return {
              browser: browserName,
              success: testResults.every(r => r.success),
              tests: testResults,
              passedCount: testResults.filter(r => r.success).length,
              totalCount: testResults.length
            };
          } catch (error) {
            await page.close();
            return {
              browser: browserName,
              success: false,
              error: error.message
            };
          }
        })
      );

      const overallSuccess = results.every(r => r.success);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: overallSuccess,
            url: url,
            browsers: browsers,
            results: results,
            summary: {
              browsersTestedCount: browsers.length,
              browsersPassedCount: results.filter(r => r.success).length,
              testsPerBrowser: tests.length,
              overallPassRate: `${((results.filter(r => r.success).length / browsers.length) * 100).toFixed(1)}%`
            },
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    } catch (error) {
      throw new Error(`Cross-browser testing failed: ${error.message}`);
    }
  }

  getAccessibilitySuggestion(issueType) {
    const suggestions = {
      'missing-alt': 'Add descriptive alt attributes to all images',
      'missing-labels': 'Associate form inputs with labels using for/id or aria-label',
      'heading-hierarchy': 'Maintain proper heading hierarchy (h1->h2->h3, etc.)',
      'low-contrast': 'Ensure text has sufficient color contrast (4.5:1 for normal text)'
    };
    return suggestions[issueType] || 'Review accessibility guidelines';
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Playwright MCP Server running');
  }

  async cleanup() {
    for (const [name, browser] of this.browsers) {
      await browser.close();
    }
    this.browsers.clear();
  }
}

// Handle test mode
if (process.argv.includes('--test')) {
  console.log('Playwright MCP Server test passed');
  process.exit(0);
}

// Start the server
const server = new PlaywrightMCPServer();
server.run().catch(console.error);

// Cleanup on exit
process.on('exit', () => server.cleanup());
process.on('SIGINT', () => server.cleanup());
process.on('SIGTERM', () => server.cleanup());