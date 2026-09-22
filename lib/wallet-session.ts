export const SESSION_KEY = 'substream.session';
export interface WalletSession { token: string; provider: string; wallet: string; expiresAt: number }

function storage(kind: 'localStorage' | 'sessionStorage'): Storage | undefined {
  try { return window[kind]; } catch { return undefined; }
}
function read(kind: 'localStorage' | 'sessionStorage') {
  try { return storage(kind)?.getItem(SESSION_KEY) ?? null; } catch { return null; }
}
function remove(kind: 'localStorage' | 'sessionStorage', key: string) {
  try { storage(kind)?.removeItem(key); } catch { /* Storage can be blocked in private browsing. */ }
}

export function sessionFromToken(token: string, provider: string, now = Date.now()): WalletSession | null {
  try {
    if (!token || !provider || provider.length > 100 || token.split('.').length !== 3) return null;
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const claims = JSON.parse(atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '=')));
    const wallet = claims.wallet ?? claims.sub;
    const expiresAt = claims.exp * 1000;
    if (typeof wallet !== 'string' || !/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(wallet) || !Number.isFinite(expiresAt) || expiresAt <= now) return null;
    // This only restores the UI. The backend verifies the JWT on every protected request.
    return { token, provider, wallet, expiresAt };
  } catch { return null; }
}

export function saveWalletSession(session: WalletSession) {
  try {
    const local = storage('localStorage');
    if (!local) throw new Error('Persistent storage is unavailable');
    local.setItem(SESSION_KEY, JSON.stringify(session));
    remove('sessionStorage', SESSION_KEY);
  } catch {
    try { storage('sessionStorage')?.setItem(SESSION_KEY, JSON.stringify(session)); } catch { /* Keep the current in-memory session. */ }
  }
}

export function clearWalletSession() {
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    for (const key of [SESSION_KEY, 'substream.wallet', 'substream.token']) remove(kind, key);
  }
}

export function readWalletSession(migrateLegacy = true): WalletSession | null {
  const persistent = read('localStorage');
  const raw = persistent ?? (migrateLegacy ? read('sessionStorage') : null);
  if (!raw) return null;
  try {
    const saved = JSON.parse(raw);
    const session = sessionFromToken(saved.token, saved.provider);
    if (!session) { clearWalletSession(); return null; }
    if (!persistent) saveWalletSession(session);
    return session;
  } catch { clearWalletSession(); return null; }
}

export async function restoreWalletSession(session: WalletSession, loadUser: (token: string) => Promise<{ user: { wallet: string } }>) {
  if (session.expiresAt <= Date.now()) return null;
  try {
    const result = await loadUser(session.token);
    return result.user.wallet === session.wallet ? session : null;
  } catch (error) {
    // A timeout, offline connection or backend restart does not invalidate a login.
    return (error as { status?: number }).status === 401 ? null : session;
  }
}
