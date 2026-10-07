import { query, transaction, type Query } from './db';
import type { User } from './auth';
import { localDay, type Answer, type Question } from './domain';
import { knownTravelContext, selectTravelSet, type Preference } from './preferences';
import { availableBank } from './ai-tasks';
import {lockMembership} from './pair-actions';
type SetRow={id:string;day:string;ordinal:number;question_ids:string[]}&Record<string,unknown>;
export class SetNotReadyError extends Error {}
export async function loadPreferences(pairId:string, read:Query=query):Promise<Preference[]> {
  const query=read;
  for(const subject of ['couple','roebie','oelie']) await query('INSERT INTO preference_subjects(id,pair_id,kind,person_key) VALUES($1,$2,$3,$4) ON CONFLICT DO NOTHING',[`${pairId}:${subject}`,pairId,subject==='couple'?'couple':'person',subject]);
  const rows=knownTravelContext.map(p=>({id:`${pairId}:seed:${p.key}`,subject_id:`${pairId}:${p.subject}`,attribute_key:p.attribute,kind:p.kind,value:p.value,confidence:p.confidence,source:p.source,notes:p.notes,boundary:p.boundary??null}));
  await query('INSERT INTO travel_preferences(id,subject_id,attribute_key,kind,value,confidence,source,notes,boundary) SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text,subject_id text,attribute_key text,kind text,value jsonb,confidence real,source text,notes text,boundary jsonb) ON CONFLICT DO NOTHING',[JSON.stringify(rows)]);
  const saved=await query<{id:string;person_key:Preference['subject'];attribute_key:string;kind:Preference['kind'];value:unknown;confidence:number;source:Preference['source'];notes:string;boundary:Preference['boundary']}&Record<string,unknown>>('SELECT p.*,s.person_key FROM travel_preferences p JOIN preference_subjects s ON s.id=p.subject_id WHERE s.pair_id=$1 AND p.source=$2',[pairId,'explicitly_stated']);
  return saved.map(p=>({key:p.id,subject:p.person_key,attribute:p.attribute_key,kind:p.kind,value:p.value,confidence:p.confidence,source:p.source,notes:p.notes,boundary:p.boundary??undefined}));
}
export async function ensureSet(pairId:string,day=localDay(),ordinal=1):Promise<SetRow|null> {
  return transaction(async query=>{
  // Serialize selection across all days/ordinals so concurrent requests cannot reuse questions.
  await query('SELECT pg_advisory_xact_lock(hashtext($1))',[`sets:${pairId}`]);
  let existing=await query<SetRow>('SELECT * FROM question_sets WHERE pair_id=$1 AND day=$2 AND ordinal=$3',[pairId,day,ordinal]);
  if(existing[0])return existing[0];
  const context=await loadPreferences(pairId,query);
  const bank=await availableBank(pairId,query);
  const previous=await query<SetRow>('SELECT * FROM question_sets WHERE pair_id=$1',[pairId]);
  const answers=await query<Answer&Record<string,unknown>>('SELECT * FROM answers WHERE pair_id=$1 ORDER BY answered_at',[pairId]);
  const picked=selectTravelSet(bank,previous.flatMap(s=>s.question_ids),answers,context);
  if(!picked.length)return null;
  await query('INSERT INTO question_sets(id,pair_id,day,ordinal,question_ids) VALUES($1,$2,$3,$4,$5::jsonb) ON CONFLICT DO NOTHING',[`${pairId}:${day}:${ordinal}`,pairId,day,ordinal,JSON.stringify(picked.map(q=>q.id))]);
  existing=await query<SetRow>('SELECT * FROM question_sets WHERE pair_id=$1 AND day=$2 AND ordinal=$3',[pairId,day,ordinal]);
  return existing[0]??null;
  });
}
export async function currentSet(user:User) {
  const day=localDay();const progress=await query<{ordinal:number}&Record<string,unknown>>('SELECT ordinal FROM set_progress WHERE user_id=$1 AND day=$2',[user.id,day]);
  return ensureSet(user.pair_id,day,progress[0]?.ordinal??1);
}
export async function nextSet(user:User,expectedId:string) {
  const current=await currentSet(user);
  // An already advanced cursor makes retries idempotent.
  if(!current||current.id!==expectedId)return current;
  const pending=await query('SELECT qid FROM jsonb_array_elements_text($1::jsonb) AS q(qid) WHERE NOT EXISTS(SELECT 1 FROM answers WHERE user_id=$2 AND question_id=qid) AND NOT EXISTS(SELECT 1 FROM saved_questions WHERE pair_id=$3 AND question_id=qid)',[JSON.stringify(current.question_ids),user.id,user.pair_id]);
  if(pending.length)throw new SetNotReadyError('Maak deze set eerst af of bewaar de open vragen voor later.');
  const next=await ensureSet(user.pair_id,current.day,current.ordinal+1);if(!next)return null;
  await transaction(async read=>{
    await lockMembership(read,user.pair_id,user.id);
    await read('INSERT INTO set_progress(user_id,day,ordinal) VALUES($1,$2,$3) ON CONFLICT(user_id,day) DO UPDATE SET ordinal=excluded.ordinal WHERE set_progress.ordinal=$4',[user.id,current.day,next.ordinal,current.ordinal]);
  });
  return currentSet(user);
}
