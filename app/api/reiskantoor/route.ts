import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {currentUser} from '@/lib/auth';
import {query,transaction,type Query} from '@/lib/db';
import {choiceTasks,stageTasks,learnPreferences,preferenceRanking,evaluatePreferenceModel,type CompletedStage,type ChoiceAnswer} from '@/lib/reiskantoor';
import {inferScientificItinerary,nextScientificQuestion} from '@/lib/itinerary-science';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}});
type Member={user_id:string;name:string;avatar:number}&Record<string,unknown>;
type Round={ordinal:number;task_id:string}&Record<string,unknown>;
type Answer={ordinal:number;user_id:string;choice:0|1}&Record<string,unknown>;
async function state(pairId:string,userId:string,read:Query=query){
 const members=await read<Member>('SELECT m.user_id,u.name,u.avatar FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.pair_id=$1 ORDER BY m.slot',[pairId]);
 const rounds=await read<Round>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
 const answers=await read<Answer>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
 const completed=rounds.filter(r=>members.length===2&&members.every(m=>answers.some(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)));
 const results:CompletedStage[]=completed.map(r=>({taskId:r.task_id,choices:members.map(m=>answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice)}));
 const choiceRows=completed.filter(r=>choiceTasks.some(q=>q.id===r.task_id));
 const personal=members.map(m=>{
   const responses:ChoiceAnswer[]=choiceRows.map(r=>({taskId:r.task_id,choice:answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice}));
   const model=learnPreferences(responses);
   return {id:m.user_id,name:m.name,avatar:m.avatar,observations:model.count,
     diagnostics:evaluatePreferenceModel(responses),
     ranking:model.count>=2?preferenceRanking(model):[],
     message:model.count<2?'Beantwoord samen meer keuzevragen om deze ranking te zien.':
       'Verkennende Bayesiaanse schatting (MAP + Laplace). De onzekerheid is aanzienlijk; geen gevalideerde wetenschappelijke ranglijst.'};
 });
 const fullyPaired=personal.length===2&&personal.every(m=>m.observations>=3);
 const personModels=members.map(m=>learnPreferences(choiceRows.map(r=>({taskId:r.task_id,choice:answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice}))));
 const shared=fullyPaired?{...personModels[0],count:Math.min(...personModels.map(m=>m.count)),
   means:personModels[0].means.map((v,i)=>(v+personModels[1].means[i])/2)}:null;
 const travel=inferScientificItinerary(results,personModels);
 const proposals=travel.alternatives.map(v=>({id:v.id,title:v.title,weeks:v.plan.stages.map(s=>s.idealWeeks),cost:null,warnings:v.tradeoffs,score:v.score}));
 const last=rounds.at(-1);
 const task=last?(stageTasks.find(t=>t.id===last.task_id)??choiceTasks.find(t=>t.id===last.task_id)):null;
 const own=last?answers.find(a=>a.ordinal===last.ordinal&&a.user_id===userId):null;
 const latest=completed.at(-1);
 const latestTask=latest?(stageTasks.find(t=>t.id===latest.task_id)??choiceTasks.find(t=>t.id===latest.task_id)):null;
 const latestOwn=latest?answers.find(a=>a.ordinal===latest.ordinal&&a.user_id===userId):null;
 const latestPartner=latest?answers.find(a=>a.ordinal===latest.ordinal&&a.user_id!==userId):null;
 return {
   paired:members.length===2,people:personal,completed:completed.length,completedStages:travel.completed,totalStageQuestions:stageTasks.length,
   answeredByMe:answers.filter(a=>a.user_id===userId).length,
   choice:task&&last&&!completed.some(r=>r.ordinal===last.ordinal)?{ordinal:last.ordinal,task,own:own?.choice??null}:null,
   lastReveal:latestTask&&latestOwn&&latestPartner?{question:latestTask.question,own:latestOwn.choice,partner:latestPartner.choice}:null,
   travel:{...travel,proposals}, 
   funFacts:{same:results.filter(r=>r.choices[0]===r.choices[1]).length,
     different:results.filter(r=>r.choices[0]!==r.choices[1]).length},
   modelStatus:'De coëfficiënten zijn voorlopige persoonlijke signalen uit een klein keuze-experiment, geen gekalibreerde kans op een geslaagde reis.',
 };
}
async function advance(pairId:string){
 await transaction(async tx=>{
   await tx('SELECT pg_advisory_xact_lock(hashtext($1))',['reiskantoor:'+pairId]);
   const members=await tx<Member>('SELECT m.user_id,u.name,u.avatar FROM memberships m JOIN users u ON u.id=m.user_id WHERE m.pair_id=$1 ORDER BY m.slot',[pairId]);
   const rounds=await tx<Round>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
   const all=await tx<Answer>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1',[pairId]);
   if(!rounds.length){
     await tx('INSERT INTO trip_choice_rounds(pair_id,ordinal,task_id) VALUES($1,0,$2)',[pairId,stageTasks[0].id]);
   }else if(rounds.length===1&&rounds[0].task_id.startsWith('dce')&&!all.length){
     // Older versions created an initial conjoint question on visiting Reiskantoor.
     // Replace it only when *nobody* has answered; preserve every real response.
     await tx('UPDATE trip_choice_rounds SET task_id=$1 WHERE pair_id=$2 AND ordinal=$3',[stageTasks[0].id,pairId,rounds[0].ordinal]);
   }else if(members.length===2){
     const last=rounds.at(-1)!;
     if(members.every(m=>all.some(a=>a.ordinal===last.ordinal&&a.user_id===m.user_id))){
       const both=rounds.filter(r=>members.every(m=>all.some(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)));
       const next=nextScientificQuestion(both.map(r=>({taskId:r.task_id,choices:members.map(m=>all.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice)})));
       if(next)await tx('INSERT INTO trip_choice_rounds(pair_id,ordinal,task_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[pairId,last.ordinal+1,next.id]);
     }
   }
 });
}
export async function GET(){
 const user=await currentUser();if(!user)return json({error:'Log eerst in om jullie reisvragen te bekijken.'},401);
 await advance(user.pair_id);
 return json(await state(user.pair_id,user.id));
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin||!URL.canParse(origin)||new URL(origin).host!==req.headers.get('host'))return json({error:'Deze aanvraag komt niet uit de app.'},403);
 const user=await currentUser();if(!user)return json({error:'Log eerst in.'},401);
 try{
   const raw=await req.text();if(raw.length>4000)return json({error:'Aanvraag te groot.'},413);
   const input=z.object({action:z.literal('answer'),ordinal:z.number().int().min(0).max(100),choice:z.number().int().min(0).max(1)}).strict().parse(JSON.parse(raw));
   await transaction(async tx=>{
     await tx('SELECT pg_advisory_xact_lock(hashtext($1))',['reiskantoor:'+user.pair_id]);
     const [last]=await tx<Round>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal DESC LIMIT 1',[user.pair_id]);
     if(!last||last.ordinal!==input.ordinal)throw Error('ROUND_STALE');
     const existing=await tx<Answer>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 AND ordinal=$2 AND user_id=$3',[user.pair_id,input.ordinal,user.id]);
     if(existing.length)throw Error('ANSWER_ALREADY_SAVED');
     await tx('INSERT INTO trip_choice_answers(pair_id,ordinal,user_id,choice) VALUES($1,$2,$3,$4)',[user.pair_id,input.ordinal,user.id,input.choice]);
   });
   await advance(user.pair_id);
   return json({ok:true,...await state(user.pair_id,user.id)});
 }catch(error){
   if(error instanceof SyntaxError||error instanceof z.ZodError)return json({error:'Controleer de keuze.'},400);
   if(error instanceof Error&&error.message==='ROUND_STALE')return json({error:'Deze vraag is inmiddels voorbij. Open Reisvragen opnieuw.'},409);
   if(error instanceof Error&&error.message==='ANSWER_ALREADY_SAVED')return json({error:'Je hebt deze vraag al beantwoord.'},409);
   console.error('Reisvragen request failed:',error instanceof Error?error.message:'onbekend');
   return json({error:'Opslaan lukte niet.'},500);
 }
}
