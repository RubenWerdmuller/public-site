import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {currentUser} from '@/lib/auth';
import {query,transaction,type Query} from '@/lib/db';
import {starterPlan,validatePlan,learnPreferences,nextChoiceTask,choiceTasks,createProposals,planWarnings,type ChoiceAnswer,type TripPlan} from '@/lib/reiskantoor';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}});
type Member={user_id:string}&Record<string,unknown>;
type PlanRow={plan:TripPlan;revision:number}&Record<string,unknown>;
type RoundRow={ordinal:number;task_id:string}&Record<string,unknown>;
type AnswerRow={ordinal:number;user_id:string;choice:0|1}&Record<string,unknown>;
const stage=z.object({
 id:z.string().regex(/^[a-zA-Z0-9-]{1,70}$/),
 name:z.string().trim().min(1).max(70), region:z.string().max(100),
 kind:z.enum(['outbound','stay','return','other']),
 minWeeks:z.number().int().min(1).max(52),idealWeeks:z.number().int().min(1).max(52),maxWeeks:z.number().int().min(1).max(52),
 locked:z.boolean(),weeklyBudget:z.number().int().min(0).max(20000),travelHours:z.number().min(0).max(240),notes:z.string().max(400),
});
const planSchema=z.object({weeks:z.number().int().min(2).max(52),maxBudget:z.number().int().min(0).max(1000000),departureMonth:z.number().int().min(0).max(12),stages:z.array(stage).min(1).max(12)}).strict();
async function getState(pairId:string,userId:string,read:Query=query) {
 const members=await read<Member>('SELECT user_id FROM memberships WHERE pair_id=$1 ORDER BY slot',[pairId]);
 const [row]=await read<PlanRow>('SELECT plan,revision FROM trip_workspaces WHERE pair_id=$1',[pairId]);
 const rounds=await read<RoundRow>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
 const answers=await read<AnswerRow>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
 const complete=rounds.filter(r=>members.length===2&&members.every(m=>answers.some(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)));
 const answerList=(uid:string):ChoiceAnswer[]=>complete.flatMap(r=>{
   const answer=answers.find(a=>a.ordinal===r.ordinal&&a.user_id===uid);
   return answer?[{taskId:r.task_id,choice:answer.choice}]:[];
 });
 const mine=learnPreferences(answerList(userId));
 const partner=members.find(m=>m.user_id!==userId);
 const other=partner?learnPreferences(answerList(partner.user_id)):null;
 const shared=other?{...mine,means:mine.means.map((v,i)=>(v+other.means[i])/2),count:Math.min(mine.count,other.count)}:null;
 const latest=rounds.at(-1);
 const current=latest?choiceTasks.find(t=>t.id===latest.task_id):null;
 const ownAnswer=latest?answers.find(a=>a.ordinal===latest.ordinal&&a.user_id===userId):null;
 const otherAnswer=latest&&complete.some(r=>r.ordinal===latest.ordinal)&&partner?answers.find(a=>a.ordinal===latest.ordinal&&a.user_id===partner.user_id):null;
 return {
   plan:row?.plan??starterPlan,revision:row?.revision??0,paired:members.length===2,
   suggestions:createProposals(row?.plan??starterPlan,shared),warnings:planWarnings(row?.plan??starterPlan),
   choice:current?{ordinal:latest!.ordinal,task:current,own:ownAnswer?.choice??null,partner:otherAnswer?.choice??null,complete:complete.some(r=>r.ordinal===latest!.ordinal)}:null,
   completed:complete.length,
   funFacts:{
     same:complete.filter(r=>{
       const selected=members.map(m=>answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice);
       return selected[0]===selected[1];
     }).length,
     different:complete.filter(r=>{
       const selected=members.map(m=>answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice);
       return selected[0]!==selected[1];
     }).length,
     latestDifference:complete.slice().reverse().find(r=>{
       const selected=members.map(m=>answers.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice);
       return selected[0]!==selected[1];
     })?.task_id??null,
   },
   remaining:choiceTasks.length-rounds.length,model:shared&&complete.length>=3?{
     sampleSize:complete.length,
     dimensions:['Budget','Langer blijven','Minder rijden','Natuur','Comfort','Ontmoetingen'],
     weights:shared.means.map((v,i)=>({label:['Budget','Langer blijven','Minder rijden','Natuur','Comfort','Ontmoetingen'][i],value:Math.round(v*100)/100})),
     label:'Verkennende statistische schatting, geen gevalideerd persoonlijk profiel of betrouwbaarheidspercentage.',
   }:null,
   modelStatus:complete.length<3?'Beantwoord samen minimaal drie vergelijkingen voor het eerste voorlopige model.':'Dit is een experimentele, sterk geregulariseerde Bayesian/MAP benadering. Meer verschillende keuzes zijn nodig voor stabiele uitspraken.',
 };
}
async function ensureWorkspaceAndRound(pairId:string) {
 return transaction(async tx=>{
   await tx('SELECT pg_advisory_xact_lock(hashtext($1))',['reiskantoor:'+pairId]);
   await tx('INSERT INTO trip_workspaces(pair_id,plan) VALUES($1,$2::jsonb) ON CONFLICT DO NOTHING',[pairId,JSON.stringify(starterPlan)]);
   const rounds=await tx<RoundRow>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal',[pairId]);
   const members=await tx<Member>('SELECT user_id FROM memberships WHERE pair_id=$1 ORDER BY slot',[pairId]);
   if(!rounds.length) {
     await tx('INSERT INTO trip_choice_rounds(pair_id,ordinal,task_id) VALUES($1,0,$2)',[pairId,choiceTasks[0].id]);
   } else if(members.length===2&&rounds.length<choiceTasks.length) {
     const all=await tx<AnswerRow>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1',[pairId]);
     const last=rounds.at(-1)!;
     if(members.every(m=>all.some(a=>a.ordinal===last.ordinal&&a.user_id===m.user_id))) {
       const complete=rounds.filter(r=>members.every(m=>all.some(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)));
       const next=nextChoiceTask(complete.map(r=>({taskId:r.task_id,choices:members.map(m=>all.find(a=>a.ordinal===r.ordinal&&a.user_id===m.user_id)!.choice)})));
       if(next)await tx('INSERT INTO trip_choice_rounds(pair_id,ordinal,task_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[pairId,last.ordinal+1,next.id]);
     }
   }
 });
}
export async function GET(){
 const user=await currentUser();if(!user)return json({error:'Log in om het Reiskantoor te openen.'},401);
 await ensureWorkspaceAndRound(user.pair_id);
 return json(await getState(user.pair_id,user.id));
}
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin||!URL.canParse(origin)||new URL(origin).host!==req.headers.get('host'))return json({error:'Deze aanvraag komt niet uit de app.'},403);
 const user=await currentUser();if(!user)return json({error:'Log in om jullie reisplan te bewerken.'},401);
 try{
   const raw=await req.text();if(raw.length>24000)return json({error:'De aanvraag is te groot.'},413);
   const input=z.record(z.string(),z.unknown()).parse(JSON.parse(raw));
   const action=z.enum(['save-plan','answer']).parse(input.action);
   if(action==='save-plan'){
     const plan=planSchema.parse(input.plan) as TripPlan;
     const invalid=validatePlan(plan);
     if(invalid.length)return json({error:invalid.join(' ')},400);
     const revision=z.number().int().min(0).parse(input.revision);
     const edited=await query<PlanRow>('UPDATE trip_workspaces SET plan=$1::jsonb,revision=revision+1,updated_at=now() WHERE pair_id=$2 AND revision=$3 RETURNING plan,revision',[JSON.stringify(plan),user.pair_id,revision]);
     if(!edited.length)return json({error:'Jullie reisplan is op een ander toestel veranderd. Vernieuw om die aanpassingen te zien.'},409);
   } else {
     const ordinal=z.number().int().min(0).max(100).parse(input.ordinal);
     const choice=z.number().int().min(0).max(1).parse(input.choice);
     await transaction(async tx=>{
       await tx('SELECT pg_advisory_xact_lock(hashtext($1))',['reiskantoor:'+user.pair_id]);
       const [last]=await tx<RoundRow>('SELECT ordinal,task_id FROM trip_choice_rounds WHERE pair_id=$1 ORDER BY ordinal DESC LIMIT 1',[user.pair_id]);
       if(!last||last.ordinal!==ordinal)throw Error('ROUND_STALE');
       const existing=await tx<AnswerRow>('SELECT ordinal,user_id,choice FROM trip_choice_answers WHERE pair_id=$1 AND ordinal=$2 AND user_id=$3',[user.pair_id,ordinal,user.id]);
       if(!existing.length)await tx('INSERT INTO trip_choice_answers(pair_id,ordinal,user_id,choice) VALUES($1,$2,$3,$4)',[user.pair_id,ordinal,user.id,choice]);
     });
   }
   await ensureWorkspaceAndRound(user.pair_id);
   return json({ok:true,...await getState(user.pair_id,user.id)});
 }catch(error){
   if(error instanceof SyntaxError||error instanceof z.ZodError)return json({error:'Controleer de ingevulde reisgegevens.'},400);
   if(error instanceof Error&&error.message==='ROUND_STALE')return json({error:'Deze vraag is al opgevolgd. Open het Reiskantoor opnieuw.'},409);
   console.error('Reiskantoor request failed',error instanceof Error?error.message:'unknown');
   return json({error:'Opslaan lukte niet. Probeer opnieuw.'},500);
 }
}
