import axios from 'axios';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testPlatformFeatures() {
    console.log('🚀 Testing Enterprise SaaS Platform Features\n');
    
    const baseUrl = 'http://localhost:3000';
    const results = [];
    
    // Test each endpoint
    const endpoints = [
        { path: '/dashboard.html', name: 'Dashboard' },
        { path: '/history.html', name: 'Document History' },
        { path: '/templates.html', name: 'Template Management' },
        { path: '/analytics.html', name: 'Analytics Dashboard' },
        { path: '/api/health', name: 'API Health Check' },
        { path: '/api/extract-comprehensive', name: 'Extraction API' },
        { path: '/api/history', name: 'History API' },
        { path: '/api/templates', name: 'Templates API' }
    ];
    
    console.log('📡 Testing Platform Endpoints:\n');
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(baseUrl + endpoint.path, {
                validateStatus: () => true // Accept any status
            });
            
            const status = response.status === 200 ? '✅' : '⚠️';
            console.log(`${status} ${endpoint.name}: ${response.status} ${response.statusText}`);
            
            results.push({
                endpoint: endpoint.name,
                path: endpoint.path,
                status: response.status,
                success: response.status === 200,
                contentType: response.headers['content-type'],
                size: response.data.length || JSON.stringify(response.data).length
            });
            
        } catch (error) {
            console.log(`❌ ${endpoint.name}: ${error.message}`);
            results.push({
                endpoint: endpoint.name,
                path: endpoint.path,
                status: 'error',
                success: false,
                error: error.message
            });
        }
    }
    
    // Generate report
    console.log('\n📊 Platform Feature Report:\n');
    console.log('='.repeat(60));
    
    const successCount = results.filter(r => r.success).length;
    console.log(`Total Endpoints Tested: ${results.length}`);
    console.log(`Successful: ${successCount}/${results.length}`);
    console.log(`Success Rate: ${((successCount/results.length) * 100).toFixed(1)}%`);
    
    console.log('\n🎯 Feature Availability:');
    const features = {
        'Enterprise Dashboard': results.find(r => r.path === '/dashboard.html')?.success,
        'Document History': results.find(r => r.path === '/history.html')?.success,
        'Template Management': results.find(r => r.path === '/templates.html')?.success,
        'Analytics Dashboard': results.find(r => r.path === '/analytics.html')?.success,
        'API Integration': results.find(r => r.path === '/api/health')?.success,
        'PDF Processing': results.find(r => r.path === '/api/extract-comprehensive')?.success
    };
    
    for (const [feature, available] of Object.entries(features)) {
        console.log(`  ${available ? '✅' : '❌'} ${feature}`);
    }
    
    // Save detailed report
    const reportPath = path.join(__dirname, 'platform-test-report.json');
    await fs.writeFile(reportPath, JSON.stringify({
        timestamp: new Date().toISOString(),
        results,
        features,
        summary: {
            totalEndpoints: results.length,
            successful: successCount,
            successRate: ((successCount/results.length) * 100).toFixed(1) + '%'
        }
    }, null, 2));
    
    console.log(`\n📁 Detailed report saved to: ${reportPath}`);
    
    console.log('\n✨ Platform test complete!');
}

// Run the test
testPlatformFeatures().catch(console.error);