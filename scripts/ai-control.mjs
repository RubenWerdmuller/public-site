import { writeFile, readFile, appendFile } from 'node:fs/promises';
import path from 'node:path';
import { worker, dailyJobs } from './ai-http.mjs';

const temp = process.env.RUNNER_TEMP ?? process.env.AI_TASK_DIRECTORY;
const taskFile = temp ? path.join(temp, 'ai-task.json') : null;
async function github(url) {
  const response = await fetch(`https://api.github.com${url}`, { headers: { Accept: 'application/vnd.github+json', ...(process.env.GH_TOKEN ? { Authorization: `Bearer ${process.env.GH_TOKEN}` } : {}) }, signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}).`);
  return response.json();
}
async function reconcile() {
  if (!process.env.AI_VERCEL_CONTEXT) return;
  const { tasks } = await worker({ action: 'reviews' });
  for (const task of tasks) {
    const match = /^https:\/\/github\.com\/([\w.-]+\/[\w.-]+)\/pull\/(\d+)$/.exec(task.pr_url ?? '');
    if (!match || match[1] !== process.env.GITHUB_REPOSITORY) continue;
    const pr = await github(`/repos/${match[1]}/pulls/${match[2]}`);
    if (pr.state === 'closed' && !pr.merged) {
      await worker({ action: 'finish', id: task.id, receipt: task.receipt, status: 'failed', result: 'De voorgestelde wijziging is gesloten zonder publicatie.' });
    } else if (pr.merged && pr.merge_commit_sha) {
      const status = await github(`/repos/${match[1]}/commits/${pr.merge_commit_sha}/status`);
      if (status.statuses.some(s => s.context === process.env.AI_VERCEL_CONTEXT && s.state === 'success')) await worker({ action: 'finish', id: task.id, receipt: task.receipt, status: 'published', result: 'De goedgekeurde wijziging is gemerged en de productie-deployment is geslaagd.' });
    }
  }
}
async function main() {
  const action = process.argv[2];
  if (action === 'daily') { await dailyJobs(); return; }
  if (action === 'tick') { await worker({ action: 'tick' }); await reconcile(); await worker({ action: 'tick' }); return; }
  if (!taskFile) throw new Error('RUNNER_TEMP or AI_TASK_DIRECTORY must be set.');
  if (action === 'prepare') {
    const { task } = await worker({ action: 'claim', kind: 'system' });
    await appendFile(process.env.GITHUB_OUTPUT, `has_task=${Boolean(task)}\n`);
    if (!task) return;
    await writeFile(taskFile, JSON.stringify(task), { mode: 0o600 });
    const prompt = `Je werkt aan Samen op reis. Lees AGENTS.md en de relevante lokale Next.js-documentatie. Maak de kleinste wijziging voor onderstaande gebruikersopdracht. Werk uitsluitend aan applicatiecode in app/, components/, lib/ en tests/. Wijzig geen authenticatie, autorisatie, databaseadapter, schema, AI-pipeline, secrets, dependencies of workflows. Voeg geen persoonsgegevens, opdrachttekst of sleutels aan de repo toe. Behoud antwoordprivacy, duo-isolatie en Europe/Amsterdamtijd. Schrijf betekenisvolle tests waar nodig. Niet committen, pushen of publiceren. De pipeline controleert en publiceert een voorstel. Bij een opdracht buiten dit bereik: maak geen wijziging.\n\nGebruikersopdracht:\n${task.instruction}\n`;
    await writeFile(path.join(temp, 'ai-prompt.txt'), prompt, { mode: 0o600 });
    await appendFile(process.env.GITHUB_OUTPUT, `task_id=${task.id}\n`);
    return;
  }
  const task = JSON.parse(await readFile(taskFile, 'utf8'));
  if (action === 'review') {
    const result = await worker({ action: 'finish', id: task.id, receipt: task.receipt, status: 'review', result: 'De wijziging heeft tests, typecheck en build doorstaan. Bekijk de pull request en de Vercel-preview voordat je hem samenvoegt.', prUrl: process.env.AI_PR_URL });
    if (!result.ok) throw new Error('The task lease is no longer active.');
  } else if (action === 'failed') {
    await worker({ action: 'finish', id: task.id, receipt: task.receipt, status: 'failed', result: 'De systeemwijziging leverde geen geldig voorstel op of een controle is mislukt. Bestaande appcode blijft actief. Controleer eerst of er al een pull request bestaat voordat je opnieuw probeert.' });
  } else throw new Error('Unknown command.');
  await worker({ action: 'tick' });
}
main().catch(() => { console.error('AI control failed. Check secrets, deployment and task status. Private inputs are not logged.'); process.exitCode = 1; });
