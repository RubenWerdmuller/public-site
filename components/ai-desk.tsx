'use client';
import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { SketchButton } from './sketch-button';
import type { TaskKind, TaskView } from '@/lib/ai-contracts';
import { fromAmsterdamDateTime } from '@/lib/ai-schedule';

const states = { queued: 'Ingepland', running: 'Wordt uitgevoerd', review: 'Klaar om te bekijken', published: 'Gepubliceerd', failed: 'Niet gelukt', cancelled: 'Geannuleerd' };
const date = (value: string) => new Intl.DateTimeFormat('nl-NL', { timeZone: 'Europe/Amsterdam', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
export function AiDesk({ initialTasks }: { initialTasks: TaskView[] }) {
  const [tasks, setTasks] = useState(initialTasks);
  const [kind, setKind] = useState<TaskKind>('questions');
  const [instruction, setInstruction] = useState('');
  const [timing, setTiming] = useState('next');
  const [scheduled, setScheduled] = useState('');
  const [repeatWeekly, setRepeatWeekly] = useState(false);
  const [acknowledgePublic, setAcknowledgePublic] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    const timer = setInterval(() => {
      void fetch('/api/ai/tasks', { cache: 'no-store', signal: controller.signal }).then(async r => {
        if (r.ok) { const data = await r.json(); if (!controller.signal.aborted) setTasks(data.tasks); }
      }).catch(() => {});
    }, 20000);
    return () => { clearInterval(timer); controller.abort(); };
  }, []);
  async function send(payload: unknown) {
    setBusy(true); setNotice('');
    try {
      const response = await fetch('/api/ai/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Opslaan lukte niet.');
      setTasks(data.tasks); return true;
    } catch (error) { setNotice(error instanceof Error ? error.message : 'Geen verbinding. Probeer opnieuw.'); return false; }
    finally { setBusy(false); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const scheduledAt = timing === 'next' ? new Date().toISOString() : fromAmsterdamDateTime(scheduled);
    if (!scheduledAt) { setNotice('Dit tijdstip bestaat niet in de Nederlandse tijdzone. Kies een ander tijdstip.'); return; }
    if (await send({ kind, instruction, scheduledAt, repeatWeekly: kind === 'questions' && repeatWeekly, acknowledgePublic })) { setInstruction(''); setAcknowledgePublic(false); setNotice('Ingepland. De volgende pipeline-run na dit tijdstip neemt jullie opdracht mee.'); }
  }
  return <main className="ai-page"><div className="content">
    <Link href="/" className="quiet">← Terug naar jullie reisboekje</Link>
    <div className="page-heading"><span className="eyebrow">JULLIE IDEEËN · EEN BEETJE HULP</span><h1>Wat mag er groeien?</h1><p>Geef de AI een opdracht voor jullie vragen of het reisboekje. Jullie zien hier wat er gebeurt.</p></div>
    <section className="paper"><h2>Een nieuwe opdracht</h2><form onSubmit={e => void submit(e)} className="ai-form">
      <label>Wat wil je verbeteren?<select value={kind} onChange={e => setKind(e.target.value as TaskKind)} disabled={busy}><option value="questions">Vragen maken of verbeteren</option><option value="system">De app of een systeem verbeteren</option></select></label>
      <label>Jullie opdracht<textarea value={instruction} onChange={e => setInstruction(e.target.value)} minLength={10} maxLength={4000} required rows={5} placeholder="Maak 14 nieuwe dilemma’s over een lange reis met een klein budget. Vermijd vragen die we al hebben gehad." disabled={busy} /></label>
      <p id="ai-context">Voor vragen krijgt AI bestaande dilemma’s, gezamenlijke reisafspraken en een samenvatting van thema’s die jullie allebei hebben beantwoord. Jullie namen en e-mailadressen worden niet meegestuurd. Je partner kan deze opdracht ook lezen.</p>
      {kind === 'system' && <><p>Appwijzigingen komen eerst in een pull request. De opdracht en code kunnen zichtbaar worden in GitHub-logs en jullie openbare repo. Zet geen privégegevens of sleutels in deze opdracht.</p><label className="ai-repeat"><input type="checkbox" required checked={acknowledgePublic} onChange={e => setAcknowledgePublic(e.target.checked)} disabled={busy} /> Deze appopdracht mag openbaar worden.</label></>}
      <label>Wanneer?<select value={timing} onChange={e => setTiming(e.target.value)} disabled={busy}><option value="next">Bij de volgende pipeline-run</option><option value="custom">Op een gekozen tijdstip</option></select></label>
      {timing === 'custom' && <label>Datum en tijd · Nederland<input type="datetime-local" value={scheduled} onChange={e => setScheduled(e.target.value)} required disabled={busy} /></label>}
      {kind === 'questions' && <label className="ai-repeat"><input type="checkbox" checked={repeatWeekly} onChange={e => setRepeatWeekly(e.target.checked)} disabled={busy} /> Herhaal iedere week met actuele reiscontext. Annuleer de volgende opdracht om te stoppen.</label>}
      <p>Nieuwe vragen worden na controle toegevoegd. Verbeterde vragen krijgen een nieuwe versie; eerdere antwoorden blijven intact. Appwijzigingen bekijk je eerst in een preview.</p>
      <SketchButton disabled={busy} type="submit">{busy ? 'Even opslaan…' : 'Plan deze opdracht'}</SketchButton>
    </form></section>
    <p role="status" aria-live="polite">{notice}</p>
    <section aria-labelledby="ai-queue"><h2 id="ai-queue">Jullie opdrachten</h2>{!tasks.length && <p>Nog geen opdrachten. Op maandag kan een berichtje jullie hierheen brengen.</p>}
      <div className="ai-list">{tasks.map(task => <article key={task.id} className="paper"><div className="ai-task-heading"><h3>{task.kind === 'questions' ? 'Vragen verbeteren' : 'Het reisboekje verbeteren'}</h3><span>{states[task.status]}</span></div><p className="ai-instruction">{task.instruction}</p><p>Vanaf {date(task.scheduled_at)} · Nederlandse tijd</p>{task.result && <p>{task.result}</p>}{task.pr_url && <a href={task.pr_url} target="_blank" rel="noopener noreferrer" className="quiet">Bekijk de wijziging op GitHub ↗</a>}<div className="ai-actions">{['queued', 'failed'].includes(task.status) && <button disabled={busy} type="button" className="quiet" onClick={() => void send({ action: 'cancel', id: task.id })}>Annuleren</button>}{task.status === 'failed' && <button disabled={busy} type="button" className="quiet" onClick={() => void send({ action: 'retry', id: task.id })}>Probeer opnieuw</button>}</div></article>)}</div>
    </section>
  </div></main>;
}
