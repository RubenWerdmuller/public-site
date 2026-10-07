import {pushReadiness} from './push-config';
import { query,transaction,type Query } from './db';
import { createReport, insights, localDay, reveal, weekKey, type Answer, type Question } from './domain';
import { currentSet, ensureSet, loadPreferences } from './sets';
import { completedSetCount } from './preferences';
import { weeklyQuestionDashboard } from './weekly-questions';
import type { User } from './auth';
type AnswerRow = Answer & Record<string, unknown>;
type QuestionRow = { id: string; content: Question } & Record<string, unknown>;
export async function pairAnswers(pairId: string,read:Query=query) { return read<AnswerRow>('SELECT * FROM answers WHERE pair_id=$1 ORDER BY answered_at', [pairId]); }
export async function ensureAssignments(pairId: string,day=localDay()) {
  const existing = await query<{question_id:string}&Record<string,unknown>>('SELECT question_id FROM daily_assignments WHERE pair_id=$1 AND day=$2',[pairId,day]);
  const set=await ensureSet(pairId,day);if(!set)return;
  for (const [i,id] of set.question_ids.entries()) if(!existing.some(row=>row.question_id===id))await query('INSERT INTO daily_assignments(pair_id,day,question_id,position) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[pairId,day,id,i]);
}
export async function refreshInsights(pairId: string) {
  return transaction(async query=>{
  await query('SELECT pg_advisory_xact_lock(hashtext($1))',[`insights:${pairId}`]);
  const answers=await pairAnswers(pairId,query); const members=await query<{user_id:string}&Record<string,unknown>>('SELECT user_id FROM memberships WHERE pair_id=$1',[pairId]);
  const result=insights(answers,members.map(m=>m.user_id));
  await query('INSERT INTO compatibility_insights(pair_id,content) VALUES($1,$2::jsonb) ON CONFLICT(pair_id) DO UPDATE SET content=excluded.content,updated_at=now()',[pairId,JSON.stringify(result)]);
  for(const [key,v] of Object.entries(result.estimates)) { const [uid,attr]=key.split(':'); await query('INSERT INTO preference_estimates(pair_id,user_id,attribute_key,estimate,observations) VALUES($1,$2,$3,$4,$5) ON CONFLICT(pair_id,user_id,attribute_key) DO UPDATE SET estimate=excluded.estimate,observations=excluded.observations',[pairId,uid,attr,v.sum/v.count,v.count]); }
  for(const member of members)await query('INSERT INTO preference_subjects(id,pair_id,kind,user_id) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[`${pairId}:user:${member.user_id}`,pairId,'person',member.user_id]);
  const preferences=Object.entries(result.estimates).map(([key,v])=>{const [uid,attr]=key.split(':');return {id:`${pairId}:inferred:${key}`,subject_id:`${pairId}:user:${uid}`,attribute_key:attr,kind:'weak_preference',value:{direction:v.sum/v.count,observations:v.count},confidence:Math.min(.75,v.count/12),source:'inferred',notes:'Richting in gekozen dilemma’s; geen absolute grens of bewezen interactie.'};});
  if(preferences.length)await query('INSERT INTO travel_preferences(id,subject_id,attribute_key,kind,value,confidence,source,notes) SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text,subject_id text,attribute_key text,kind text,value jsonb,confidence real,source text,notes text) ON CONFLICT(id) DO UPDATE SET value=excluded.value,confidence=excluded.confidence,updated_at=now()',[JSON.stringify(preferences)]);
  const evidence=answers.flatMap(a=>{const chosen=a.snapshot.options[a.choice].attributes,other=a.snapshot.options[1-a.choice].attributes;return Object.keys(chosen).filter(key=>typeof chosen[key]==='number'&&typeof other[key]==='number'&&chosen[key]!==other[key]).map(key=>({preference_id:`${pairId}:inferred:${a.user_id}:${key}`,user_id:a.user_id,question_id:a.question_id}));});
  if(evidence.length)await query('INSERT INTO preference_evidence SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(preference_id text,user_id text,question_id text) ON CONFLICT DO NOTHING',[JSON.stringify(evidence)]);
  });
}
export async function weeklyReport(pairId:string,week=weekKey()) {
  type ReportRow = {id:string;week:string;content:ReturnType<typeof createReport>}&Record<string,unknown>;
  let reports=await query<ReportRow>('SELECT * FROM weekly_reports WHERE pair_id=$1 AND week=$2',[pairId,week]);
  if (!reports.length) { const members=await query<{user_id:string}&Record<string,unknown>>('SELECT user_id FROM memberships WHERE pair_id=$1',[pairId]); const all=await pairAnswers(pairId); const shared=all.filter(a=>members.length===2 && members.every(m=>all.some(b=>b.user_id===m.user_id && b.question_id===a.question_id))); const report=createReport(shared,members.map(m=>m.user_id)); await query('INSERT INTO weekly_reports(id,pair_id,week,content) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING',[`${pairId}:${week}`,pairId,week,JSON.stringify(report)]); reports=await query('SELECT * FROM weekly_reports WHERE pair_id=$1 AND week=$2',[pairId,week]); }
  return reports[0];
}
export async function dashboard(user:User) {
  await ensureAssignments(user.pair_id);
  const preferences=await loadPreferences(user.pair_id);
  const weekly=await weeklyQuestionDashboard(user.pair_id,user.id);
  const activeSet=await currentSet(user);
  const members=await query<{id:string;name:string;avatar:number}&Record<string,unknown>>('SELECT u.id,u.name,u.avatar FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.pair_id=$1 ORDER BY m.slot',[user.pair_id]);
  const answers=await pairAnswers(user.pair_id);
  const rows=await query<QuestionRow>('SELECT q.id,q.content FROM jsonb_array_elements_text($1::jsonb) WITH ORDINALITY AS ids(id,position) JOIN questions q ON q.id=ids.id ORDER BY ids.position',[JSON.stringify(activeSet?.question_ids??[])]);
  const allSets=await query<{id:string;day:string;ordinal:number;question_ids:string[]}&Record<string,unknown>>('SELECT id,day,ordinal,question_ids FROM question_sets WHERE pair_id=$1 ORDER BY day DESC,ordinal DESC',[user.pair_id]);
  const setTotals=members.map(m=>({userId:m.id,name:m.name,avatar:m.avatar,completed:completedSetCount(allSets.map(s=>({questionIds:s.question_ids})),answers,m.id)}));
  const savedRows=await query<QuestionRow>('SELECT DISTINCT q.id,q.content FROM saved_questions s JOIN questions q ON q.id=s.question_id WHERE s.pair_id=$1 ORDER BY q.id',[user.pair_id]);
  const enrich=(q:Question)=>({...q,...reveal(answers,user.id,q.id)});
  const archiveBank=await query<QuestionRow>('SELECT id,content FROM questions WHERE id IN (SELECT jsonb_array_elements_text(question_ids) FROM question_sets WHERE pair_id=$1)',[user.pair_id]);
  const archiveMap=new Map(archiveBank.map(q=>[q.id,q.content]));
  const setArchive=allSets.map(s=>({id:s.id,day:s.day,ordinal:s.ordinal,questions:s.question_ids.map(id=>enrich(archiveMap.get(id)!))}));
  const completed = [...new Set(answers.map(a=>a.question_id))].map(id=>enrich(answers.find(a=>a.question_id===id)!.snapshot));
  // Only paired answers feed shared insights/reports. An individual answer never reveals a partner preference.
  const shared = answers.filter(a => members.length===2 && members.every(m=>answers.some(b=>b.user_id===m.id && b.question_id===a.question_id)));
  const report=await weeklyReport(user.pair_id);
  const invite=await query<{code:string}&Record<string,unknown>>('SELECT code FROM invites WHERE pair_id=$1 AND used_at IS NULL AND expires_at>now()',[user.pair_id]);
  return {user,members,preferences,...weekly,setArchive,questions:rows.map(r=>enrich(r.content)),set:activeSet?{id:activeSet.id,ordinal:activeSet.ordinal}:null,setTotals,saved:savedRows.map(r=>enrich(r.content)),history:completed.reverse(),insights:insights(shared,members.map(m=>String(m.id))),report,invite:invite[0]?.code??null,pushConfigured:pushReadiness().ready,pushPublicKey:pushReadiness().ready?process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!:null,day:localDay()};
}
