'use strict';
/** Xerophis auth — register / login / logout + bearer middleware. */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const dbx = require('./db');

const router = express.Router();

/* tiny in-memory rate limit (spec 76) */
const hits = new Map();
function limited(req, max = 30, windowMs = 60_000, bucket = 'auth') {
  const key = `${req.ip}:${bucket}`; const now = Date.now();
  const rec = hits.get(key) || { t: now, n: 0 };
  if (now - rec.t > windowMs) { rec.t = now; rec.n = 0; }
  rec.n += 1; hits.set(key, rec);
  return rec.n > max;
}

const VALID_USERNAME = /^[a-zA-Z0-9+._-]{3,24}$/;

router.post('/register', async (req, res) => {
  if (limited(req)) return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
  const { username, password, displayName, phone } = req.body || {};
  if (!username || !VALID_USERNAME.test(String(username))) return res.status(400).json({ error: 'Username 3-24 karakter (huruf, angka, + . _ -).' });
  if (!password || String(password).length < 4) return res.status(400).json({ error: 'Password minimal 4 karakter.' });
  if (await dbx.getUserByUsername(username)) return res.status(409).json({ error: 'Username sudah dipakai.' });
  const hash = await bcrypt.hash(String(password), 10);
  const user = await dbx.createUser({ username: String(username), passwordHash: hash, displayName: displayName || String(username), phone });
  await dbx.ensureOwners(); // registrasi pall/noval/vall otomatis jadi owner + "Developer Xerophis"
  const fresh = (await dbx.getUserById(user.id)) || user;
  await require('./bots').onboardUser(fresh); // welcome DM + Lounge + channel biar akun langsung hidup
  const token = crypto.randomUUID();
  await dbx.createSession(fresh.id, token);
  res.status(201).json({ token, user: fresh });
});

router.post('/login', async (req, res) => {
  if (limited(req)) return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  const user = await dbx.getUserByUsername(String(username));
  const row = user && await dbx.db.prepare('SELECT password_hash, blocked FROM users WHERE id = ?').get(user.id);
  if (!user || !row || !(await bcrypt.compare(String(password), row.password_hash))) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
  if (row.blocked) return res.status(403).json({ error: 'Akun kamu diblokir oleh admin Xerophis.' });
  const token = crypto.randomUUID();
  await dbx.createSession(user.id, token);
  res.json({ token, user });
});

router.post('/logout', async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (token) await dbx.deleteSession(token);
  res.json({ ok: true });
});

/* middleware for /api routes */
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const user = token ? await dbx.getUserByToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Sesi berakhir. Masuk lagi.' });
  req.user = user; req.token = token;
  next();
}

/* ---------- login email OTP (passwordless) + blokir temp-mail ---------- */
const { isDisposable } = require('./disposable');
const mail = require('./mail');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

router.post('/otp/request', async (req, res) => {
  if (limited(req, 10, 60_000, 'otp')) return res.status(429).json({ error: 'Terlalu banyak permintaan OTP.' });
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Format email tidak valid.' });
  if (isDisposable(email)) return res.status(403).json({ error: 'Email sekali pakai (temp mail) tidak diizinkan.' });
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await dbx.addOtp(email, sha(code), new Date(Date.now() + 5 * 60000).toISOString());
  try {
    const r = await mail.sendOtpEmail(email, code);
    res.json({ ok: true, dev: r.devCode || null });
  } catch (e) { res.status(503).json({ error: e.message }); }
});

router.post('/otp/verify', async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const code = String((req.body || {}).code || '').trim();
  const otp = await dbx.takeOtp(email);
  if (!otp) return res.status(400).json({ error: 'Kode OTP tidak ditemukan. Minta ulang.' });
  if (Date.parse(otp.expires_at) < Date.now()) { await dbx.deleteOtp(otp.id); return res.status(400).json({ error: 'Kode OTP kedaluwarsa.' }); }
  if (otp.attempts >= 5) { await dbx.deleteOtp(otp.id); return res.status(400).json({ error: 'Terlalu banyak percobaan. Minta kode baru.' }); }
  if (sha(code) !== otp.code_hash) { await dbx.otpAttempts(otp.id); return res.status(400).json({ error: 'Kode OTP salah.' }); }
  await dbx.deleteOtp(otp.id);
  let user = await dbx.getUserByEmail(email);
  if (!user) {
    let base = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20) || 'user';
    let username = base;
    while (await dbx.getUserByUsername(username)) username = `${base}${crypto.randomInt(10, 99)}`;
    user = await dbx.createUserWithEmail({ username, email, displayName: base });
    dbx.ensureOwners();
    await require('./bots').onboardUser(user);
  }
  if (user.blocked) return res.status(403).json({ error: 'Akun kamu diblokir oleh admin Xerophis.' });
  const token = crypto.randomUUID();
  await dbx.createSession(user.id, token);
  res.json({ token, user: { ...user, email } });
});

module.exports = { router, requireAuth };
