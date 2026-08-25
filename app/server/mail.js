'use strict';
/** Pengiriman email OTP: SMTP jika dikonfigurasi, mode dev log+devCode jika tidak. */
let transporter = null;
try {
  if (process.env.SMTP_URL) transporter = require('nodemailer').createTransport(process.env.SMTP_URL);
} catch (e) { console.error('[mail] SMTP gagal init:', e.message); }

async function sendOtpEmail(email, code) {
  if (transporter) {
    try {
      await transporter.sendMail({
        from: process.env.MAIL_FROM || 'Xerophis <no-reply@xerophis.app>',
        to: email, subject: 'Kode OTP Xerophis',
        text: `Kode OTP Xerophis kamu: ${code}\nBerlaku 5 menit. Jangan bagikan ke siapa pun.`,
      });
      return { sent: true };
    } catch (e) {
      if (process.env.NODE_ENV === 'production') throw e;
      console.error('[mail] SMTP gagal, fallback devCode:', e.message);
    }
  }
  if (process.env.NODE_ENV === 'production') throw new Error('SMTP belum dikonfigurasi (set SMTP_URL).');
  console.log(`[otp][dev] ${email} -> ${code}`);
  return { sent: false, devCode: code };
}
async function sendInviteEmail(email, fromName) {
  const link = process.env.PUBLIC_URL || 'http://69.33.213.153';
  const text = `${fromName} mengundang kamu ke Xerophis — messaging black/red premium.\nBuka ${link} dan masuk pakai email ini (OTP). 🔥`;
  if (transporter) {
    try {
      await transporter.sendMail({ from: process.env.MAIL_FROM || 'Xerophis <no-reply@xerophis.app>', to: email, subject: `Undangan Xerophis dari ${fromName}`, text });
      return { sent: true };
    } catch (e) {
      if (process.env.NODE_ENV === 'production') throw e;
      console.error('[mail] invite gagal, fallback dev:', e.message);
    }
  }
  if (process.env.NODE_ENV === 'production') throw new Error('SMTP belum dikonfigurasi (set SMTP_URL).');
  console.log(`[invite][dev] ke ${email}: ${text.split('\n')[0]}`);
  return { sent: false, devInfo: `Undangan (dev): ${link}` };
}
module.exports = { sendOtpEmail, sendInviteEmail, configured: () => !!transporter };
