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
module.exports = { sendOtpEmail, configured: () => !!transporter };
