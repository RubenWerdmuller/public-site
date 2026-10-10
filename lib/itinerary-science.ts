import {
 stageTasks,choiceTasks,nextChoiceTask,type Stage,type TripPlan,type Posterior,
 type CompletedStage,type ChoiceTask,type StageQuestion,type StageValue,
} from './reiskantoor';

export type SubStop={id:string;title:string;days:number;purpose:string;status:'placeholder'};
export type LegSchedule={
 stageId:string;stageName:string;days:number;requestedStops:number|null;
 preferredStopDays:number|null;transitAllowanceDays:number|null;
 unallocatedDays:number|null;stops:SubStop[];openQuestions:string[];
};
export type ScienceAlternative={
 id:string;title:string;plan:TripPlan;reason:string;tradeoffs:string[];
 score:number;basedOn:'stated_preferences';verifiedDestination:false;
};
export type ScienceTravel={
 plan:TripPlan|null;completed:number;disagreements:string[];routeIdeas:string[];
 confidenceLabel:string;warnings:string[];conflicts:string[];
 legs:LegSchedule[];ideas:string[];alternatives:ScienceAlternative[];
 evidence:{asked:number;full:number;required:number;unanswered:string[];individualAnswers:number};
 method:{approach:string;limitations:string[];futureAiInput:{kind:string;status:'not_connected'}[]};
};
const numeric=(rows:CompletedStage[],taskId:string,key:Exclude<keyof StageValue,'route'|'stayFocus'>):number[]=>{
 const row=rows.find(r=>r.taskId===taskId);
 const task=stageTasks.find(t=>t.id===taskId);
 if(!row||!task)return[];
 return row.choices.flatMap(c=>{const value=task[c===0?'a':'b'].value[key];return typeof value==='number'?[value]:[]});
};
const numberMean=(arr:number[],fallback:number)=>arr.length?Math.round(arr.reduce((a,b)=>a+b,0)/arr.length):fallback;
const bounded=(v:number,min:number,max:number)=>Math.max(min,Math.min(max,v));
const makeStage=(id:string,name:string,kind:Stage['kind'],weeks:number,region='Bestemming nog te onderzoeken'):Stage=>({
 id,name,region,kind,minWeeks:Math.max(1,weeks-2),idealWeeks:weeks,maxWeeks:Math.min(52,weeks+2),
 locked:false,weeklyBudget:0,travelHours:0,notes:'Modelscenario uit gezamenlijke antwoorden. Geen geverifieerde bestemming, prijs of rijtijd.',
});
type Settings={total:number;out:number;back:number;bases:number;extras:number;minStay:number;buffer:number;
 desiredOut:number[];desiredBack:number[];desiredStay:number[];desiredBuffer:number[];
 minOutboundWeeks:number;minReturnWeeks:number;
 focus:'nature'|'learning'|null;roadDays:number|null;month:number;monthlyBudget:number};
