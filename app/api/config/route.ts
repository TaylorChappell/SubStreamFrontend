// Public origin only. Never return service credentials from this endpoint.
export async function GET() {
  // Cloudflare bindings at runtime; process.env supports local Node tests.
  let runtimeUrl = '';
  try { const { env } = await import('cloudflare:workers'); runtimeUrl = (env as unknown as { API_BASE_URL?: string }).API_BASE_URL || ''; } catch { /* Non-Worker runtime. */ }
  const apiUrl = runtimeUrl || process.env.API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || '';
  return Response.json({ apiUrl }, { headers: { 'cache-control': 'no-store' } });
}
