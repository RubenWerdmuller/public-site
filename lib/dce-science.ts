import {featureKeys,learnPreferences,predictChoiceProbability,
 type ChoiceAnswer,type Posterior,type FeatureKey} from './reiskantoor';
import {scientificChoiceTasks,studyTaskById,studyQuality,DCE_DESIGN_VERSION,
 type StudyTask} from './dce-design';
export type ArchiveSignal={key:FeatureKey;unresolved:number;observed:number};
export type DceEvidence={
 version:string;answered:number;estimation:number;reserved:number;total:number;
 coverage:{key:FeatureKey;label:string;count:number}[];design:{
 fullRank:boolean;nonDominated:boolean;holdout:number;count:number};
 phase:'not-started'|'collecting'|'evaluation-ready'|'finished';
};
export type DceValidation={
 count:number;heldOut:number;brier:number|null;chanceBrier:number;
 logLoss:number|null;chanceLogLoss:number;betterThanChance:boolean|null;
 label:string;
};
export type RankDetail={key:FeatureKey;label:string;estimate:number;sd:number;
 lower:number;upper:number;sign:'positive'|'negative'|'uncertain'};
const featureLabels:Record<FeatureKey,string>={
 budget:'Lagere kosten',dwell:'Langer ergens blijven',drive:'Minder rijuren',
 nature:'Meer natuur',comfort:'Meer comfort',community:'Meer ontmoetingen',
};
export function studyAnswers(answers:ChoiceAnswer[]):ChoiceAnswer[]{
 return answers.filter(a=>studyTaskById(a.taskId)?.studyRole==='estimate');
}
export function studyModel(answers:ChoiceAnswer[]):Posterior{return learnPreferences(studyAnswers(answers));}
export function studyRanking(answers:ChoiceAnswer[]):RankDetail[]{
 const filtered=studyAnswers(answers),model=studyModel(filtered);
 if(filtered.length<5)return [];
 return featureKeys.map((key,i)=>{
  const estimate=model.means[i],sd=model.uncertainty[i];
  const margin=1.645*sd;
  return {key,label:featureLabels[key],estimate,sd,lower:estimate-margin,upper:estimate+margin,
   sign:estimate-margin>0?'positive' as const:estimate+margin<0?'negative' as const:'uncertain' as const};
 }).sort((a,b)=>b.estimate-a.estimate);
}
export function studyEvidence(answers:ChoiceAnswer[]):DceEvidence{
 const relevant=answers.filter(a=>studyTaskById(a.taskId));
 const estimation=studyAnswers(relevant);
 const completeDesign=studyQuality();
 const coverage=featureKeys.map(key=>({
  key,label:featureLabels[key],
  count:estimation.filter(a=>studyTaskById(a.taskId)!.a[key]!==studyTaskById(a.taskId)!.b[key]).length,
 }));
 return {version:DCE_DESIGN_VERSION,answered:relevant.length,estimation:estimation.length,
  reserved:relevant.length-estimation.length,total:scientificChoiceTasks.length,
  coverage,design:{fullRank:completeDesign.fullRank,nonDominated:completeDesign.dominated===0,
   holdout:completeDesign.holdout,count:completeDesign.count},
  phase:relevant.length===0?'not-started':relevant.length===scientificChoiceTasks.length?'finished':
   relevant.filter(a=>studyTaskById(a.taskId)?.studyRole==='holdout').length>=2?'evaluation-ready':'collecting'};
}
const clamp=(value:number)=>Math.max(.00001,Math.min(.99999,value));
export function studyValidation(answers:ChoiceAnswer[]):DceValidation{
 const training=studyAnswers(answers);
 const test=answers.filter(a=>studyTaskById(a.taskId)?.studyRole==='holdout');
 const base={count:training.length,heldOut:test.length,brier:null,logLoss:null,
  chanceBrier:.25,chanceLogLoss:Math.log(2),betterThanChance:null,
  label:'Nog onvoldoende vooraf apart gehouden controlevragen om de voorspelling onafhankelijk van het fitten te toetsen.'};
 if(training.length<6||!test.length)return base;
 const posterior=studyModel(training);
 let brier=0,logLoss=0;
 for(const row of test){
  const task=studyTaskById(row.taskId)!;
  const p=clamp(predictChoiceProbability(posterior,task));
  const target=row.choice===0?1:0;
  brier+=(p-target)**2;
  logLoss-=target*Math.log(p)+(1-target)*Math.log(1-p);
 }
 brier/=test.length;logLoss/=test.length;
 return {...base,brier,logLoss,betterThanChance:brier<.25,
  label:test.length<3?'Eerste voorzichtige controlemoment; nog te weinig onafhankelijke testvragen.':
   brier<.25?'De apart gehouden keuzes worden beter dan een 50/50-gok voorspeld; nog geen externe validatie.':
   'De apart gehouden keuzes worden nog niet beter dan toeval voorspeld.'};
}
/** Posterior variance accounts for uncertainty without reusing held-out answers in the fit. */
function selectionScore(task:StudyTask,people:Posterior[],archive:ArchiveSignal[]):number{
 const v=[(task.b.budget-task.a.budget)/250,(task.a.dwell-task.b.dwell)/4,
  (task.b.drive-task.a.drive)/6,(task.a.nature-task.b.nature)/4,
  (task.a.comfort-task.b.comfort)/4,(task.a.community-task.b.community)/4];
 const info=people.reduce((sum,model)=>{
  const eta=v.reduce((acc,x,i)=>acc+x*model.means[i],0);
  const p=1/(1+Math.exp(-eta));
  const vCov=v.reduce((acc,x,i)=>acc+x*v.reduce((z,y,j)=>z+y*model.covariance[i][j],0),0);
  return sum+Math.log1p(Math.max(0,vCov)*p*(1-p));
 },0);
 // Legacy reports determine where to explore; never count as actual conjoint observations.
 const attention=archive.reduce((sum,s)=>{
  const index=featureKeys.indexOf(s.key);
  return sum+(v[index]!==0?Math.min(.06,s.unresolved*.01+.01/(1+s.observed)):0);
 },0);
 return info+Math.min(.18,attention);
}
export function nextStudyTask(completed:{taskId:string;choices:(0|1)[]}[],archive:ArchiveSignal[]=[]):StudyTask|null{
 const seen=new Set(completed.map(x=>x.taskId));
 const available=scientificChoiceTasks.filter(task=>!seen.has(task.id));
 if(!available.length)return null;
 const estimates=completed.filter(row=>studyTaskById(row.taskId)?.studyRole==='estimate');
 const tests=completed.filter(row=>studyTaskById(row.taskId)?.studyRole==='holdout');
 const holdouts=scientificChoiceTasks.filter(q=>q.studyRole==='holdout'&&!seen.has(q.id));
 const training=available.filter(task=>task.studyRole==='estimate');
 // Precommit to exactly one held-out task after each block of seven estimation
 // choices, regardless of what the answers look like.
 if(holdouts.length&&estimates.length>=7*(tests.length+1))return holdouts[0];
 if(!training.length)return holdouts[0]??null;
 const people=[0,1].map(i=>studyModel(estimates.filter(row=>row.choices[i]!==undefined).map(row=>({
  taskId:row.taskId,choice:row.choices[i],
 }))));
 return training.map((task,i)=>({task,score:selectionScore(task,people,archive)-i*1e-9}))
  .sort((a,b)=>b.score-a.score)[0].task;
}
export function archiveAttentionFromEvidence(rows:{
 question_id:string;user_id:string;choice:number;
 snapshot:{options:{attributes:Record<string,number|string>}[]}}[],userIds:string[]):ArchiveSignal[]{
 const keys:FeatureKey[]=[...featureKeys];
 const lookup:Record<string,FeatureKey>={budget:'budget',cost:'budget',price:'budget',
  days:'dwell',months:'dwell',pace:'dwell',travelHours:'drive',driving:'drive',
  nature:'nature',comfort:'comfort',social:'community',people:'community',community:'community'};
 const counted=new Map<FeatureKey,{observed:number;unresolved:number}>();
 for(const k of keys)counted.set(k,{observed:0,unresolved:0});
 const byQuestion=new Map<string,typeof rows>();
 for(const row of rows)byQuestion.set(row.question_id,[...(byQuestion.get(row.question_id)??[]),row]);
 for(const pair of byQuestion.values()){
  if(userIds.length!==2||!userIds.every(id=>pair.some(row=>row.user_id===id)))continue;
  const a=pair.find(row=>row.user_id===userIds[0])!;
  const b=pair.find(row=>row.user_id===userIds[1])!;
  const opt=a.snapshot.options;
  if(!opt||opt.length!==2)continue;
  for(const [old,key] of Object.entries(lookup)){
   if(typeof opt[0].attributes[old]!=='number'||typeof opt[1].attributes[old]!=='number'||
    opt[0].attributes[old]===opt[1].attributes[old])continue;
   const value=counted.get(key)!;
   value.observed++;
   if(a.choice!==b.choice)value.unresolved++;
  }
 }
 return keys.map(key=>({key,...counted.get(key)!}));
}
export function legacyReportBrief(report:{
 dna?:string;discovery?:string;fantasy?:string;complete?:number;same?:number;match?:number|null},
 week:string|null){
 return {source:'Bestaand reisrapport (oude dilemma’s)',week,hasData:Boolean(report.complete),
  summary:report.dna??'Nog geen gezamenlijke rapportconclusie.',
  discovery:report.discovery??'Meer gezamenlijke keuzes leveren interessantere observaties op.',
  vignette:report.fantasy??null,completed:report.complete??0,matched:report.same??0,
  agreement:typeof report.match==='number'?report.match:null,
  methodologicalCaveat:'Speelse samenvatting van eerdere vragen; niet gebruikt als bewijs in de nieuwe conjoint-schatting.'};
}
