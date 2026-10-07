import { query } from './db';
import { createReport, insights, localDay, questionSelector, reveal, weekKey, type Answer, type Question } from './domain';
import type { User } from './auth';
type AnswerRow = Answer & Record<string, unknown>;
type QuestionRow = { id: string; content: Question } & Record<string, unknown>;
export async function pairAnswers(pairId: string) { return query<AnswerRow>('SELECT * FROM answers WHERE pair_id=$1 ORDER BY answered_at', [pairId]); }
export async function ensureAssignments(pairId: string) {
  const day = localDay(); const existing = await query('SELECT question_id FROM daily_assignments WHERE pair_id=$1 AND day=$2',[pairId,day]); if(existing.length) return;
  const bank = (await query<QuestionRow>('SELECT id,content FROM questions ORDER BY id')).map(r => r.content);
  const previous = await query<{question_id:string}&Record<string,unknown>>('SELECT DISTINCT question_id FROM daily_assignments WHERE pair_id=$1',[pairId]);
  const answers = await pairAnswers(pairId);
  const picked = questionSelector(bank, previous.map(r=>r.question_id),answers.slice(-24).map(a=>a.snapshot));
  for (const [i,q] of picked.entries()) await query('INSERT INTO daily_assignments(pair_id,day,question_id,position) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[pairId,day,q.id,i]);
}
export async function refreshInsights(pairId: string) {
  const answers=await pairAnswers(pairId); const members=await query<{user_id:string}&Record<string,unknown>>('SELECT user_id FROM memberships WHERE pair_id=$1',[pairId]);
  const result=insights(answers,members.map(m=>m.user_id));
  await query('INSERT INTO compatibility_insights(pair_id,content) VALUES($1,$2::jsonb) ON CONFLICT(pair_id) DO UPDATE SET content=excluded.content,updated_at=now()',[pairId,JSON.stringify(result)]);
  for(const [key,v] of Object.entries(result.estimates)) { const [uid,attr]=key.split(':'); await query('INSERT INTO preference_estimates(pair_id,user_id,attribute_key,estimate,observations) VALUES($1,$2,$3,$4,$5) ON CONFLICT(pair_id,user_id,attribute_key) DO UPDATE SET estimate=excluded.estimate,observations=excluded.observations',[pairId,uid,attr,v.sum/v.count,v.count]); }
}
export async function weeklyReport(pairId:string) {
  type ReportRow = {id:string;week:string;content:ReturnType<typeof createReport>}&Record<string,unknown>;
  const week=weekKey(); let reports=await query<ReportRow>('SELECT * FROM weekly_reports WHERE pair_id=$1 AND week=$2',[pairId,week]);
  if (!reports.length) { const members=await query<{user_id:string}&Record<string,unknown>>('SELECT user_id FROM memberships WHERE pair_id=$1',[pairId]); const all=await pairAnswers(pairId); const shared=all.filter(a=>members.length===2 && members.every(m=>all.some(b=>b.user_id===m.user_id && b.question_id===a.question_id))); const report=createReport(shared,members.map(m=>m.user_id)); await query('INSERT INTO weekly_reports(id,pair_id,week,content) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING',[`${pairId}:${week}`,pairId,week,JSON.stringify(report)]); reports=await query('SELECT * FROM weekly_reports WHERE pair_id=$1 AND week=$2',[pairId,week]); }
  return reports[0];
}
export async function dashboard(user:User) {
  await ensureAssignments(user.pair_id);
  const members=await query<{id:string;name:string;avatar:number}&Record<string,unknown>>('SELECT u.id,u.name,u.avatar FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.pair_id=$1 ORDER BY m.slot',[user.pair_id]);
  const answers=await pairAnswers(user.pair_id);
  const rows=await query<QuestionRow>('SELECT q.id,q.content FROM daily_assignments d JOIN questions q ON q.id=d.question_id WHERE d.pair_id=$1 AND d.day=$2 ORDER BY d.position',[user.pair_id,localDay()]);
  const savedRows=await query<QuestionRow>('SELECT DISTINCT q.id,q.content FROM saved_questions s JOIN questions q ON q.id=s.question_id WHERE s.pair_id=$1 ORDER BY q.id',[user.pair_id]);
  const enrich=(q:Question)=>({...q,...reveal(answers,user.id,q.id)});
  const completed = [...new Set(answers.map(a=>a.question_id))].map(id=>enrich(answers.find(a=>a.question_id===id)!.snapshot));
  // Only paired answers feed shared insights/reports. An individual answer never reveals a partner preference.
  const shared = answers.filter(a => members.length===2 && members.every(m=>answers.some(b=>b.user_id===m.id && b.question_id===a.question_id)));
  const report=await weeklyReport(user.pair_id);
  const invite=await query<{code:string}&Record<string,unknown>>('SELECT code FROM invites WHERE pair_id=$1 AND used_at IS NULL AND expires_at>now()',[user.pair_id]);
  return {user,members,questions:rows.map(r=>enrich(r.content)),saved:savedRows.map(r=>enrich(r.content)),history:completed.reverse(),insights:insights(shared,members.map(m=>String(m.id))),report,invite:invite[0]?.code??null,pushConfigured:!!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,day:localDay()};
}
