export default function handler(req, res) {
  const html = \`
<!DOCTYPE html>
<html>
<head>
    <title>Claude Text Extractor - Working Version</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-area { border: 2px dashed #ccc; padding: 20px; margin: 20px 0; }
        textarea { width: 100%; height: 300px; font-family: monospace; font-size: 12px; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
        .highlight { background: #fff3cd; padding: 5px; border-radius: 3px; }
    </style>
</head>
<body>
    <h1>📄 Claude Text Extractor - Working Version</h1>
    <p>Since PDF parsing is having issues on Vercel, paste your PDF text here:</p>
    
    <div class="upload-area">
        <h3>How to get PDF text:</h3>
        <ol>
            <li>Open your PDF in any PDF viewer (Chrome, Adobe, etc.)</li>
            <li>Select All (Ctrl+A) and Copy (Ctrl+C)</li>
            <li>Paste the text in the box below</li>
            <li>Click "Extract Data"</li>
        </ol>
        
        <textarea id="textInput" placeholder="Paste your PDF text here..."></textarea>
        <br><br>
        <button onclick="extractText()">Extract Financial Data</button>
    </div>
    
    <div id="result"></div>

    <script>
        async function extractText() {
            const textInput = document.getElementById('textInput');
            const result = document.getElementById('result');
            const text = textInput.value;
            
            if (!text.trim()) {
                alert('Please paste PDF text');
                return;
            }

            result.innerHTML = '<div class="result">🔄 Processing text...</div>';

            try {
                const response = await fetch('/api/text-extract', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        text: text,
                        filename: 'pasted-text.txt'
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    const extraction = data.extraction;
                    result.innerHTML = \\\`
                        <div class="result">
                            <h3>✅ Extraction Complete!</h3>
                            <div class="highlight">
                                <strong>Method:</strong> \\\${data.method}<br>
                                <strong>Client:</strong> \\\${extraction.clientName}<br>
                                <strong>Total Value:</strong> \\\${extraction.totalValue}<br>
                                <strong>ISINs Found:</strong> \\\${extraction.isinsFound}<br>
                                <strong>Values Found:</strong> \\\${extraction.valuesFound}
                            </div>
                            
                            <h4>ISIN Codes Found:</h4>
                            <p>\\\${extraction.isins.join(', ')}</p>
                            
                            <h4>Currency Values Found:</h4>
                            <p>\\\${extraction.values.join(', ')}</p>
                            
                            \\\${extraction.claudeData ? \\\`
                                <h4>Claude AI Analysis:</h4>
                                <pre>\\\${JSON.stringify(extraction.claudeData, null, 2)}</pre>
                            \\\` : ''}
                        </div>
                    \\\`;
                } else {
                    result.innerHTML = \\\`
                        <div class="result">
                            <h3>❌ Error</h3>
                            <p>\\\${data.error}</p>
                            <p>\\\${data.message || ''}</p>
                        </div>
                    \\\`;
                }
            } catch (error) {
                result.innerHTML = \\\`
                    <div class="result">
                        <h3>❌ Error</h3>
                        <p>\\\${error.message}</p>
                    </div>
                \\\`;
            }
        }
    </script>
</body>
</html>
  \`;
  
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(html);
}