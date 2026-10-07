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

export async function dailyJobs() {
  if (!process.env.CRON_SECRET) { console.log('Daily notifications are not configured.'); return; }
  if (!process.env.APP_URL) throw new Error('APP_URL must be configured.');
  const url = new URL('/api/jobs', process.env.APP_URL);
  if (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname)) throw new Error('The scheduler requires HTTPS.');
  const response = await fetch(url, { headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }, signal: AbortSignal.timeout(60000) });
  if (!response.ok) throw new Error(`Scheduler request failed (${response.status}).`);
  console.log('Daily scheduler completed.');
}
