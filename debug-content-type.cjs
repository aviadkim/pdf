// Debug the content-type issue
async function debugContentType() {
  console.log('🔍 Debugging Content Type Issue');
  
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/family-office-upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pdfBase64: 'JVBERi0xLjQKJeL',
        filename: 'test.pdf'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    const responseText = await response.text();
    console.log('Response text (first 200 chars):', responseText.substring(0, 200));
    
    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(responseText);
      console.log('✅ Successfully parsed as JSON');
      console.log('JSON structure:', {
        success: jsonData.success,
        message: jsonData.message,
        holdings: jsonData.data?.holdings?.length
      });
    } catch (parseError) {
      console.log('❌ Failed to parse as JSON:', parseError.message);
      console.log('Response is likely HTML or malformed JSON');
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

debugContentType();