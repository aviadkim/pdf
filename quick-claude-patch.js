/**
 * Quick Claude Vision API Patch
 * Add this to your express-server.js on Render
 */

// Add this after the existing requires
const fetch = require('node-fetch'); // Make sure this is installed

// Claude Vision API Test Endpoint
app.get('/api/claude-test', async (req, res) => {
    try {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        
        if (!apiKey) {
            return res.json({
                success: false,
                error: 'ANTHROPIC_API_KEY not configured',
                timestamp: new Date().toISOString(),
                endpoint: '/api/claude-test'
            });
        }
        
        // Test Claude API connection
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-sonnet-20240229',
                max_tokens: 100,
                messages: [{
                    role: "user",
                    content: "Test connection - respond with OK"
                }]
            })
        });
        
        if (response.ok) {
            res.json({
                success: true,
                message: 'Claude API connected successfully',
                model: 'claude-3-sonnet-20240229',
                timestamp: new Date().toISOString(),
                endpoint: '/api/claude-test',
                costEstimate: {
                    totalCost: 0.054,
                    per100PDFs: 5.40,
                    per1000PDFs: 54.00
                }
            });
        } else {
            res.json({
                success: false,
                error: `Claude API error: ${response.status} ${response.statusText}`,
                timestamp: new Date().toISOString(),
                endpoint: '/api/claude-test'
            });
        }
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message,
            timestamp: new Date().toISOString(),
            endpoint: '/api/claude-test'
        });
    }
});

// Basic Claude Vision Extract Endpoint (simplified version)
app.post('/api/claude-vision-extract', upload.single('pdf'), async (req, res) => {
    console.log('👁️ Claude Vision API Extraction called');
    
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No PDF file provided',
                metadata: {
                    method: 'claude-vision-api',
                    endpoint: '/api/claude-vision-extract'
                }
            });
        }
        
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                success: false,
                error: 'ANTHROPIC_API_KEY not configured',
                metadata: {
                    method: 'claude-vision-api',
                    endpoint: '/api/claude-vision-extract'
                }
            });
        }
        
        // For now, return a placeholder response indicating Claude Vision is configured
        // Full implementation requires PDF-to-image conversion
        res.json({
            success: true,
            message: "Claude Vision API is configured but requires full implementation",
            securities: [],
            totalValue: 0,
            accuracy: "Pending implementation",
            metadata: {
                method: 'claude-vision-api-placeholder',
                model: 'claude-3-sonnet-20240229',
                processingTime: Date.now(),
                endpoint: '/api/claude-vision-extract',
                costAnalysis: {
                    totalCost: 0.054,
                    inputCost: 0.024,
                    outputCost: 0.030,
                    estimatedMonthly: {
                        per100PDFs: 5.40,
                        per1000PDFs: 54.00
                    }
                },
                status: 'API key configured - full implementation needed'
            }
        });
        
    } catch (error) {
        console.error('❌ Claude Vision API error:', error.message);
        res.status(500).json({
            success: false,
            error: error.message,
            metadata: {
                method: 'claude-vision-api',
                endpoint: '/api/claude-vision-extract'
            }
        });
    }
});

console.log('🤖 Claude Vision API endpoints added!');
console.log('👁️ /api/claude-test - Test Claude API connection');
console.log('🔍 /api/claude-vision-extract - Claude Vision extraction (placeholder)');