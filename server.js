/**
 * Custom HTTPS server for Next.js
 * Use this for self-hosted deployments with SSL certificates
 * 
 * For Vercel/Cloud platforms, this is not needed - they handle HTTPS automatically
 */

const { createServer } = require('https');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// SSL certificate paths
// Update these paths to match your certificate location
const certDir = path.join(__dirname, 'certs');
const httpsOptions = {
  key: fs.readFileSync(path.join(certDir, 'private.key')),
  cert: fs.readFileSync(path.join(certDir, 'certificate.crt')),
};

app.prepare().then(() => {
  createServer(httpsOptions, async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on https://${hostname}:${port}`);
    console.log(`> Open https://${hostname}:${port} in your browser`);
  });
});
