import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SESSION_KEY, sessionFromToken, readWalletSession, saveWalletSession, clearWalletSession, restoreWalletSession } from '../lib/wallet-session.ts';

function memoryStorage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function reset() { globalThis.window = { localStorage: memoryStorage(), sessionStorage: memoryStorage() }; }
const wallet = '11111111111111111111111111111111';
function jwt(exp = Math.floor(Date.now() / 1000) + 3600) {
  return 'header.' + Buffer.from(JSON.stringify({ wallet, exp })).toString('base64url') + '.signature';
}
test('restores a saved wallet on refresh and when reopening a tab, without extending its expiry', () => {
  reset(); const saved = sessionFromToken(jwt(), 'Phantom');
  saveWalletSession(saved);
  assert.deepEqual(readWalletSession(), saved);
  window.sessionStorage = memoryStorage();
  assert.deepEqual(readWalletSession(), saved);
});
test('migrates the existing session-only login and removes the stale copy', () => {
  reset(); const token = jwt();
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token, provider: 'MetaMask' }));
  assert.deepEqual(readWalletSession(), sessionFromToken(token, 'MetaMask'));
  assert.ok(window.localStorage.getItem(SESSION_KEY));
  assert.equal(window.sessionStorage.getItem(SESSION_KEY), null);
});
test('keeps a valid login during an offline refresh or backend restart', async () => {
  reset(); const saved = sessionFromToken(jwt(), 'Phantom'); saveWalletSession(saved);
  for (const status of [0, 500, 502, 503]) {
    assert.equal(await restoreWalletSession(saved, async () => { throw Object.assign(new Error('Unavailable'), { status }); }), saved);
    assert.deepEqual(readWalletSession(), saved);
  }
});
test('rejects expired, malformed and server-rejected sessions', async () => {
  reset();
  assert.equal(sessionFromToken(jwt(1), 'Phantom'), null);
  assert.equal(sessionFromToken('bad-token', 'Phantom'), null);
  window.localStorage.setItem(SESSION_KEY, 'broken JSON');
  assert.equal(readWalletSession(), null);
  const saved = sessionFromToken(jwt(), 'Phantom');
  assert.equal(await restoreWalletSession(saved, async () => { throw { status: 401 }; }), null);
  assert.equal(await restoreWalletSession(saved, async () => ({ user: { wallet: 'another-account' } })), null);
});
test('sign out clears persistent and legacy session copies', () => {
  reset(); const saved = sessionFromToken(jwt(), 'Phantom'); saveWalletSession(saved);
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
  window.localStorage.setItem('substream.token', saved.token);
  clearWalletSession();
  assert.equal(readWalletSession(), null);
  assert.equal(window.localStorage.getItem('substream.token'), null);
});
test('cross-tab sign out cannot revive an old tab-only session', () => {
  reset(); window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ token: jwt(), provider: 'Phantom' }));
  assert.equal(readWalletSession(false), null);
});
test('falls back to tab storage when persistent storage is blocked', () => {
  reset(); window.localStorage.setItem = () => { throw new Error('Blocked'); };
  const saved = sessionFromToken(jwt(), 'Phantom'); saveWalletSession(saved);
  assert.deepEqual(readWalletSession(), saved);
});
