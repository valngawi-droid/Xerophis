'use strict';
/** Web Push (VAPID) — notifikasi untuk pengguna yang offline. */
const webpush = require('web-push');
const dbx = require('./db');

async function vapidKeys() {
  let v = await dbx.kvGet('vapid');
  if (!v) {
    v = JSON.stringify(webpush.generateVAPIDKeys());
    await dbx.kvSet('vapid', v);
  }
  return JSON.parse(v);
}
async function sendPush(userId, payload) {
  try {
    const v = await vapidKeys();
    webpush.setVapidDetails('mailto:admin@xerophis.app', v.publicKey, v.privateKey);
    for (const s of await dbx.listPushSubs(userId)) {
      const sub = JSON.parse(s.sub_json);
      try {
        if (String(sub.endpoint).startsWith('http://')) {
          // mode dev/test: kirim POST polos (endpoint push asli selalu https)
          const r = await fetch(sub.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json', TTL: '60' }, body: JSON.stringify(payload) });
          if (r.status === 404 || r.status === 410) await dbx.deletePushSub(s.id);
        } else {
          await webpush.sendNotification(sub, JSON.stringify(payload));
        }
      } catch (e) {
        if (e.statusCode === 404 || e.statusCode === 410) await dbx.deletePushSub(s.id);
        else console.error('[push]', e.message);
      }
    }
  } catch (e) { console.error('[push]', e.message); }
}
module.exports = { sendPush, vapidKeys };
