import fs from 'fs';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function testPDFExtraction() {
  console.log('Testing PDF extraction API...\n');
  
  const pdfPath = '/mnt/c/Users/aviad/OneDrive/Desktop/2. Messos  - 31.03.2025.pdf';
  
  // First test the simple endpoint
  console.log('1. Testing simple extraction endpoint...');
  try {
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/extract-simple', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const responseText = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', responseText.substring(0, 500));
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ Simple extraction works!');
      console.log('Holdings found:', data.data?.holdings?.length || 0);
    }
  } catch (error) {
    console.error('❌ Simple extraction error:', error.message);
  }
  
  // Test advanced endpoint
  console.log('\n2. Testing advanced extraction endpoint...');
  try {
    const form = new FormData();
    form.append('pdf', fs.createReadStream(pdfPath));
    
    const response = await fetch('https://pdf-five-nu.vercel.app/api/extract-advanced', {
      method: 'POST',
      body: form,
      headers: form.getHeaders()
    });
    
    const responseText = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', responseText.substring(0, 500));
    
    // Check if it's an HTML error page
    if (responseText.startsWith('<!DOCTYPE html>') || responseText.includes('A server error')) {
      console.log('❌ Received HTML error page instead of JSON');
      console.log('This usually means the function crashed');
    } else {
      try {
        const data = JSON.parse(responseText);
        console.log('Response data:', data);
      } catch (e) {
        console.log('Failed to parse JSON:', e.message);
      }
    }
  } catch (error) {
    console.error('❌ Advanced extraction error:', error.message);
  }
  
  // Test debug endpoint
  console.log('\n3. Testing debug endpoint...');
  try {
    const response = await fetch('https://pdf-five-nu.vercel.app/api/debug');
    const data = await response.json();
    console.log('Debug info:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Debug endpoint error:', error.message);
  }
}

testPDFExtraction();