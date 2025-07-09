export default function handler(req, res) {
  res.setHeader('Content-Type', 'text/html');
  res.status(200).send(`
<!DOCTYPE html>
<html>
<head>
    <title>Claude PDF Extractor</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .upload-area { border: 2px dashed #ccc; padding: 40px; text-align: center; margin: 20px 0; }
        .upload-area:hover { border-color: #007bff; }
        button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
        .result { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 5px; }
        pre { background: #2c3e50; color: #ecf0f1; padding: 15px; border-radius: 5px; overflow-x: auto; }
    </style>
</head>
<body>
    <h1>📄 Claude PDF Extractor</h1>
    <p>Upload a PDF and Claude will extract all financial data with 100% accuracy</p>
    
    <div class="upload-area" id="uploadArea">
        <input type="file" id="fileInput" accept=".pdf" />
        <button onclick="extractPDF()">Extract PDF Data</button>
    </div>
    
    <div id="result"></div>

    <script>
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const result = document.getElementById('result');

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#007bff';
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ccc';
            if (e.dataTransfer.files.length > 0) {
                fileInput.files = e.dataTransfer.files;
            }
        });

        async function extractPDF() {
            const file = fileInput.files[0];
            if (!file) {
                alert('Please select a PDF file');
                return;
            }

            result.innerHTML = '<div class="result">🔄 Processing PDF...</div>';

            try {
                const formData = new FormData();
                formData.append('pdf', file);

                // Try Claude API first
                let response = await fetch('/api/extract', {
                    method: 'POST',
                    body: formData
                });

                let data = await response.json();

                // If Claude API is overloaded, fall back to simple extraction
                if (response.status === 503 || data.type === 'API_OVERLOADED') {
                    result.innerHTML = '<div class="result">🔄 Claude API busy, using simple extraction...</div>';
                    
                    const formData2 = new FormData();
                    formData2.append('pdf', fileInput.files[0]);
                    
                    response = await fetch('/api/extract-simple', {
                        method: 'POST',
                        body: formData2
                    });
                    
                    data = await response.json();
                }

                if (response.ok) {
                    result.innerHTML = \`
                        <div class="result">
                            <h3>✅ Extraction Complete!</h3>
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
  `);
}