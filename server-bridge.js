const http = require('http');

const PORT = 3000;

const server = http.createServer((req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*'
  });
  
  res.end(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Smart Grocery Tracker - Mengalihkan...</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      background: #0b1120;
      color: #f8fafc;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      padding: 32px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      max-width: 380px;
    }
    .spinner {
      width: 44px;
      height: 44px;
      border: 4px solid #334155;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin: 0 auto 20px auto;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    h2 { margin: 0 0 10px 0; font-size: 18px; font-weight: 700; color: #10b981; }
    p { margin: 0; font-size: 14px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="card">
    <div class="spinner"></div>
    <h2>Login Google Berhasil!</h2>
    <p>Mengalihkan kembali ke GrocerySafe...</p>
  </div>
  <script>
    // Forward full token hash and query to Live Server port 5500
    const targetOrigin = 'http://127.0.0.1:5500';
    const targetPath = (window.location.pathname === '/' || !window.location.pathname) ? '/index.html' : window.location.pathname;
    const finalUrl = targetOrigin + targetPath + window.location.search + window.location.hash;
    console.log('[Bridge] Redirecting to:', finalUrl);
    setTimeout(() => {
      window.location.replace(finalUrl);
    }, 250);
  </script>
</body>
</html>`);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[Bridge Server] Listening on http://localhost:${PORT} -> Forwarding to http://127.0.0.1:5500`);
});