function desired(rows:CompletedStage[],totalOverride?:number):Settings{
 const totalPreferences=numeric(rows,'stage-duration-v1','totalWeeks');
 const out=numeric(rows,'stage-outbound-v1','outboundWeeks');
 const back=numeric(rows,'stage-return-v1','returnWeeks');
 const stays=numeric(rows,'stage-bases-v1','stayCount');
 const extra=numeric(rows,'stage-extra-v1','otherStops');
 const minStay=numeric(rows,'stage-stay-min-v2','minStayWeeks');
 const buffers=numeric(rows,'stage-buffer-v2','bufferWeeks');
 const stopDays=numeric(rows,'stage-stop-days-v2','stopDays');
 const outStops=numeric(rows,'stage-outbound-stops-v2','outboundStops');
 const returnStops=numeric(rows,'stage-return-stops-v2','returnStops');
 const minLegWeeks=(stops:number[])=>stops.length&&stopDays.length?
    Math.ceil((numberMean(stops,1)*numberMean(stopDays,2)+numberMean(stops,1)+1)/7):1;
 const focusRow=rows.find(r=>r.taskId==='stage-stay-focus-v2');
 const focusTask=stageTasks.find(t=>t.id==='stage-stay-focus-v2');
 const focus=focusRow&&focusTask&&focusRow.choices[0]===focusRow.choices[1]?
 focusTask[focusRow.choices[0]===0?'a':'b'].value.stayFocus??null:null;
 return {
  total:totalOverride??numberMean(totalPreferences,16),
  out:numberMean(out,3),back:numberMean(back,3),
  bases:numberMean(stays,1),extras:numberMean(extra,0),
  minStay:numberMean(minStay,2),buffer:numberMean(buffers,0),
  desiredOut:out,desiredBack:back,desiredStay:minStay,desiredBuffer:buffers,
  minOutboundWeeks:minLegWeeks(outStops),minReturnWeeks:minLegWeeks(returnStops),
  focus,roadDays:numeric(rows,'stage-driving-v2','roadDaysPerWeek').length?numberMean(numeric(rows,'stage-driving-v2','roadDaysPerWeek'),1):null,
  month:(()=>{const months=numeric(rows,'stage-departure-v2','departureMonth');return months.length===2&&months[0]===months[1]?months[0]:0;})(),
  monthlyBudget:numberMean(numeric(rows,'stage-budget-v2','budgetMonthly'),0),
 };
}
type Solution={weeks:{out:number;back:number;stay:number[];extras:number;buffer:number};score:number;maxRegret:number};
function solve(settings:Settings,models:Posterior[]):Solution|null{
 const s=settings,T=s.total;
 if(!Number.isInteger(T)||T<2||T>52||s.bases<1||s.bases>2)return null;
 const count=s.bases;
 let best:Solution|null=null;
 const maxTravel=Math.min(12,T-1);
 const unique=[
  ...s.desiredOut.map((v,i)=>({kind:'out',i,value:v})),
  ...s.desiredBack.map((v,i)=>({kind:'back',i,value:v})),
  ...s.desiredStay.map((v,i)=>({kind:'stay',i,value:v})),
  ...s.desiredBuffer.map((v,i)=>({kind:'buffer',i,value:v})),
 ];
 for(let out=s.minOutboundWeeks;out<=maxTravel;out++)for(let back=s.minReturnWeeks;back<=maxTravel;back++){ 
  // Optional short chapters and blank time count against the same total.
  for(let extra=0;extra<=Math.min(s.extras,2);extra++)for(let buffer=0;buffer<=Math.min(s.buffer,2);buffer++){
   const core=T-out-back-extra-buffer;
   if(core<s.minStay*count)continue;
   // each long base gets >= the stated joint minimum (never silently violated)
   for(let first=s.minStay;first<=core-s.minStay*(count-1);first++){
    const stay=count===1?[core]:[first,core-first];
    const stayMin=Math.min(...stay);
    const preferencePenalty=(out-s.out)**2*.55+(back-s.back)**2*.55+
     (extra-s.extras)**2*.7+(buffer-s.buffer)**2*.8+
     stay.reduce((sum,w)=>sum+(w-core/count)**2*.06,0);
    const individual=unique.filter(v=>v.i<2).map(v=>{
     if(v.kind==='out')return (out-v.value)**2;
     if(v.kind==='back')return (back-v.value)**2;
     if(v.kind==='stay')return Math.max(0,v.value-stayMin)**2*2;
     return (buffer-v.value)**2*.6;
    });
    const maxRegret=individual.length?Math.max(...individual):0;
    const meanRegret=individual.length?individual.reduce((a,b)=>a+b,0)/individual.length:0;
    // Bayesian DCE effects only influence soft tradeoffs when enough choices exist.
    // Signs and scales are bounded; these are not calibrated utility scores.
    const dce=models.filter(m=>m.count>=4);
    const drivePref=dce.length?dce.reduce((sum,m)=>sum+bounded(m.means[2],-.5,.5),0)/dce.length:0;
    const stayPref=dce.length?dce.reduce((sum,m)=>sum+bounded(m.means[1],-.5,.5),0)/dce.length:0;
    const learned=-drivePref*(out+back)*.18-stayPref*stayMin*.18;
    const score=preferencePenalty+meanRegret*.33+maxRegret*.22+learned;
    if(!best||score<best.score-1e-9)best={weeks:{out,back,stay,extras:extra,buffer},score,maxRegret};
   }
  }
 }
 return best;
}
function subStops(stage:Stage,count:number|null,daysPerStop:number|null,roadDays:number|null):LegSchedule{
 const total=stage.idealWeeks*7;
 const openQuestions:string[]=[];
 if(count===null)openQuestions.push('Hoeveel tussenstops willen jullie in deze reisfase?');
 if(daysPerStop===null)openQuestions.push('Hoeveel dagen willen jullie per tussenstop blijven?');
 if(roadDays===null)openQuestions.push('Hoeveel rijdagen voelen prettig?');
 const moves=count!==null?count+1:0;
 const transit=count!==null?moves: null;
 // One whole calendar day per move is a modelling allowance, NOT real driving time.
 const used=count!==null&&daysPerStop!==null?count*daysPerStop+moves:null;
 const remaining=used===null?null:total-used;
 const stops=count===null||daysPerStop===null?[]:Array.from({length:count},(_,i)=>({
  id:stage.id+'-stop-'+(i+1),title:'Tussenstop '+(i+1),days:daysPerStop,
  purpose:'Tijd om te landen; bestemming en werkelijke reistijd moeten later worden vastgesteld.',
  status:'placeholder' as const,
 }));
 return {stageId:stage.id,stageName:stage.name,days:total,requestedStops:count,
  preferredStopDays:daysPerStop,transitAllowanceDays:transit,unallocatedDays:remaining,
  stops,openQuestions};
}
function ideas(settings:Settings):string[]{
 const base=settings.focus==='nature'?[
  'Lang verblijf: rustige natuurplek met wandelroutes en ruimte om te vertragen.',
  'Korte verplaatsingen: liever twee mooie stops dan elke dag verkassen.',
 ]:settings.focus==='learning'?[
  'Lang verblijf: een makersplek of workshopgemeenschap waar jullie iets leren.',
  'Plan voldoende aaneengesloten weken om daadwerkelijk mee te doen.',
 ]:[
  'Vergelijk een rustige natuur-thuisbasis met een verblijf gericht op workshops en ontmoetingen.',
 ];
 return [...base,'Check later per mogelijke regio: seizoen, bereikbaarheid per auto, verblijfsduur en beschikbaarheid.'];
}
function routeIdeas(rows:CompletedStage[]):string[]{
 const route=rows.find(r=>r.taskId==='stage-direction-v1');
 if(!route)return[];
 if(route.choices[0]!==route.choices[1])return[
  'Westelijke richting (Frankrijk → Spanje), ter onderzoek',
  'Zuidoostelijke richting (Alpen → Italië), ter onderzoek',
 ];
 return [route.choices[0]===0?'Westelijke richting (Frankrijk → Spanje), ter onderzoek':'Zuidoostelijke richting (Alpen → Italië), ter onderzoek'];
}
function resultFor(rows:CompletedStage[],setting:Settings,sol:Solution):{plan:TripPlan;legs:LegSchedule[];warnings:string[]}{
 const w=sol.weeks;
 const stages:Stage[]=[makeStage('answer-out','Heenreis','outbound',w.out,'Reiscorridor nog te verifiëren')];
 if(w.buffer>0)stages.push(makeStage('answer-flex','Vrije speelruimte','other',w.buffer,'Nog open · bewust niet ingepland'));
 stages.push(makeStage('answer-stay-0',setting.bases===1?'Lang verblijf':'Eerste lange verblijf','stay',w.stay[0]));
 if(w.extras>0)for(let i=0;i<w.extras;i++)stages.push(makeStage('answer-extra-'+i,'Extra tussenhoofdstuk '+(i+1),'other',1,'Nog te ontdekken'));
 if(setting.bases===2)stages.push(makeStage('answer-stay-1','Tweede lange verblijf','stay',w.stay[1]));
 stages.push(makeStage('answer-return','Terugreis','return',w.back,'Terug naar huis'));
 // This is a *stated spending envelope*, never a prediction of market prices.
 const available=setting.monthlyBudget?Math.round(setting.monthlyBudget*setting.total*7/30.44):0;
 const plan:TripPlan={weeks:setting.total,maxBudget:available,departureMonth:setting.month,stages};
 const outbound=numeric(rows,'stage-outbound-stops-v2','outboundStops');
 const returning=numeric(rows,'stage-return-stops-v2','returnStops');
 const stopDays=numeric(rows,'stage-stop-days-v2','stopDays');
 const countOut=outbound.length?numberMean(outbound,2):null;
 const countBack=returning.length?numberMean(returning,2):null;
 const days=stopDays.length?numberMean(stopDays,3):null;
 const legs=[subStops(stages[0],countOut,days,setting.roadDays),
  subStops(stages.at(-1)!,countBack,days,setting.roadDays)];
 const warnings:string[]=[];
 if(setting.monthlyBudget>0)warnings.push('Maximale uitgavenruimte is afgeleid van het gekozen maandbudget. Er zijn nog geen actuele kosten per bestemming geverifieerd.');
 if(setting.month===0)warnings.push('Vertrekperiode is nog niet door beiden gekozen of verschilt: klimaat en seizoen zijn niet beoordeeld.');
 for(const leg of legs){
  if(leg.unallocatedDays!==null&&leg.unallocatedDays<0)
   warnings.push(leg.stageName+': '+Math.abs(leg.unallocatedDays)+' planningsdagen tekort voor stops en minimumverplaatsingen. Stopduur/-aantal of reisfase moet worden aangepast.');
  if(leg.transitAllowanceDays!==null)
   warnings.push(leg.stageName+': '+leg.transitAllowanceDays+' dag(en) zijn alleen gereserveerde planningsdagen voor verplaatsingen, niet geverifieerde rijtijd.');
 }
 return {plan,legs,warnings};
}
export function inferScientificItinerary(completed:CompletedStage[],models:Posterior[]=[]):ScienceTravel{
 const rows=completed.filter(r=>stageTasks.some(t=>t.id===r.taskId)&&r.choices.length===2);
 const required=['stage-duration-v1','stage-outbound-v1','stage-return-v1','stage-bases-v1'];
 const missing=required.filter(id=>!rows.some(r=>r.taskId===id));
 const disagreements=rows.filter(r=>r.choices[0]!==r.choices[1]).map(r=>stageTasks.find(t=>t.id===r.taskId)!.question);
 const route=routeIdeas(rows);
 const base={completed:rows.length,disagreements,routeIdeas:route,
  evidence:{asked:stageTasks.length,full:rows.length,required:required.length,unanswered:missing,individualAnswers:completed.length},
  method:{approach:'Joint constrained integer-week optimisation + Bayesian MAP-Laplace choice preferences (soft weights only)',
   limitations:['De weekkeuzes zijn voorkeuren, geen harde toezeggingen.','Afgeleide middenwaarden blijven voorlopige compromissen.','Geen coördinaten, wegtrajecten, werkelijke reistijden, aanbiedingen of klimaatdata.',
   'Niet experimenteel gerandomiseerd of statistisch gekalibreerd. De getoonde scenario’s zijn planningsmogelijkheden, geen wetenschappelijk bewezen optimale reis.'],
   futureAiInput:[{kind:'geverifieerde bestemmingen',status:'not_connected' as const},{kind:'rijroutes en afstanden',status:'not_connected' as const},
    {kind:'seizoenen en omstandigheden',status:'not_connected' as const},{kind:'actuele verblijfsprijzen',status:'not_connected' as const},
    {kind:'beschikbaarheid en regels',status:'not_connected' as const}]},
 };
 if(missing.length)return {...base,plan:null,warnings:[],conflicts:[],legs:[],ideas:[],alternatives:[],
  confidenceLabel:'Nog '+missing.length+' gezamenlijke kernvragen te gaan vóór de etappeverdeling. Er worden geen verblijven verzonnen.'};
 const setting=desired(rows);
 const sol=solve(setting,models);
 if(!sol)return {...base,plan:null,legs:[],alternatives:[],ideas:ideas(setting),
  warnings:[],conflicts:['Met '+setting.total+' weken passen de minimale lange verblijven en de tijd voor gewenste tussenstops (inclusief minstens één planningsdag per verplaatsing) niet samen. Vergelijk een langere reis, minder stops of kortere verblijven.'],
  confidenceLabel:'De antwoorden spreken elkaar tegen. Daarom toont de planner geen schijnbaar haalbaar reisplan.'};
 const primary=resultFor(rows,setting,sol);
 const conflicts=[...primary.warnings.filter(w=>w.includes('tekort'))];
 if(sol.weeks.out!==setting.out||sol.weeks.back!==setting.back)
  conflicts.push('Reistijd heen/terug is verschoven om voldoende ruimte voor lange verblijven te houden.');
 if(sol.weeks.extras!==setting.extras)conflicts.push('Niet alle gewenste tussenhoofdstukken passen binnen de totale duur.');
 if(sol.weeks.buffer!==setting.buffer)conflicts.push('De gewenste vrije buffer past niet volledig binnen de totale duur.');
 const candidates:{id:string;title:string;weeks:number;bases?:number}[]=[
  {id:'short',title:'Korter en compacter',weeks:Math.min(...numeric(rows,'stage-duration-v1','totalWeeks'))},
  {id:'shared',title:'Gezamenlijk compromis',weeks:setting.total},
  {id:'long',title:'Ruimer en langzamer',weeks:Math.max(...numeric(rows,'stage-duration-v1','totalWeeks'))},
 ];
 const basePreferences=numeric(rows,'stage-bases-v1','stayCount');
 if(basePreferences.length===2&&basePreferences[0]!==basePreferences[1]){
  for(const base of [...new Set(basePreferences)])candidates.push({
   id:'bases-'+base,title:base===1?'Eén lange thuisbasis':'Twee verschillende thuisbasissen',
   weeks:setting.total,bases:base,
  });
 }
 const seen=new Set<string>();
 const alternatives:ScienceAlternative[]=candidates.flatMap(candidate=>{
  const key=candidate.weeks+':'+(candidate.bases??setting.bases);
  if(seen.has(key))return[];seen.add(key);
  const specific=desired(rows,candidate.weeks);
  if(candidate.bases)specific.bases=candidate.bases;
  const option=solve(specific,models);
  if(!option)return[];
  const inferred=resultFor(rows,specific,option);
  const tradeoffs:string[]=[];
  if(option.weeks.out!==setting.out)tradeoffs.push('Heenreis '+(option.weeks.out>setting.out?'langer':'korter')+' dan de gezamenlijke wens.');
  if(option.weeks.back!==setting.back)tradeoffs.push('Terugreis '+(option.weeks.back>setting.back?'langer':'korter')+' dan de gezamenlijke wens.');
  if(specific.bases!==setting.bases)tradeoffs.push('Ander aantal lange verblijven, omdat jullie daar afzonderlijk iets anders kozen.');
  if(option.weeks.extras<setting.extras)tradeoffs.push('Minder extra tussenhoofdstukken om de lange verblijven te beschermen.');
  if(inferred.warnings.some(w=>w.includes('tekort')))tradeoffs.push('Reisdagen en tussenstops vragen nog aanpassing.');
  return [{id:candidate.id,title:candidate.title,plan:inferred.plan,reason:'Alle fases tellen op tot '+candidate.weeks+' weken; de minimale lange verblijven worden beschermd.',
   score:option.score,tradeoffs,basedOn:'stated_preferences' as const,verifiedDestination:false as const}];
 });
 return {...base,plan:primary.plan,legs:primary.legs,ideas:ideas(setting),alternatives,
  warnings:primary.warnings,conflicts,
  confidenceLabel:'Voorlopig, gekoppeld reisontwerp uit '+rows.length+' gezamenlijke etappe-antwoorden. Afstanden, echte bestemmingen en actuele prijzen ontbreken.'};
}
export function nextScientificQuestion(completed:CompletedStage[]):StageQuestion|ChoiceTask|null{
 const asked=new Set(completed.map(r=>r.taskId));
 const core=['stage-duration-v1','stage-outbound-v1','stage-return-v1','stage-bases-v1'];
 for(const id of core)if(!asked.has(id))return stageTasks.find(s=>s.id===id)!;
 const outstanding=stageTasks.filter(t=>!asked.has(t.id));
 if(!outstanding.length){
  const history=completed.filter(r=>choiceTasks.some(t=>t.id===r.taskId));
  const done=new Set(history.map(r=>r.taskId)),available=choiceTasks.filter(t=>!done.has(t.id));
  if(!available.length)return null;
  // Original Bayesian expected-information heuristic is preserved for complete DCE rounds.
  return nextChoiceTask(history);
 }
 const rows=completed.filter(r=>stageTasks.some(q=>q.id===r.taskId));
 const keys:Record<string,number>={
  'stage-stay-min-v2':10,'stage-outbound-stops-v2':8,'stage-return-stops-v2':8,
  'stage-stop-days-v2':7,'stage-buffer-v2':5,'stage-driving-v2':5,
  'stage-extra-v1':5,'stage-stay-focus-v2':3,'stage-direction-v1':3,
  'stage-departure-v2':2,'stage-budget-v2':2,
 };
 const disagreements=rows.filter(r=>r.choices[0]!==r.choices[1]).length;
 return outstanding.map((task,i)=>{
  let score=keys[task.id]??1;
  if(disagreements>0&&['stage-buffer-v2','stage-stay-min-v2'].includes(task.id))score+=disagreements*.8;
  if(task.id==='stage-stop-days-v2'&&rows.some(r=>r.taskId==='stage-outbound-stops-v2'))score+=3;
  // One-step lookahead: simulate both users choosing A/B, and measure how much
  // this answer could affect the actual feasible trip. This is a deterministic
  // scenario-sensitivity proxy, NOT formal Bayesian expected information gain.
  const scenarios=([ [0,0],[0,1],[1,0],[1,1] ] as (0|1)[][]).map(choices=>{
   const settings=desired([...rows,{taskId:task.id,choices}]);
   const solved=solve(settings,[]);
   if(!solved)return null;
   return [solved.weeks.out,solved.weeks.back,solved.weeks.stay.length*2,
     solved.weeks.extras,solved.weeks.buffer,
     settings.minStay,settings.month/4,settings.monthlyBudget/1000,
     settings.minOutboundWeeks,settings.minReturnWeeks];
  });
  let impact=0;
  for(let a=0;a<scenarios.length;a++)for(let b=a+1;b<scenarios.length;b++){
   const A=scenarios[a],B=scenarios[b];
   if(!A||!B){if(Boolean(A)!==Boolean(B))impact+=12;continue;}
   impact+=A.reduce((total,value,k)=>total+(value-B[k])**2,0);
  }
  if(task.id==='stage-stay-focus-v2')impact+=12;
  score+=Math.min(3,Math.sqrt(impact/6)*.8);
  return {task,score:score-i*.001};
 }).sort((a,b)=>b.score-a.score)[0].task;
}
