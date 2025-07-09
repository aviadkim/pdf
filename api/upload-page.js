export default function handler(req, res) {
  const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Claude PDF Extractor - Base64</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>📄 Claude PDF Extractor - Working Version</h1>
    <p>This version converts PDF to base64 before sending to avoid multipart issues.</p>
    
    <div class="upload-area">
        <input type="file" id="fileInput" accept=".pdf" />
        <button onclick="extractPDF()">Extract PDF Data</button>
    </div>
    
    <div id="result"></div>

    <script>
        async function extractPDF() {
            const fileInput = document.getElementById('fileInput');
            const result = document.getElementById('result');
            const file = fileInput.files[0];
            
            if (!file) {
                alert('Please select a PDF file');
                return;
            }

            result.innerHTML = '<div class="result">🔄 Processing PDF...</div>';

            try {
                // Convert file to base64
                const reader = new FileReader();
                reader.onload = async function(e) {
                    const base64 = e.target.result.split(',')[1];
                    
                    const response = await fetch('/api/working-extract', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            pdfBase64: base64,
                            filename: file.name
                        })
                    });

                    const data = await response.json();

                    if (response.ok) {
                        result.innerHTML = \`
                            <div class="result">
                                <h3>✅ Extraction Complete!</h3>
                                <p>Method: \${data.extraction.method}</p>
                                <p>Pages: \${data.extraction.pages}</p>
                                <p>ISINs found: \${data.extraction.isinsFound}</p>
                                <p>Total Value: \${data.extraction.totalValue}</p>
                                <pre>\${JSON.stringify(data, null, 2)}</pre>
                            </div>
                        \`;
                    } else {
                        result.innerHTML = \`
                            <div class="result">
                                <h3>❌ Error</h3>
                                <p>\${data.error}</p>
                                <p>\${data.details || ''}</p>
                            </div>
                        \`;
                    }
                };
                
                reader.readAsDataURL(file);
            } catch (error) {
                result.innerHTML = \`
                    <div class="result">
                        <h3>❌ Error</h3>
                        <p>\${error.message}</p>
                    </div>
                \`;
            }
        }
    </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}