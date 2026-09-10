const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const PORT = Number(process.env.PORT || 3000);
const ROOT = __dirname;
const ACCOUNTS_FILE = path.join(ROOT, 'data', 'accounts.json');
const LOCK_MESSAGE = 'Withdrawals are locked for your account. Kindly visit the bank with your credentials to unfreeze your account!';
const sessions = new Map();
const accounts = new Map(Object.entries(JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'))));

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.eot': 'application/vnd.ms-fontobject'
};

function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; if (data.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(data ? JSON.parse(data) : {}); } catch { reject(new Error('Invalid JSON')); } });
    req.on('error', reject);
  });
}

function sessionUser(req) {
  const token = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('session='))?.slice(8);
  return token ? sessions.get(token) : undefined;
}

function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected && req.headers.authorization === `Bearer ${expected}`);
}

function persistAccounts() {
  fs.writeFileSync(ACCOUNTS_FILE, `${JSON.stringify(Object.fromEntries(accounts), null, 2)}\n`, 'utf8');
}

function serveStatic(req, res) {
  const requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  const relative = requested === '/' ? 'bank/index.html' : requested.replace(/^\/+/, '');
  const filePath = path.resolve(ROOT, relative);
  if (!filePath.startsWith(ROOT + path.sep)) return sendJson(res, 403, { error: 'Forbidden' });
  fs.stat(filePath, (statError, stat) => {
    if (statError || !stat.isFile()) return sendJson(res, 404, { error: 'Not found' });
    res.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const requestPath = requestUrl.pathname;
    if (req.method === 'POST' && requestPath === '/api/auth/login') {
      const body = await readJson(req);
      const account = accounts.get(String(body.username || ''));
      if (!account || account.password !== body.password) return sendJson(res, 401, { error: 'Invalid Username or Password' });
      const token = crypto.randomBytes(32).toString('hex');
      sessions.set(token, { username: String(body.username) });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Set-Cookie': `session=${token}; HttpOnly; SameSite=Lax; Path=/` });
      return res.end(JSON.stringify({ authenticated: true }));
    }
    if (req.method === 'POST' && requestPath === '/api/auth/logout') {
      const cookie = (req.headers.cookie || '').split(';').map(v => v.trim()).find(v => v.startsWith('session='))?.slice(8);
      if (cookie) sessions.delete(cookie);
      res.writeHead(204, { 'Set-Cookie': 'session=; Max-Age=0; HttpOnly; SameSite=Lax; Path=/' });
      return res.end();
    }
    if (requestPath === '/api/account/withdrawal-status' && req.method === 'GET') {
      const user = sessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const account = accounts.get(user.username);
      return sendJson(res, 200, { withdrawalLocked: Boolean(account?.withdrawalLocked) });
    }
    if (requestPath.startsWith('/api/admin/accounts/') && requestPath.endsWith('/withdrawal-lock') && req.method === 'PATCH') {
      if (!isAdmin(req)) return sendJson(res, 403, { error: 'Administrator authorization required' });
      const username = decodeURIComponent(requestPath.slice('/api/admin/accounts/'.length, -'/withdrawal-lock'.length));
      const account = accounts.get(username);
      if (!account) return sendJson(res, 404, { error: 'Account not found' });
      const body = await readJson(req);
      if (typeof body.withdrawalLocked !== 'boolean') return sendJson(res, 400, { error: 'withdrawalLocked must be boolean' });
      account.withdrawalLocked = body.withdrawalLocked;
      persistAccounts();
      return sendJson(res, 200, { username, withdrawalLocked: account.withdrawalLocked });
    }
    if (requestPath === '/api/withdrawals' && req.method === 'POST') {
      const user = sessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });
      const account = accounts.get(user.username);
      if (account?.withdrawalLocked) return sendJson(res, 423, { error: LOCK_MESSAGE, code: 'WITHDRAWALS_LOCKED' });
      const body = await readJson(req);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) return sendJson(res, 400, { error: 'Enter a valid withdrawal amount.' });
      if (!String(body.accountHolder || '').trim() || !String(body.bank || '').trim() || !/^\d{4,20}$/.test(String(body.accountNumber || ''))) {
        return sendJson(res, 400, { error: 'Enter valid withdrawal account details.' });
      }
      return sendJson(res, 201, { submitted: true, message: 'Withdrawal request submitted.' });
    }
    return serveStatic(req, res);
  } catch (error) {
    if (!res.headersSent) sendJson(res, 400, { error: error.message || 'Request failed' });
  }
});

server.listen(PORT, () => console.log(`South Bank listening on http://localhost:${PORT}`));
