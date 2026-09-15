const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const LOCK_MESSAGE = 'Withdrawals are locked for your account. Kindly visit the bank with your credentials to unfreeze your account!';
const ACCOUNTS_FILE = path.join(process.cwd(), 'data', 'accounts.json');
const SESSION_SECRET = process.env.SESSION_SECRET || 'local-south-bank-demo-secret-change-me';
const accounts = new Map(Object.entries(JSON.parse(fs.readFileSync(ACCOUNTS_FILE, 'utf8'))));

function sendJson(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) reject(new Error('Request too large'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function createSessionToken(username) {
  const payload = Buffer.from(JSON.stringify({ username }), 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

function sessionUser(req) {
  const token = (req.headers.cookie || '')
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith('session='))
    ?.slice(8);

  if (!token) return undefined;

  const [payload, signature] = token.split('.');
  if (!payload || !signature) return undefined;

  const expected = crypto.createHmac('sha256', SESSION_SECRET).update(payload).digest('base64url');
  const suppliedBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  if (suppliedBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return parsed?.username ? parsed : undefined;
  } catch {
    return undefined;
  }
}

function isAdmin(req) {
  const expected = process.env.ADMIN_TOKEN;
  return Boolean(expected && req.headers.authorization === `Bearer ${expected}`);
}

module.exports = async (req, res) => {
  try {
    const requestPath = new URL(req.url, `https://${req.headers.host || 'localhost'}`).pathname;

    if (req.method === 'POST' && requestPath === '/api/auth/login') {
      const body = await readJson(req);
      const username = String(body.username || '').trim();
      const account = accounts.get(username);

      if (!account || account.password !== body.password) {
        return sendJson(res, 401, { error: 'Invalid Username or Password' });
      }

      const token = createSessionToken(username);

      return sendJson(res, 200, {
        authenticated: true,
        username,
        withdrawalLocked: Boolean(account.withdrawalLocked)
      }, {
        'Set-Cookie': `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/`
      });
    }

    if (req.method === 'POST' && requestPath === '/api/auth/logout') {
      res.statusCode = 204;
      res.setHeader('Set-Cookie', 'session=; Max-Age=0; HttpOnly; Secure; SameSite=Lax; Path=/');
      return res.end();
    }

    if (req.method === 'GET' && requestPath === '/api/account/withdrawal-status') {
      const user = sessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });

      const account = accounts.get(user.username);
      return sendJson(res, 200, { withdrawalLocked: Boolean(account?.withdrawalLocked) });
    }

    if (req.method === 'PATCH' && requestPath.startsWith('/api/admin/accounts/') && requestPath.endsWith('/withdrawal-lock')) {
      if (!isAdmin(req)) return sendJson(res, 403, { error: 'Administrator authorization required' });

      return sendJson(res, 501, {
        error: 'Account lock changes are disabled on the Vercel demo deployment because its filesystem is read-only. Update the local account data and redeploy, or connect a persistent database.'
      });
    }

    if (req.method === 'POST' && requestPath === '/api/withdrawals') {
      const user = sessionUser(req);
      if (!user) return sendJson(res, 401, { error: 'Authentication required' });

      const account = accounts.get(user.username);
      if (account?.withdrawalLocked) {
        return sendJson(res, 423, { error: LOCK_MESSAGE, code: 'WITHDRAWALS_LOCKED' });
      }

      const body = await readJson(req);
      const amount = Number(body.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return sendJson(res, 400, { error: 'Enter a valid withdrawal amount.' });
      }

      if (!String(body.accountHolder || '').trim() || !String(body.bank || '').trim() || !/^\d{4,20}$/.test(String(body.accountNumber || ''))) {
        return sendJson(res, 400, { error: 'Enter valid withdrawal account details.' });
      }

      return sendJson(res, 201, { submitted: true, message: 'Withdrawal request submitted.' });
    }

    return sendJson(res, 404, { error: 'Not found' });
  } catch (error) {
    return sendJson(res, 400, { error: error.message || 'Request failed' });
  }
};
