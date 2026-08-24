/* Xerophis E2EE — WebCrypto ECDH P-256 + AES-GCM 256. Server hanya relay ciphertext. */
const b64 = (buf) => { const u = new Uint8Array(buf); let s = ''; for (const b of u) s += String.fromCharCode(b); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function generatePair() {
  const kp = await crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveKey', 'deriveBits']);
  const priv = await crypto.subtle.exportKey('jwk', kp.privateKey);
  const pubRaw = await crypto.subtle.exportKey('raw', kp.publicKey);
  return { priv, pubB64: b64(pubRaw) };
}
export async function ensureKeyPair() {
  let priv = localStorage.getItem('xero.e2ee.priv');
  let pub = localStorage.getItem('xero.e2ee.pub');
  if (!priv || !pub) {
    const p = await generatePair();
    localStorage.setItem('xero.e2ee.priv', JSON.stringify(p.priv));
    localStorage.setItem('xero.e2ee.pub', p.pubB64);
    return p;
  }
  return { priv: JSON.parse(priv), pubB64: pub };
}
export async function sharedKey(privJwk, peerPubB64) {
  const priv = await crypto.subtle.importKey('jwk', privJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveKey']);
  const pub = await crypto.subtle.importKey('raw', unb64(peerPubB64), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
  return crypto.subtle.deriveKey({ name: 'ECDH', public: pub }, priv, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
export async function encryptText(key, text) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(text));
  return `e2e:${b64(iv)}:${b64(ct)}`;
}
export async function decryptText(key, payload) {
  const parts = String(payload).split(':');
  if (parts.length !== 3 || parts[0] !== 'e2e') throw new Error('bukan payload e2e');
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(parts[1]) }, key, unb64(parts[2]));
  return new TextDecoder().decode(pt);
}
