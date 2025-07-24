/**
 * MISTRAL OCR COMPREHENSIVE TEST SUITE
 * Playwright tests for Mistral OCR integration
 */

const { test, expect } = require('@playwright/test');
const { MistralOCRRealAPI } = require('../mistral-ocr-real-api');
const fs = require('fs').promises;
const path = require('path');

test.describe('Mistral OCR Integration Tests', () => {
    let mistralOCR;
    
    test.beforeAll(async () => {
        // Skip tests if API key is not available
        if (!process.env.MISTRAL_API_KEY) {
            test.skip('Mistral API key not configured');
        }
        
        mistralOCR = new MistralOCRRealAPI({
            debugMode: true
        });
    });

    test.describe('API Configuration', () => {
        test('should initialize with correct configuration', async () => {
            expect(mistralOCR.apiKey).toBeTruthy();
            expect(mistralOCR.endpoint).toContain('mistral.ai');
            expect(mistralOCR.model).toBe('mistral-ocr-latest');
        });

        test('should handle missing API key gracefully', async () => {
            expect(() => {
                new MistralOCRRealAPI({ apiKey: null });
            }).toThrow('Mistral API key is required');
        });

        test('should set rate limits correctly', async () => {
            const customMistral = new MistralOCRRealAPI({
                apiKey: process.env.MISTRAL_API_KEY,
                rateLimit: { requests: 50, perMinute: 60 }
            });
            
            expect(customMistral.rateLimit.requests).toBe(50);
            expect(customMistral.rateLimit.perMinute).toBe(60);
        });
    });

    test.describe('Input Processing', () => {
        test('should process PDF buffer correctly', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const pdfBuffer = await fs.readFile(pdfPath);
                const result = await mistralOCR.processFromBuffer(pdfBuffer);
                
                expect(result).toBeDefined();
                expect(result.success).toBe(true);
                expect(result.method).toBe('mistral_ocr_real_api');
                expect(result.securities).toBeInstanceOf(Array);
                expect(result.summary.totalSecurities).toBeGreaterThan(0);
                expect(result.metadata.realAPI).toBe(true);
                expect(result.metadata.hardcoded).toBe(false);
            } else {
                test.skip('Test PDF file not found');
            }
        });

        test('should process file path correctly', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                expect(result).toBeDefined();
                expect(result.success).toBe(true);
                expect(result.securities).toBeInstanceOf(Array);
                expect(result.summary.accuracy).toBeGreaterThan(0);
            } else {
                test.skip('Test PDF file not found');
            }
        });

        test('should handle base64 input', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const pdfBuffer = await fs.readFile(pdfPath);
                const base64Data = pdfBuffer.toString('base64');
                
                const result = await mistralOCR.processFromBase64(base64Data);
                
                expect(result).toBeDefined();
                expect(result.success).toBe(true);
                expect(result.securities).toBeInstanceOf(Array);
            } else {
                test.skip('Test PDF file not found');
            }
        });
    });

    test.describe('Rate Limiting', () => {
        test('should track request history', async () => {
            const initialHistoryLength = mistralOCR.requestHistory.length;
            
            try {
                await mistralOCR.checkRateLimit();
                expect(mistralOCR.requestHistory.length).toBe(initialHistoryLength + 1);
            } catch (error) {
                // Rate limit exceeded is acceptable
                expect(error.message).toContain('Rate limit exceeded');
            }
        });

        test('should enforce rate limits', async () => {
            const testMistral = new MistralOCRRealAPI({
                apiKey: process.env.MISTRAL_API_KEY,
                rateLimit: { requests: 1, perMinute: 60 }
            });
            
            // First request should succeed
            await testMistral.checkRateLimit();
            
            // Second request should fail
            await expect(testMistral.checkRateLimit()).rejects.toThrow('Rate limit exceeded');
        });
    });

    test.describe('Data Extraction', () => {
        test('should extract ISINs correctly', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                // Check for known ISINs
                const extractedISINs = result.securities.map(s => s.isin);
                expect(extractedISINs).toContain('XS2993414619');
                expect(extractedISINs).toContain('XS2530201644');
                expect(extractedISINs).toContain('XS2588105036');
                
                // Validate ISIN format
                extractedISINs.forEach(isin => {
                    expect(isin).toMatch(/^[A-Z]{2}[A-Z0-9]{10}$/);
                });
            } else {
                test.skip('Test PDF file not found');
            }
        });

        test('should extract market values correctly', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                // Check that all securities have values
                result.securities.forEach(security => {
                    expect(security.value).toBeGreaterThan(0);
                    expect(typeof security.value).toBe('number');
                });
                
                // Check total value is reasonable
                expect(result.summary.totalValue).toBeGreaterThan(1000000);
                expect(result.summary.totalValue).toBeLessThan(100000000);
            } else {
                test.skip('Test PDF file not found');
            }
        });

        test('should calculate accuracy correctly', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                expect(result.summary.accuracy).toBeGreaterThan(0);
                expect(result.summary.accuracy).toBeLessThanOrEqual(100);
                expect(result.summary.expectedTotal).toBe(19464431);
            } else {
                test.skip('Test PDF file not found');
            }
        });
    });

    test.describe('Response Format', () => {
        test('should return proper response structure', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                // Check main structure
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('method');
                expect(result).toHaveProperty('securities');
                expect(result).toHaveProperty('summary');
                expect(result).toHaveProperty('metadata');
                
                // Check summary structure
                expect(result.summary).toHaveProperty('totalSecurities');
                expect(result.summary).toHaveProperty('totalValue');
                expect(result.summary).toHaveProperty('accuracy');
                expect(result.summary).toHaveProperty('averageConfidence');
                
                // Check metadata structure
                expect(result.metadata).toHaveProperty('extractionMethod');
                expect(result.metadata).toHaveProperty('model');
                expect(result.metadata).toHaveProperty('realAPI');
                expect(result.metadata).toHaveProperty('hardcoded');
                expect(result.metadata).toHaveProperty('legitimate');
                
                // Check security structure
                if (result.securities.length > 0) {
                    const security = result.securities[0];
                    expect(security).toHaveProperty('isin');
                    expect(security).toHaveProperty('value');
                    expect(security).toHaveProperty('confidence');
                    expect(security).toHaveProperty('method');
                }
            } else {
                test.skip('Test PDF file not found');
            }
        });

        test('should include API usage information', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                expect(result.metadata).toHaveProperty('apiUsage');
                expect(result.metadata).toHaveProperty('estimatedCost');
                expect(result.metadata.estimatedCost).toMatch(/^\\d+\\.\\d+$/);
            } else {
                test.skip('Test PDF file not found');
            }
        });
    });

    test.describe('Error Handling', () => {
        test('should handle invalid file paths', async () => {
            await expect(mistralOCR.processFromFile('nonexistent.pdf')).rejects.toThrow();
        });

        test('should handle invalid base64 data', async () => {
            await expect(mistralOCR.processFromBase64('invalid-base64')).rejects.toThrow();
        });

        test('should handle network errors gracefully', async () => {
            const offlineMistral = new MistralOCRRealAPI({
                apiKey: process.env.MISTRAL_API_KEY,
                endpoint: 'https://invalid-endpoint.com'
            });
            
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                await expect(offlineMistral.processFromFile(pdfPath)).rejects.toThrow();
            } else {
                test.skip('Test PDF file not found');
            }
        });
    });

    test.describe('Configuration Options', () => {
        test('should respect debug mode setting', async () => {
            const debugMistral = new MistralOCRRealAPI({
                apiKey: process.env.MISTRAL_API_KEY,
                debugMode: true
            });
            
            expect(debugMistral.debugMode).toBe(true);
        });

        test('should use custom model setting', async () => {
            const customMistral = new MistralOCRRealAPI({
                apiKey: process.env.MISTRAL_API_KEY,
                model: 'custom-model'
            });
            
            expect(customMistral.model).toBe('custom-model');
        });

        test('should handle retry configuration', async () => {
            const retryMistral = new MistralOCRRealAPI({
                apiKey: process.env.MISTRAL_API_KEY,
                maxRetries: 5,
                retryDelay: 2000
            });
            
            expect(retryMistral.maxRetries).toBe(5);
            expect(retryMistral.retryDelay).toBe(2000);
        });
    });

    test.describe('Performance Tests', () => {
        test('should complete processing within reasonable time', async () => {
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const startTime = Date.now();
                const result = await mistralOCR.processFromFile(pdfPath);
                const endTime = Date.now();
                
                const processingTime = endTime - startTime;
                
                expect(result.success).toBe(true);
                expect(processingTime).toBeLessThan(30000); // Should complete within 30 seconds
                
                console.log(`Processing time: ${processingTime}ms`);
            } else {
                test.skip('Test PDF file not found');
            }
        });

        test('should handle large files efficiently', async () => {
            // This test would need a larger test file
            // For now, we'll test with the existing file
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const stats = await fs.stat(pdfPath);
                console.log(`File size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
                
                const result = await mistralOCR.processFromFile(pdfPath);
                expect(result.success).toBe(true);
            } else {
                test.skip('Test PDF file not found');
            }
        });
    });

    test.describe('Integration with Express Server', () => {
        test('should integrate with existing API structure', async () => {
            // Test that the MistralOCR class follows the same patterns as other processors
            const pdfPath = '2. Messos  - 31.03.2025.pdf';
            
            if (await fileExists(pdfPath)) {
                const result = await mistralOCR.processFromFile(pdfPath);
                
                // Check that it follows the same response format as other processors
                expect(result).toHaveProperty('success');
                expect(result).toHaveProperty('method');
                expect(result).toHaveProperty('securities');
                expect(result).toHaveProperty('summary');
                expect(result).toHaveProperty('metadata');
                
                // Check that securities have the required fields
                if (result.securities.length > 0) {
                    const security = result.securities[0];
                    expect(security).toHaveProperty('isin');
                    expect(security).toHaveProperty('value');
                    expect(security).toHaveProperty('confidence');
                    expect(security).toHaveProperty('method');
                }
            } else {
                test.skip('Test PDF file not found');
            }
        });
    });
});

// Helper function
async function fileExists(filePath) {
    try {
        await fs.access(filePath);
        return true;
    } catch {
        return false;
    }
}