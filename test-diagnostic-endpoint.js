/**
 * Test Mistral Diagnostic Endpoint
 */
const https = require('https');

console.log('🩺 TESTING MISTRAL DIAGNOSTIC ENDPOINT');
console.log('=====================================');

async function testDiagnostic() {
    return new Promise((resolve) => {
        https.get('https://pdf-fzzi.onrender.com/api/mistral-diagnostic', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                console.log('📊 Status:', res.statusCode);
                
                if (res.statusCode === 200) {
                    try {
                        const diagnostic = JSON.parse(data);
                        
                        console.log('\n🔑 ENVIRONMENT ANALYSIS:');
                        console.log('=======================');
                        console.log('Has key:', diagnostic.environment.hasKey);
                        console.log('Key length:', diagnostic.environment.keyLength);
                        console.log('Key preview:', diagnostic.environment.keyPreview);
                        
                        if (diagnostic.environment.keyCharCodes.length > 0) {
                            console.log('\n📝 First 5 characters:');
                            diagnostic.environment.keyCharCodes.forEach(char => {
                                console.log(`  [${char.index}] '${char.char}' (code: ${char.code})`);
                            });
                        }
                        
                        if (diagnostic.tests) {
                            console.log('\n🧪 CLEANING TESTS:');
                            console.log('==================');
                            
                            if (diagnostic.tests.trimmed) {
                                console.log('Trimmed:', 
                                    diagnostic.tests.trimmed.different ? 
                                    `YES - reduces to ${diagnostic.tests.trimmed.length} chars` : 
                                    'NO - no whitespace found');
                            }
                            
                            if (diagnostic.tests.noQuotes) {
                                console.log('Has quotes:', 
                                    diagnostic.tests.noQuotes.different ? 
                                    'YES - found quotes to remove' : 
                                    'NO - no quotes found');
                            }
                            
                            if (diagnostic.tests.noWhitespace) {
                                console.log('Has whitespace:', 
                                    diagnostic.tests.noWhitespace.different ? 
                                    'YES - found whitespace' : 
                                    'NO - no whitespace');
                            }
                            
                            console.log('Clean key length:', diagnostic.tests.fullClean?.length);
                        }
                        
                        if (diagnostic.headerTest) {
                            console.log('\n🔨 HEADER CONSTRUCTION:');
                            console.log('======================');
                            console.log('Success:', diagnostic.headerTest.success);
                            if (diagnostic.headerTest.error) {
                                console.log('Error:', diagnostic.headerTest.error);
                            } else {
                                console.log('Header preview:', diagnostic.headerTest.headerPreview);
                            }
                        }
                        
                        if (diagnostic.apiTest) {
                            console.log('\n🔮 MISTRAL API TEST:');
                            console.log('====================');
                            console.log('Key used:', diagnostic.apiTest.keyUsed);
                            console.log('Status:', diagnostic.apiTest.statusCode);
                            console.log('Result:', diagnostic.apiTest.result);
                            
                            if (diagnostic.apiTest.error) {
                                console.log('Error:', diagnostic.apiTest.error);
                                console.log('Error code:', diagnostic.apiTest.errorCode);
                            }
                        }
                        
                        // Diagnosis
                        console.log('\n🎯 DIAGNOSIS:');
                        console.log('=============');
                        
                        if (!diagnostic.environment.hasKey) {
                            console.log('❌ No API key found in environment');
                        } else if (diagnostic.apiTest?.statusCode === 200) {
                            console.log('✅ API key is valid and working!');
                            console.log('❓ But authorization header still fails in main endpoint');
                            console.log('💡 This suggests a code issue, not a key issue');
                        } else if (diagnostic.apiTest?.statusCode === 401) {
                            console.log('❌ API key is invalid');
                        } else if (diagnostic.apiTest?.error === 'ERR_INVALID_CHAR') {
                            console.log('❌ API key contains invalid characters');
                            console.log('💡 Check the character analysis above');
                        }
                        
                    } catch (error) {
                        console.log('❌ Parse error:', error.message);
                        console.log('Raw response:', data.substring(0, 500));
                    }
                } else {
                    console.log('❌ Diagnostic endpoint not found');
                    console.log('💡 Wait for deployment of commit ac20cfc');
                }
                
                resolve();
            });
        }).on('error', (error) => {
            console.log('❌ Request error:', error.message);
            resolve();
        });
    });
}

// Run diagnostic test
testDiagnostic().then(() => {
    console.log('\n📋 Next steps based on diagnosis above');
}).catch(console.error);