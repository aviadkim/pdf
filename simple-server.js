// Simple test server for Render deployment
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 10000;

// Middleware
app.use(cors());
app.use(express.json());

// Simple health check
app.get('/api/test', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Simple server working on Render!'
    });
});

// Root route
app.get('/', (req, res) => {
    res.json({
        message: 'MCP-Enhanced PDF Processor - Simple Test',
        endpoints: ['/api/test'],
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
});