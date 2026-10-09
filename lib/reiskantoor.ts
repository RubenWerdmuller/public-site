export type StageKind = 'outbound' | 'stay' | 'return' | 'other';
export type Stage = {
  id: string; name: string; region: string; kind: StageKind;
  minWeeks: number; idealWeeks: number; maxWeeks: number;
  locked: boolean; weeklyBudget: number; travelHours: number; notes: string;
};
export type TripPlan = { weeks: number; maxBudget: number; departureMonth: number; stages: Stage[] };
export const starterPlan: TripPlan = {
  weeks: 16, maxBudget: 0, departureMonth: 0,
  stages: [
    {id:'out',name:'Heenreis',region:'Onderweg',kind:'outbound',minWeeks:1,idealWeeks:3,maxWeeks:5,locked:false,weeklyBudget:0,travelHours:0,notes:''},
    {id:'stay',name:'Lang ergens blijven',region:'Nog te ontdekken',kind:'stay',minWeeks:3,idealWeeks:10,maxWeeks:14,locked:false,weeklyBudget:0,travelHours:0,notes:''},
    {id:'back',name:'Terugreis',region:'Onderweg',kind:'return',minWeeks:1,idealWeeks:3,maxWeeks:5,locked:false,weeklyBudget:0,travelHours:0,notes:''},
  ],
};
export function validatePlan(p:TripPlan):string[] {
  const errors:string[]=[];
  if(!Number.isInteger(p.weeks)||p.weeks<2||p.weeks>52)errors.push('Kies een reisduur van 2 tot 52 weken.');
  if(!Number.isInteger(p.maxBudget)||p.maxBudget<0||p.maxBudget>1000000)errors.push('Controleer het totale reisbudget.');
  if(!Number.isInteger(p.departureMonth)||p.departureMonth<0||p.departureMonth>12)errors.push('Controleer de vertrekmaand.');
  if(!Array.isArray(p.stages)||p.stages.length<1||p.stages.length>12)return [...errors,'Gebruik 1 tot 12 etappes.'];
  const ids=new Set<string>();
  for(const s of p.stages) {
    if(!/^[a-zA-Z0-9-]{1,70}$/.test(s.id)||ids.has(s.id))errors.push('Etappes hebben een uniek ID nodig.');
    ids.add(s.id);
    if(!s.name.trim()||s.name.length>70||s.region.length>100||s.notes.length>400)errors.push('Controleer de naam, regio en notities van je etappe.');
    if(!['outbound','stay','return','other'].includes(s.kind))errors.push('Onbekend type etappe.');
    if(![s.minWeeks,s.idealWeeks,s.maxWeeks].every(n=>Number.isInteger(n)&&n>=1&&n<=52) || s.minWeeks>s.idealWeeks||s.idealWeeks>s.maxWeeks)
      errors.push('Per etappe moet minimaal ≤ gewenst ≤ maximaal zijn (1–52 weken).');
    if(typeof s.locked!=='boolean')errors.push('Ongeldige etappevergrendeling.');
    if(!Number.isInteger(s.weeklyBudget)||s.weeklyBudget<0||s.weeklyBudget>20000)errors.push('Budget per week moet tussen 0 en 20.000 euro liggen.');
    if(!Number.isFinite(s.travelHours)||s.travelHours<0||s.travelHours>240)errors.push('Controleer het aantal reisuren.');
  }
  return [...new Set(errors)];
}
export type ChoiceProfile = { budget:number; dwell:number; drive:number; nature:number; comfort:number; community:number };
export type ChoiceTask = { id:string; question:string; a:ChoiceProfile; b:ChoiceProfile };
const p=(budget:number,dwell:number,drive:number,nature:number,comfort:number,community:number):ChoiceProfile=>({budget,dwell,drive,nature,comfort,community});
// Fixed, versioned experimental pilot tasks. These are scenarios, not real itinerary offers.
export const choiceTasks:ChoiceTask[]=[
  {id:'dce1',question:'Langer blijven of meer comfort?',a:p(300,4,3,4,2,2),b:p(450,2,3,4,5,2)},
  {id:'dce2',question:'Avontuur of minder autorijden?',a:p(320,2,8,5,2,3),b:p(400,3,2,3,4,3)},
  {id:'dce3',question:'Meer ontmoetingen of meer rust?',a:p(350,3,3,3,3,5),b:p(350,4,3,4,3,1)},
  {id:'dce4',question:'Budget sparen of langer ergens landen?',a:p(250,2,5,3,2,3),b:p(420,5,5,3,3,3)},
  {id:'dce5',question:'Natuur met weinig comfort?',a:p(300,4,3,5,1,2),b:p(420,3,3,2,5,2)},
  {id:'dce6',question:'Veel rondreizen of een lange thuisbasis?',a:p(360,1,7,5,3,4),b:p(360,5,2,3,3,2)},
  {id:'dce7',question:'De gezellige plek of de stille plek?',a:p(410,3,4,2,4,5),b:p(280,4,4,5,2,1)},
  {id:'dce8',question:'Hoeveel mag minder rijden kosten?',a:p(280,3,9,4,3,3),b:p(440,3,2,4,3,3)},
  {id:'dce9',question:'Extra tijd op één plek?',a:p(340,2,2,4,4,3),b:p(420,5,2,4,2,3)},
  {id:'dce10',question:'Een paar dagen leven tussen mensen?',a:p(290,3,5,3,2,5),b:p(430,3,3,4,4,1)},
  {id:'dce11',question:'Vrijheid of luxe?',a:p(260,5,6,5,2,1),b:p(510,2,2,2,5,4)},
  {id:'dce12',question:'Op adem komen onderweg?',a:p(370,4,2,2,4,2),b:p(270,2,7,5,2,4)},
  {id:'dce13',question:'Natuur en goedkope slaapplekken?',a:p(240,3,6,5,1,3),b:p(400,4,2,3,4,1)},
  {id:'dce14',question:'Langer weg of meer ontmoeten?',a:p(360,5,4,2,2,1),b:p(360,2,4,4,3,5)},
  {id:'dce15',question:'Meer rijden, meer natuur?',a:p(350,3,8,5,3,2),b:p(350,3,2,2,4,4)},
  {id:'dce16',question:'Eenvoudig en rustig, of luxe en levendig?',a:p(250,5,2,4,2,1),b:p(490,2,5,2,5,5)},
];
export const featureKeys=['budget','dwell','drive','nature','comfort','community'] as const;
export type FeatureKey=typeof featureKeys[number];
export type ChoiceAnswer = {taskId:string;choice:0|1};
const x=(t:ChoiceTask):number[] => [
  (t.b.budget-t.a.budget)/250, (t.a.dwell-t.b.dwell)/3,
  (t.b.drive-t.a.drive)/6, (t.a.nature-t.b.nature)/4,
  (t.a.comfort-t.b.comfort)/4, (t.a.community-t.b.community)/4,
];
const logistic=(n:number):number=>1/(1+Math.exp(-Math.max(-30,Math.min(30,n))));
function solve(a:number[][],b:number[]):number[]{
  const n=b.length;const m=a.map((row,i)=>[...row,b[i]]);
  for(let i=0;i<n;i++){
    let pivot=i;for(let j=i+1;j<n;j++)if(Math.abs(m[j][i])>Math.abs(m[pivot][i]))pivot=j;
    [m[i],m[pivot]]=[m[pivot],m[i]];const divisor=m[i][i]||1e-10;
    for(let k=i;k<=n;k++)m[i][k]/=divisor;
    for(let j=0;j<n;j++)if(j!==i){const factor=m[j][i];for(let k=i;k<=n;k++)m[j][k]-=factor*m[i][k];}
  }
  return m.map(row=>row[n]);
}
export type Posterior = {means:number[];uncertainty:number[];covariance:number[][];count:number};
export function learnPreferences(answers:ChoiceAnswer[]):Posterior{
  const n=featureKeys.length,prior=1.5;let beta=Array(n).fill(0);
  const observations=answers.map(a=>({task:choiceTasks.find(q=>q.id===a.taskId),choice:a.choice})).filter((a):a is {task:ChoiceTask;choice:0|1}=>!!a.task);
  function hessianAndGradient(values:number[]) {
    const H=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?prior:0));
    const g=values.map(v=>-prior*v);
    for(const a of observations){
      const delta=x(a.task); const pred=logistic(delta.reduce((sum,d,k)=>sum+d*values[k],0));
      const w=pred*(1-pred);
      for(let i=0;i<n;i++){g[i]+=delta[i]*((a.choice===0?1:0)-pred);for(let j=0;j<n;j++)H[i][j]+=w*delta[i]*delta[j];}
    }
    return {H,g};
  }
  for(let i=0;i<12;i++){const {H,g}=hessianAndGradient(beta);const step=solve(H,g);beta=beta.map((b,k)=>b+step[k]);if(Math.max(...step.map(Math.abs))<1e-6)break;}
  const {H}=hessianAndGradient(beta);
  const covariance=Array.from({length:n},(_,j)=>solve(H,Array.from({length:n},(_,i)=>i===j?1:0))).map((_,i,columns)=>columns.map(col=>col[i]));
  return {means:beta,uncertainty:covariance.map((row,i)=>Math.sqrt(Math.max(0,row[i]))),covariance,count:observations.length};
}
export function nextChoiceTask(completed:{taskId:string;choices:(0|1)[]}[]):ChoiceTask|null{
  const asked=new Set(completed.map(t=>t.taskId));
  const available=choiceTasks.filter(t=>!asked.has(t.id));if(!available.length)return null;
  if(!completed.length)return available[0];
  const people=[0,1].map(i=>learnPreferences(completed.filter(t=>t.choices[i]!==undefined).map(t=>({taskId:t.taskId,choice:t.choices[i]}))));
  const scored=available.map((task,i)=>{
    const delta=x(task);
    const info=people.reduce((sum,post)=>{
      const dot=delta.reduce((acc,value,k)=>acc+value*post.means[k],0);const probability=logistic(dot);
      const variance=delta.reduce((acc,d,k)=>acc+d*delta.reduce((s,v,j)=>s+v*post.covariance[k][j],0),0);
      return sum+probability*(1-probability)*Math.max(0,variance);
    },0);
    return {task,score:info-i*0.000001};
  });
  return scored.sort((a,b)=>b.score-a.score)[0].task;
}
export type Proposal = {id:string;title:string;weeks:number[];cost:number|null;warnings:string[];score:number};
export function createProposals(plan:TripPlan,shared:Posterior|null=null):Proposal[]{
  if(validatePlan(plan).length)return [];
  const lower=plan.stages.reduce((v,s)=>v+(s.locked?s.idealWeeks:s.minWeeks),0);
  const upper=plan.stages.reduce((v,s)=>v+(s.locked?s.idealWeeks:s.maxWeeks),0);
  if(plan.weeks<lower||plan.weeks>upper)return [];
  const modes=[{id:'balanced',title:'Dicht bij jullie wensen'},{id:'slow',title:'Meer tijd om te blijven'},{id:'budget',title:'Zuinigere verdeling'}];
  return modes.map(mode=>{
    type State={weeks:number[];cost:number;penalty:number};
    let states=new Map<number,State[]>([[0,[{weeks:[],cost:0,penalty:0}]]]);
    for(const stage of plan.stages){
      const next=new Map<number,State[]>();
      for(const [sum,choices] of states){
        for(const weeks of Array.from({length:stage.locked?1:stage.maxWeeks-stage.minWeeks+1},(_,i)=>stage.locked?stage.idealWeeks:stage.minWeeks+i)){
          if(sum+weeks>plan.weeks)continue;
          let target=stage.idealWeeks;
          if(mode.id==='slow')target+=(stage.kind==='stay'?1.5:-0.8);
          const cost=weeks*stage.weeklyBudget;
          // Only observed explicit cost estimates are used. Zero = unspecified.
          const learned=shared && shared.count>=3 ? Math.max(-.4,Math.min(.4,shared.means[1])) : 0;
          const preferencePenalty=-learned*weeks*(stage.kind==='stay'?0.3:0);
          const weight=mode.id==='budget'&&stage.weeklyBudget>0?Math.max(.5,stage.weeklyBudget/250):1;
          const row={weeks:[...choices[0].weeks,weeks],cost:choices[0].cost+cost,
            penalty:choices[0].penalty+Math.pow(weeks-target,2)*weight+preferencePenalty};
          // Keep a budget/diversity beam, rather than retaining only one plan per duration.
          const list=next.get(sum+weeks)??[];
          for(const state of choices){
            if(state===choices[0])continue;
            list.push({weeks:[...state.weeks,weeks],cost:state.cost+cost,penalty:state.penalty+Math.pow(weeks-target,2)*weight+preferencePenalty});
          }
          list.push(row);
          list.sort((a,b)=>{
            const budgetPenalty=(s:State)=>plan.maxBudget>0?Math.pow(Math.max(0,s.cost-plan.maxBudget)/400,2):0;
            const rate=mode.id==='budget'?2.5:1;
            return a.penalty+budgetPenalty(a)*rate - (b.penalty+budgetPenalty(b)*rate);
          });
          next.set(sum+weeks,list.slice(0,45));
        }
      }
      states=next;
    }
    const candidates=states.get(plan.weeks)??[];
    const ranked=candidates.map(v=>{
      const allKnown=plan.stages.every(s=>s.weeklyBudget>0);
      const penalty=plan.maxBudget>0?Math.pow(Math.max(0,v.cost-plan.maxBudget)/400,2)*(mode.id==='budget'?4:1):0;
      return {...v,score:v.penalty+penalty,costKnown:allKnown};
    }).sort((a,b)=>a.score-b.score);
    const best=ranked[0];
    if(!best)return {id:mode.id,title:mode.title,weeks:[],cost:null,warnings:['Geen haalbare verdeling.'],score:Infinity};
    const warnings:string[]=[];
    if(!best.costKnown)warnings.push('Niet alle etappes hebben een weekbudget; totaal is voorlopig onbekend.');
    if(best.costKnown&&plan.maxBudget>0&&best.cost>plan.maxBudget)warnings.push('De raming overschrijdt het totale budget.');
    if(plan.stages.some(s=>s.travelHours>10))warnings.push('Een etappe heeft meer dan tien opgegeven reisuren; controleer de rijbelasting.');
    return {id:mode.id,title:mode.title,weeks:best.weeks,cost:best.costKnown?best.cost:null,warnings,score:best.score};
  });
}
export function planWarnings(plan:TripPlan):string[]{
  const errors=validatePlan(plan);if(errors.length)return errors;
  const lo=plan.stages.reduce((n,s)=>n+(s.locked?s.idealWeeks:s.minWeeks),0);
  const hi=plan.stages.reduce((n,s)=>n+(s.locked?s.idealWeeks:s.maxWeeks),0);
  const warnings:string[]=[];
  if(plan.weeks<lo)warnings.push('De minimumduur van de etappes is '+lo+' weken; de totale reis is te kort.');
  if(plan.weeks>hi)warnings.push('De maximumduur van de etappes is '+hi+' weken; voeg een etappe toe of verruim een maximum.');
  if(plan.departureMonth===0)warnings.push('Vertrekmaand is nog open: seizoen en weer kunnen nog niet worden afgewogen.');
  if(plan.stages.some(s=>s.weeklyBudget===0))warnings.push('Vul eigen budgetramingen in om totale kosten te vergelijken.');
  if(plan.stages.some(s=>s.travelHours===0))warnings.push('Verplaatsingstijden zijn nog onbekend; echte routes en afstanden worden niet berekend.');
  return warnings;
}
