import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import path from 'node:path';
import net from 'node:net';

// Local-only end-to-end check. Starts its own Node/Next server; does not use real cloud credentials or another agent's port.
const port = 3112;
await new Promise((resolve, reject) => { const probe = net.createServer(); probe.once('error', reject); probe.listen(port, '127.0.0.1', () => probe.close(resolve)); });
const base = `http://127.0.0.1:${port}`;
const nonce = randomBytes(6).toString('hex');
const email = name => `ai-${name}-${nonce}@example.test`;
const secret = randomBytes(32).toString('hex');
const server = spawn(process.execPath, [path.resolve('node_modules/next/dist/bin/next'), 'start', '--hostname', '127.0.0.1', '--port', String(port)], {
  cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  env: { ...process.env, DATABASE_URL: '', VERCEL: '', AI_ADMIN_EMAILS: ['owner', 'partner', 'outsider'].map(email).join(','), AI_PIPELINE_SECRET: secret, AI_GITHUB_REPOSITORY: 'RubenWerdmuller/public-site', VAPID_PRIVATE_KEY: '', NEXT_PUBLIC_VAPID_PUBLIC_KEY: '' },
});
let started = false;
server.stdout.on('data', data => { if (String(data).includes('Ready')) started = true; });
server.stderr.on('data', () => {});
function client() {
  let cookie = '';
  const request = async (url, payload, origin = base) => {
    const response = await fetch(base + url, { method: payload === undefined ? 'GET' : 'POST', headers: { Cookie: cookie, ...(payload === undefined ? {} : { 'Content-Type': 'application/json', Origin: origin }) }, body: payload === undefined ? undefined : JSON.stringify(payload) });
    if (response.headers.get('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return { status: response.status, body: await response.json() };
  };
  request.html = async url => (await fetch(base + url, { headers: { Cookie: cookie } })).text();
  return request;
}
const owner = client(), partner = client(), outsider = client(), ordinary = client(), anonymous = client();
const work = async payload => {
  const response = await fetch(base + '/api/ai/worker', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${secret}` }, body: JSON.stringify(payload) });
  assert.equal(response.status, 200); return response.json();
};
try {
  for (let attempt = 0; attempt < 100 && !started; attempt++) { if (server.exitCode !== null) throw new Error('Test server exited.'); await new Promise(resolve => setTimeout(resolve, 100)); }
  assert.equal(started, true, 'The isolated test server did not start.');
  assert.equal((await anonymous('/api/ai/tasks')).status, 401);
  assert.equal((await fetch(base + '/api/ai/worker', { method: 'POST', body: '{}' })).status, 401);
  for (const [name, user] of [['owner', owner], ['partner', partner], ['outsider', outsider], ['ordinary', ordinary]]) assert.equal((await user('/api/app', { action: 'register', name, email: email(name), password: 'temporary-test-only-123', avatar: 0 })).status, 200);
  const first = (await owner('/api/app')).body;
  assert.equal((await partner('/api/app', { action: 'join', code: first.invite })).status, 200);
  assert.equal((await ordinary('/api/ai/tasks')).status, 403);
  assert.equal((await owner('/api/ai/tasks', {}, 'https://other.example')).status, 403);
  const created = await owner('/api/ai/tasks', { kind: 'questions', instruction: 'Maak twee nieuwe dilemma’s over reistijd.', scheduledAt: new Date().toISOString() });
  assert.equal(created.status, 200);
  const id = created.body.tasks[0].id;
  const desk = await owner.html('/ai');
  assert.match(desk, /<textarea/);
  assert.match(desk, /Een nieuwe opdracht/);
  assert.equal((await outsider.html('/ai')).includes('Maak twee nieuwe dilemma'), false);
  assert.doesNotMatch(await ordinary.html('/ai'), /<textarea/);
  assert.equal((await partner('/api/ai/tasks')).body.tasks[0].id, id);
  assert.equal((await outsider('/api/ai/tasks')).body.tasks.length, 0);
  assert.equal((await outsider('/api/ai/tasks', { action: 'cancel', id })).status, 409);
  const firstQuestion = first.questions[0];
  assert.equal((await owner('/api/app', { action: 'answer', questionId: firstQuestion.id, choice: 0 })).status, 200);
  assert.equal((await partner('/api/app')).body.questions.find(q => q.id === firstQuestion.id).partner, null);
  const { task } = await work({ action: 'claim', kind: 'questions' });
  assert.equal(task.id, id);
  assert.deepEqual(task.context.completedThemes, []);
  assert.deepEqual(task.context.sharedScores, []);
  assert.equal(JSON.stringify(task.context).includes(email('owner')), false);
  assert.equal((await work({ action: 'claim', kind: 'questions' })).task, null);
  const raw = { summary: 'Een nieuw dilemma.', questions: [{ sourceQuestionId: firstQuestion.id, title: 'Een nieuwe route langs onbekende meren?', intro: 'Wat lijkt jullie fijn?', theme: 'natuur', type: 'scenario', role: 'core', focus: ['days'], informationValue: 1, options: [
    { title: 'Rustig langs het water', subtitle: 'Een langere route', details: ['Twaalf dagen'], art: 'house', attributes: [{ key: 'days', value: 12 }] },
    { title: 'Direct naar het bos', subtitle: 'Een kortere route', details: ['Zes dagen'], art: 'mountain', attributes: [{ key: 'days', value: 6 }] },
  ] }] };
  assert.equal((await work({ action: 'publish', id, receipt: task.receipt, batch: raw })).ok, true);
  assert.equal((await work({ action: 'publish', id, receipt: task.receipt, batch: raw })).ok, false);
  const after = (await owner('/api/app')).body;
  assert.equal(after.questions.find(q => q.id === firstQuestion.id).own, 0);
  assert.equal(after.history.find(q => q.id === firstQuestion.id).title, firstQuestion.title);
  assert.equal((await owner('/api/ai/tasks')).body.tasks[0].status, 'published');
  assert.equal((await partner('/api/app', { action: 'answer', questionId: firstQuestion.id, choice: 1 })).status, 200);
  assert.equal((await owner('/api/ai/tasks', { kind: 'questions', instruction: 'Maak een nieuwe vraag op basis van gezamenlijke keuzes.', scheduledAt: new Date().toISOString() })).status, 200);
  const next = (await work({ action: 'claim', kind: 'questions' })).task;
  assert.ok(next.context.sharedScores.length > 0);
  assert.ok(next.context.sharedScores.every(score => score.observations === 2));
  await work({ action: 'finish', id: next.id, receipt: next.receipt, status: 'failed', result: 'Alleen een lokale HTTP-test, geen AI-aanroep.' });
  const page = await fetch(base + '/ai'); assert.equal(page.status, 200);
  assert.match(await page.text(), /Log op de startpagina in/);
  console.log('PASS: live HTTP login, admin access, CSRF, duo isolation, private-answer exclusion, worker authentication, publication retries and immutable history.');
} finally {
  server.kill();
  await new Promise(resolve => { if (server.exitCode !== null) resolve(); else server.once('exit', resolve); });
}
