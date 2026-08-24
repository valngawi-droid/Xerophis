'use strict';
/** Ring buffer log error untuk tab Sistem (Database & Source Inspector). */
const errors = [];
function push(err) {
  errors.push({ at: new Date().toISOString(), message: String(err?.message || err).slice(0, 300) });
  if (errors.length > 100) errors.shift();
}
function list() { return [...errors].reverse(); }
module.exports = { push, list };
