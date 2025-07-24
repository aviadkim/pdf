/**
 * RENDER SERVICE FINDER
 * Helps locate and test all Render services for the PDF project
 */

const fetch = require('node-fetch');

class RenderServiceFinder {
    constructor() {
        this.possibleURLs = [
            'https://pdf-fzzi.onrender.com',           // Main service we've been testing
            'https://pdf.onrender.com',               // If you have this URL
            'https://smart-ocr.onrender.com',         // If named differently
            'https://claude-pdf.onrender.com',        // Based on package.json name
            'https://financial-pdf.onrender.com',     // Alternative naming
            'https://smart-ocr-learning.onrender.com' // Full name
        ];
    }

    async testURL(url) {
        try {
            console.log(`🔍 Testing: ${url}`);
            
            const response = await fetch(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Service-Finder/1.0'
                }
            });
            
            if (response.ok) {
                const content = await response.text();
                const title = content.match(/<title>(.*?)<\/title>/i)?.[1] || 'No title';
                
                console.log(`✅ FOUND: ${url}`);
                console.log(`   📄 Title: ${title}`);
                console.log(`   📊 Status: ${response.status}`);
                
                if (content.includes('Financial PDF Processing System')) {
                    console.log(`   🎯 CORRECT SERVICE: This is our Smart OCR system!`);
                    return { url, status: 'smart-ocr-system', title, working: true };
                } else if (content.includes('Vercel build complete')) {
                    console.log(`   ⚠️  NEEDS SETUP: Static content, needs environment variable`);
                    return { url, status: 'needs-env-var', title, working: false };
                } else {
                    console.log(`   ℹ️  OTHER SERVICE: Different application`);
                    return { url, status: 'other-service', title, working: true };
                }
            } else {
                console.log(`❌ HTTP ${response.status}: ${url}`);
                return { url, status: 'error', error: response.status, working: false };
            }
            
        } catch (error) {
            console.log(`❌ Connection failed: ${url} - ${error.message}`);
            return { url, status: 'connection-error', error: error.message, working: false };
        }
    }

    async findAllServices() {
        console.log('🔍 SEARCHING FOR RENDER SERVICES');
        console.log('==================================');
        console.log('Testing all possible URLs for your PDF project...\n');
        
        const results = [];
        
        for (const url of this.possibleURLs) {
            const result = await this.testURL(url);
            results.push(result);
            console.log(''); // Empty line for readability
        }
        
        return results;
    }

    async generateReport(results) {
        console.log('📊 RENDER SERVICES REPORT');
        console.log('=========================');
        
        const workingServices = results.filter(r => r.working);
        const smartOCRServices = results.filter(r => r.status === 'smart-ocr-system');
        const needsSetup = results.filter(r => r.status === 'needs-env-var');
        
        console.log(`\n📈 SUMMARY:`);
        console.log(`   🌐 Total URLs tested: ${results.length}`);
        console.log(`   ✅ Working services: ${workingServices.length}`);
        console.log(`   🎯 Smart OCR services: ${smartOCRServices.length}`);
        console.log(`   ⚠️  Need environment setup: ${needsSetup.length}`);
        
        if (smartOCRServices.length > 0) {
            console.log(`\n🎉 SMART OCR SYSTEM FOUND!`);
            smartOCRServices.forEach(service => {
                console.log(`   🌐 URL: ${service.url}`);
                console.log(`   📄 Title: ${service.title}`);
                console.log(`   ✅ Status: Ready to use!`);
            });
        }
        
        if (needsSetup.length > 0) {
            console.log(`\n🔧 SERVICES NEEDING SETUP:`);
            needsSetup.forEach(service => {
                console.log(`   🌐 URL: ${service.url}`);
                console.log(`   ⚠️  Status: Needs MISTRAL_API_KEY environment variable`);
                console.log(`   🔧 Action: Set environment variable in Render dashboard`);
            });
        }
        
        if (workingServices.length > 0) {
            console.log(`\n🌐 ALL WORKING SERVICES:`);
            workingServices.forEach(service => {
                console.log(`   ${service.status === 'smart-ocr-system' ? '🎯' : 'ℹ️'} ${service.url} - ${service.status}`);
            });
        }
        
        console.log(`\n📋 NEXT STEPS:`);
        if (smartOCRServices.length > 0) {
            console.log(`✅ You can start using the Smart OCR system immediately!`);
            console.log(`🎨 Annotation interface: ${smartOCRServices[0].url}/smart-annotation`);
        } else if (needsSetup.length > 0) {
            console.log(`🔧 Set MISTRAL_API_KEY environment variable for: ${needsSetup[0].url}`);
            console.log(`📝 Value: <MISTRAL_API_KEY>`);
        } else {
            console.log(`❌ No Smart OCR services found. Check Render dashboard for deployment status.`);
        }
        
        // Save detailed report
        const reportData = {
            timestamp: new Date().toISOString(),
            tested: results.length,
            working: workingServices.length,
            smartOCRFound: smartOCRServices.length,
            needsSetup: needsSetup.length,
            services: results,
            recommendations: this.generateRecommendations(results)
        };
        
        await require('fs').promises.writeFile(
            'render-services-report.json', 
            JSON.stringify(reportData, null, 2)
        );
        
        console.log(`\n📄 Detailed report saved: render-services-report.json`);
        
        return reportData;
    }

    generateRecommendations(results) {
        const smartOCRServices = results.filter(r => r.status === 'smart-ocr-system');
        const needsSetup = results.filter(r => r.status === 'needs-env-var');
        
        if (smartOCRServices.length > 0) {
            return [
                `✅ Smart OCR system is live at: ${smartOCRServices[0].url}`,
                `🎨 Start annotating PDFs at: ${smartOCRServices[0].url}/smart-annotation`,
                `📊 Check system stats at: ${smartOCRServices[0].url}/api/smart-ocr-stats`
            ];
        } else if (needsSetup.length > 0) {
            return [
                `🔧 Set environment variable MISTRAL_API_KEY in Render dashboard`,
                `🌐 Service URL: ${needsSetup[0].url}`,
                `🔑 API Key: <MISTRAL_API_KEY>`,
                `⏳ Wait 2-3 minutes after saving for redeploy`
            ];
        } else {
            return [
                `❌ No services found - check Render dashboard`,
                `🔍 Look for services with names like: pdf, smart-ocr, claude-pdf`,
                `📋 Check deployment logs for errors`
            ];
        }
    }

    async run() {
        const results = await this.findAllServices();
        await this.generateReport(results);
        return results;
    }
}

// Run the service finder
const finder = new RenderServiceFinder();
finder.run().catch(console.error);

module.exports = RenderServiceFinder;