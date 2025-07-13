// Redirect root to upload interface
export default function handler(req, res) {
  // Redirect to upload interface
  res.writeHead(302, {
    Location: '/api/upload'
  });
  res.end();
}