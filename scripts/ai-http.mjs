export async function worker(body) {
  const base = process.env.APP_URL;
  const secret = process.env.AI_PIPELINE_SECRET;
  if (!base || !secret) throw new Error('APP_URL and AI_PIPELINE_SECRET must be configured.');
  const url = new URL('/api/ai/worker', base);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('The worker requires HTTPS.');
  const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify(body), signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Worker request failed (${response.status}). Check deployment, secrets and database; response contents are withheld.`);
  return response.json();
}
