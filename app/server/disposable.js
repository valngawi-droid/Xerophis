'use strict';
/** Daftar domain email sekali pakai (temp-mail) yang diblokir dari OTP. */
const DOMAINS = new Set([
  'mailinator.com','tempmail.com','temp-mail.org','temp-mail.io','10minutemail.com','10minemail.com',
  'guerrillamail.com','guerrillamail.de','guerrillamail.net','guerrillamail.org','sharklasers.com',
  'grr.la','guerrillamailblock.com','yopmail.com','yopmail.fr','cool.fr.nf','jetable.org','nopaste.xyz',
  'trashmail.com','trashmail.me','trashmail.net','fakeinbox.com','dispostable.com','getnada.com',
  'nada.email','maildrop.cc','mailnesia.com','mintemail.com','spamgourmet.com','mytemp.email',
  'burnermail.io','emailondeck.com','mohmal.com','tempsky.com','discard.email','spam4.me','spambog.com',
  'tempinbox.com','tempmailo.com','tempmails.net','tempr.email','throwawaymail.com','mail-temp.com',
  'temporarymail.com','tempmail.dev','tempmail.plus','tmmbt.com','tmmbt.net','tmail.com','tmpeml.com',
  'inboxkitten.com','moakt.com','mailmoat.com','mailscrap.com','mailzilla.com','despammed.com',
  'devnullmail.com','mailexpire.com','mailforspam.com','spamavert.com','spamhole.com','trbvm.com',
]);
const HEUR = [/temp-?mail/i, /mailtemp/i, /tempmail/i, /burner/i, /disposable/i, /10minute/i, /throwaway/i, /trash-?mail/i, /fake-?mail/i, /yopmail/i];

function isDisposable(email) {
  const at = String(email).lastIndexOf('@');
  if (at < 0) return true;
  const domain = String(email).slice(at + 1).toLowerCase().trim();
  if (DOMAINS.has(domain)) return true;
  return HEUR.some((r) => r.test(domain));
}
module.exports = { isDisposable };
