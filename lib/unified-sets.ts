import {revealedTo,mayAdvance,canonicalSetSequence} from './unified-set-rules';
import {query,transaction,type Query} from './db';
import {localDay,type Question,type Answer} from './domain';
import {ensureSet} from './sets';
import {stageTasks} from './reiskantoor';
import {studyTaskById} from './dce-design';
import {nextScientificQuestion} from './itinerary-science';
import {archiveAttentionFromEvidence} from './dce-science';
import type {User} from './auth';
type Member={user_id:string;name:string}&Record<string,unknown>;
type Legacy={content:Question}&Record<string,unknown>;
type Round={ordinal:number;task_id:string}&Record<string,unknown>;
type Choice={ordinal:number;user_id:string;choice:number}&Record<string,unknown>;
type Assigned={pair_id:string;ordinal:number;theme:string;legacy_ids:string[];science_first:number|null;science_second:number|null}&Record<string,unknown>;
type Progress={ordinal:number}&Record<string,unknown>;
export class UnifiedFlowError extends Error{constructor(message:string,readonly status=409){super(message);}}
export type UnifiedSlot={
 key:string;kind:'story'|'stage'|'dce'|'legacy';role:string;
 title:string;intro:string;legacyId:string|null;round:number|null;
 options:{title:string;detail:string;attributes?:Record<string,number|string>}[];
 own:number|null;partner:number|null;ready:boolean;
};
export type UnifiedState={
 set:{ordinal:number;theme:string;slots:UnifiedSlot[];completed:number;bothCompleted:boolean;waiting:boolean}|null;
 members:number;totalCompleted:number;scienceCount:number;lastDiscovery:string|null;
};
async function memberships(pairId:string,read:Query=query){
 return read<Member>('SELECT m.user_id,u.name FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.pair_id=$1 ORDER BY m.slot',[pairId]);
}
async function allocateRound(pairId:string,read:Query):Promise<Round|null>{
 await read('SELECT pg_advisory_xact_lock(hashtext($1))',['reiskantoor:'+pairId]);
 const rounds=await read<Round>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
 const members=await memberships(pairId,read);
 const answers=await read<Choice>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1',[pairId]);
 if(!rounds.length){
  await read('INSERT INTO trip_choice_rounds(pair_id,ordinal,task_id) VALUES($1,0,$2) ON CONFLICT DO NOTHING',[pairId,stageTasks[0].id]);
  return {ordinal:0,task_id:stageTasks[0].id};
 }
 const last=rounds.at(-1)!;
 if(rounds.length===1&&!answers.length&&last.task_id.startsWith('dce')){
  await read('UPDATE trip_choice_rounds SET task_id=$1 WHERE pair_id=$2 AND ordinal=$3',[stageTasks[0].id,pairId,last.ordinal]);
  return {...last,task_id:stageTasks[0].id};
 }
 const completed=rounds.filter(r=>members.length===2&&members.every(m=>answers.some(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)));
 if(!completed.some(r=>r.ordinal===last.ordinal))return last;
 const all=await read<(Answer&Record<string,unknown>)>('SELECT * FROM answers WHERE pair_id=$1 ORDER BY answered_at',[pairId]);
 const themes=archiveAttentionFromEvidence(all,members.map(m=>m.user_id));
 const next=nextScientificQuestion(completed.map(r=>({taskId:r.task_id,choices:members.map(m=>answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice as 0|1)})),themes);
 if(!next)return null;
 const ordinal=last.ordinal+1;
 await read('INSERT INTO trip_choice_rounds(pair_id,ordinal,task_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[pairId,ordinal,next.id]);
 return {ordinal,task_id:next.id};
}
async function ensureUserProgress(user:User,read:Query){
 const existing=await read<Progress>('SELECT ordinal FROM unified_set_progress WHERE user_id=$1',[user.id]);
 if(existing[0])return existing[0].ordinal;
 await read('INSERT INTO unified_set_progress(user_id,pair_id,ordinal) VALUES($1,$2,1) ON CONFLICT DO NOTHING',[user.id,user.pair_id]);
 return 1;
}
async function ensureAssigned(user:User):Promise<Assigned|null>{
 // The legacy selection itself uses a database transaction. Resolve it BEFORE
 // acquiring the unified set transaction (important for local PGlite too).
 const [cursor]=await query<Progress>('SELECT ordinal FROM unified_set_progress WHERE user_id=$1',[user.id]);
 const ordinalBefore=cursor?.ordinal??1;
 const [known]=await query<Assigned>('SELECT * FROM unified_sets WHERE pair_id=$1 AND ordinal=$2',[user.pair_id,ordinalBefore]);
 const legacy=known?null:await ensureSet(user.pair_id,localDay(),1000+ordinalBefore);
 return transaction(async read=>{
  await read('SELECT pg_advisory_xact_lock(hashtext($1))',['unified:'+user.pair_id]);
  const ordinal=await ensureUserProgress(user,read);
  if(ordinal!==ordinalBefore)throw new UnifiedFlowError('Een andere sessie heeft de set al gewijzigd. Vernieuw de vragen.');
  const [previous]=await read<Assigned>('SELECT * FROM unified_sets WHERE pair_id=$1 AND ordinal=$2',[user.pair_id,ordinal]);
  if(previous){
   if(previous.science_first===null){const round=await allocateRound(user.pair_id,read);
    if(round){await read('UPDATE unified_sets SET science_first=$1 WHERE pair_id=$2 AND ordinal=$3 AND science_first IS NULL',[round.ordinal,user.pair_id,ordinal]);previous.science_first=round.ordinal;}
   }
   if(previous.science_first!==null&&previous.science_second===null){
    const members=await memberships(user.pair_id,read);
    const answered=await read<Choice>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 AND ordinal=$2',[user.pair_id,previous.science_first]);
    if(members.length===2&&members.every(m=>answered.some(a=>a.user_id===m.user_id))){
     const round=await allocateRound(user.pair_id,read);
     if(round&&round.ordinal!==previous.science_first){
      await read('UPDATE unified_sets SET science_second=$1 WHERE pair_id=$2 AND ordinal=$3 AND science_second IS NULL',[round.ordinal,user.pair_id,ordinal]);previous.science_second=round.ordinal;
     }
    }
   }
   return previous;
  }
  if(!legacy?.question_ids?.length)return null;
  const selected=legacy.question_ids.slice(0,2);
  if(selected.length<2)return null;
  const rows=await read<Legacy>('SELECT content FROM questions WHERE id=ANY($1::text[])',[selected]);
  const title=rows.find(r=>r.content.id===selected[0])?.content.theme??'Samen ontdekken';
  const round=await allocateRound(user.pair_id,read);
  // Existing round is never reused for a second assignment.
  const previousRound=await read('SELECT 1 FROM unified_sets WHERE pair_id=$1 AND (science_first=$2 OR science_second=$2)',[user.pair_id,round?.ordinal??-1]);
  const first=round&&!previousRound.length?round.ordinal:null;
  if(first===null&&!round)return null; // All scientific tasks are finished; never create a stuck set.
  await read('INSERT INTO unified_sets(pair_id,ordinal,theme,legacy_ids,science_first) VALUES($1,$2,$3,$4::jsonb,$5) ON CONFLICT DO NOTHING',[user.pair_id,ordinal,title,JSON.stringify(selected),first]);
  const [assigned]=await read<Assigned>('SELECT * FROM unified_sets WHERE pair_id=$1 AND ordinal=$2',[user.pair_id,ordinal]);
  return assigned??null;
 });
}
async function buildState(user:User,assigned:Assigned|null):Promise<UnifiedState>{
 const members=await memberships(user.pair_id);
 const finished=await query<{count:number}&Record<string,unknown>>('SELECT COUNT(*)::int AS count FROM unified_sets WHERE pair_id=$1',[user.pair_id]);
 const [science]=await query<{count:number}&Record<string,unknown>>("SELECT COUNT(*)::int AS count FROM trip_choice_rounds r WHERE r.pair_id=$1 AND r.task_id LIKE 'dce3-%'",[user.pair_id]);
 if(!assigned)return {set:null,members:members.length,totalCompleted:finished[0]?.count??0,scienceCount:science.count,lastDiscovery:null};
 const rows=await query<Legacy>('SELECT content FROM questions WHERE id=ANY($1::text[])',[assigned.legacy_ids]);
 const answers=await query<(Answer&Record<string,unknown>)>('SELECT * FROM answers WHERE pair_id=$1 AND question_id=ANY($2::text[])',[user.pair_id,assigned.legacy_ids]);
 const rounds=[assigned.science_first,assigned.science_second].filter((x):x is number=>x!==null);
 const tasks=rounds.length?await query<Round>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 AND ordinal=ANY($2::int[])',[user.pair_id,rounds]):[];
 const picks=rounds.length?await query<Choice>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 AND ordinal=ANY($2::int[])',[user.pair_id,rounds]):[];
 const legacySlots=assigned.legacy_ids.map((id,i):UnifiedSlot=>{
  const q=rows.find(r=>r.content.id===id)?.content;
  const {own,partner:other}=revealedTo(user.id,members.map(m=>m.user_id),answers.filter(a=>a.question_id===id).map(a=>({userId:a.user_id,choice:a.choice as 0|1})));
  return {key:'legacy-'+id,kind:i===0?'story':'legacy',role:i===0?'Een mooi dilemma':'Samen ontdekken',
   title:q?.title??'Een vraag voor jullie',intro:q?.intro??'',legacyId:id,round:null,
   options:q?.options.map(o=>({title:o.title,detail:o.subtitle}))??[],
   own,partner:other,ready:!!q};
 });
 const scientificSlot=(n:number|null,index:0|1):UnifiedSlot=>{
  const task=tasks.find(t=>t.ordinal===n);
  const item=task?(stageTasks.find(s=>s.id===task.task_id)??studyTaskById(task.task_id)):null;
  const {own,partner:other}=revealedTo(user.id,members.map(m=>m.user_id),picks.filter(a=>a.ordinal===n).map(a=>({userId:a.user_id,choice:a.choice as 0|1})));
  const isStage=item&&'kind' in item;
  const options=item?([item.a,item.b] as const).map((o,i)=>{
   if('label' in o)return {title:o.label,detail:o.detail};
   return {title:'Reis '+(i===0?'A':'B'),detail:'Vergelijk kosten, verblijf, rijtijd, natuur, comfort en ontmoetingen.',attributes:o as Record<string,number>};
  }):[];
  return {key:'science-'+index,kind:isStage?'stage':'dce',role:isStage?'De reis vormgeven':'De wetenschappelijke afweging',
   title:item?.question??'De volgende afweging verschijnt zodra jullie beiden klaar zijn met de vorige.',
   intro:isStage?item.description:'Kies de combinatie die jij het aantrekkelijkst vindt. Er bestaat geen goed antwoord.',
   legacyId:null,round:n,options,own,partner:other,ready:!!item};
 };
 const slots=[legacySlots[0],scientificSlot(assigned.science_first,0),legacySlots[1],scientificSlot(assigned.science_second,1)];
 canonicalSetSequence(assigned.legacy_ids,[assigned.science_first,assigned.science_second]);
 const completed=slots.filter(slot=>slot.own!==null).length;
 const bothCompleted=mayAdvance(members.map(m=>m.user_id),slots.map(slot=>({ready:slot.ready,choices:[...(slot.own===null?[]:[{userId:user.id,choice:slot.own as 0|1}]),...(slot.partner===null?[]:[{userId:members.find(m=>m.user_id!==user.id)?.user_id??'',choice:slot.partner as 0|1}])]})));
 return {set:{ordinal:assigned.ordinal,theme:assigned.theme,slots,completed,bothCompleted,waiting:slots.some(slot=>!slot.ready||slot.own!==null&&slot.partner===null)},members:members.length,
  totalCompleted:finished[0]?.count??0,scienceCount:science.count,lastDiscovery:bothCompleted?'Jullie hebben allebei gekozen. Reis-DNA en Reiskantoor zijn bijgewerkt.':null};
}
export async function getUnifiedState(user:User){return buildState(user,await ensureAssigned(user));}
export async function ensureUnifiedSlot(user:User,key:string):Promise<UnifiedSlot>{
 const state=await getUnifiedState(user),slot=state.set?.slots.find(s=>s.key===key);
 if(!slot||!slot.ready)throw new UnifiedFlowError('Deze vraag staat nog niet klaar.');
 if(slot.own!==null)throw new UnifiedFlowError('Je hebt deze vraag al beantwoord.');
 return slot;
}
export async function recordUnifiedChoice(user:User,round:number,choice:0|1){
 return transaction(async read=>{
  await read('SELECT pg_advisory_xact_lock(hashtext($1))',['unified-answer:'+user.pair_id]);
  const [cursor]=await read<Progress>('SELECT ordinal FROM unified_set_progress WHERE user_id=$1 AND pair_id=$2',[user.id,user.pair_id]);
  const [assigned]=await read<Assigned>('SELECT * FROM unified_sets WHERE pair_id=$1 AND ordinal=$2',[user.pair_id,cursor?.ordinal??-1]);
  if(!assigned||![assigned.science_first,assigned.science_second].includes(round))throw new UnifiedFlowError('Dit is niet je huidige set.');
  const [task]=await read<Round>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 AND ordinal=$2',[user.pair_id,round]);
  if(!task||!stageTasks.some(q=>q.id===task.task_id)&&!studyTaskById(task.task_id))throw new UnifiedFlowError('Onbekende wetenschappelijke vraag.');
  const rows=await read<Choice>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 AND ordinal=$2 AND user_id=$3',[user.pair_id,round,user.id]);
  if(rows.length)throw new UnifiedFlowError('Je keuze staat al vast.');
  await read('INSERT INTO trip_choice_answers(pair_id,ordinal,user_id,choice) VALUES($1,$2,$3,$4)',[user.pair_id,round,user.id,choice]);
 });
}
export async function advanceUnifiedSet(user:User,expectedOrdinal:number){
 const state=await getUnifiedState(user);
 if(!state.set||state.set.ordinal!==expectedOrdinal)throw new UnifiedFlowError('Open eerst de nieuwste set.');
 if(!state.set.bothCompleted)throw new UnifiedFlowError('Jullie kunnen samen naar de volgende set zodra jullie allebei vier keuzes hebben gemaakt.');
 await transaction(async read=>{
  await read('SELECT pg_advisory_xact_lock(hashtext($1))',['unified:'+user.pair_id]);
  const [cursor]=await read<Progress>('SELECT ordinal FROM unified_set_progress WHERE user_id=$1',[user.id]);
  if(cursor?.ordinal===expectedOrdinal)await read('UPDATE unified_set_progress SET ordinal=ordinal+1 WHERE user_id=$1 AND pair_id=$2',[user.id,user.pair_id]);
 });
 return getUnifiedState(user);
}
