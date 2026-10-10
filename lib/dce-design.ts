import type {ChoiceProfile,ChoiceTask} from './reiskantoor';

/**
 * Frozen version 3 experimental design. Not a validated clinical-style DCE.
 * Six independently varied attributes, three stated levels each and balanced
 * non-dominated alternatives. The deterministic seed and unique IDs ensure
 * old answers always refer to identical alternatives.
 */
export const DCE_DESIGN_VERSION='dce-v3.1';
export type StudyTask=ChoiceTask & {designVersion:typeof DCE_DESIGN_VERSION;studyRole:'estimate'|'holdout';primaryFeatures:string[]};
export const attributeSpecification=[
 {key:'budget',label:'Kosten voor twee / week',levels:[250,375,500],unit:'€/week',preferred:'lower'},
 {key:'dwell',label:'Weken op één plek',levels:[1,3,5],unit:'weken',preferred:'higher'},
 {key:'drive',label:'Rijuren op een reisdag',levels:[2,5,8],unit:'uur',preferred:'lower'},
 {key:'nature',label:'Natuur',levels:[1,3,5],unit:'schaal 1–5',preferred:'higher'},
 {key:'comfort',label:'Comfort',levels:[1,3,5],unit:'schaal 1–5',preferred:'higher'},
 {key:'community',label:'Ontmoetingen',levels:[1,3,5],unit:'schaal 1–5',preferred:'higher'},
] as const;
type Key=keyof ChoiceProfile;
const keys:Key[]=['budget','dwell','drive','nature','comfort','community'];
function rng(seed:number){let s=seed>>>0;return()=>{s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};}
const random=rng(0xDCE20263);
function makeProfile(levels:number[]):ChoiceProfile{
 const result={} as ChoiceProfile;
 for(let i=0;i<keys.length;i++)result[keys[i]]=attributeSpecification[i].levels[levels[i]];
 return result;
}
function vector(a:ChoiceProfile,b:ChoiceProfile){
 return [(b.budget-a.budget)/250,(a.dwell-b.dwell)/4,(b.drive-a.drive)/6,
 (a.nature-b.nature)/4,(a.comfort-b.comfort)/4,(a.community-b.community)/4];
}
export function dominated(a:ChoiceProfile,b:ChoiceProfile):boolean{
 const v=vector(a,b);
 return v.every(x=>x>=0)||v.every(x=>x<=0);
}
function logInfoScore(info:number[][],v:number[]):number{
 // D-optimal increment is log(1 + v' (I + X'X)^-1 v); Gaussian elimination on
 // a fixed, strictly positive definite 6×6 matrix makes this deterministic.
 const m=info.map((row,i)=>[...row,v[i]]);
 for(let i=0;i<6;i++){
  let pivot=i;for(let j=i+1;j<6;j++)if(Math.abs(m[j][i])>Math.abs(m[pivot][i]))pivot=j;
  [m[i],m[pivot]]=[m[pivot],m[i]];
  const d=m[i][i];if(Math.abs(d)<1e-10)return 0;
  for(let k=i;k<7;k++)m[i][k]/=d;
  for(let j=0;j<6;j++)if(j!==i){const scale=m[j][i];for(let k=i;k<7;k++)m[j][k]-=scale*m[i][k];}
 }
 const gain=v.reduce((sum,x,i)=>sum+x*m[i][6],0);
 return Math.log1p(Math.max(0,gain));
}
type Candidate={a:ChoiceProfile;b:ChoiceProfile;vector:number[];features:string[]};
const bank:Candidate[]=[];
const seen=new Set<string>();
for(let trials=0;trials<3500&&bank.length<700;trials++){
 const base=Array.from({length:6},()=>Math.floor(random()*3));
 const other=[...base];
 const selection=[0,1,2,3,4,5].map(k=>({k,r:random()})).sort((x,y)=>x.r-y.r).slice(0,3+Math.floor(random()*2)).map(v=>v.k);
 for(const i of selection){
  const possibilities=[0,1,2].filter(x=>x!==base[i]);
  other[i]=possibilities[Math.floor(random()*possibilities.length)];
 }
 const a=makeProfile(base),b=makeProfile(other);
 if(dominated(a,b))continue;
 const key=[base.join(''),other.join('')].sort().join(':');
 if(seen.has(key))continue;seen.add(key);
 bank.push({a,b,vector:vector(a,b),features:selection.map(i=>keys[i])});
}
if(bank.length<48)throw new Error('Insufficient independent DCE candidate scenarios');
function buildStudy():StudyTask[]{
 const remaining=[...bank],chosen:Candidate[]=[];
 const info=Array.from({length:6},(_,i)=>Array.from({length:6},(_,j)=>i===j?2:0));
 const freq=Array(6).fill(0);
 while(chosen.length<48){
  let bestIndex=-1,bestScore=-Infinity;
  for(let i=0;i<remaining.length;i++){
   const t=remaining[i];
   const efficiency=logInfoScore(info,t.vector);
   const balance=t.vector.reduce((sum,x,k)=>sum+(x!==0?1/(1+freq[k]*.13):0),0);
   const score=efficiency+.035*balance-i*1e-8;
   if(score>bestScore){bestScore=score;bestIndex=i;}
  }
  const [selected]=remaining.splice(bestIndex,1);
  chosen.push(selected);
  for(let i=0;i<6;i++){
   if(selected.vector[i]!==0)freq[i]++;
   for(let j=0;j<6;j++)info[i][j]+=.25*selected.vector[i]*selected.vector[j];
  }
 }
 return chosen.map((t,i)=>{
  const swap=i%2===1;
  const a=swap?t.b:t.a,b=swap?t.a:t.b;
  return {
   id:'dce3-'+String(i+1).padStart(3,'0'),designVersion:DCE_DESIGN_VERSION,
   studyRole:[5,13,21,29,37,45].includes(i)?'holdout':'estimate',
   primaryFeatures:t.features,
   question:'Twee mogelijke reismanieren: welke past je beter?',
   a,b,
  };
 });
}
export const scientificChoiceTasks:ReadonlyArray<StudyTask>=Object.freeze(buildStudy());
export function studyTaskById(id:string):StudyTask|undefined{return scientificChoiceTasks.find(t=>t.id===id);}
export function studyQuality(){
 const matrix=Array.from({length:6},()=>Array(6).fill(0));
 const frequency=Array(6).fill(0),leftBetter=Array(6).fill(0);
 for(const t of scientificChoiceTasks){
  const diff=vector(t.a,t.b);
  for(let i=0;i<6;i++){
   if(diff[i]!==0){frequency[i]++;if(diff[i]>0)leftBetter[i]++;}
   for(let j=0;j<6;j++)matrix[i][j]+=diff[i]*diff[j];
  }
 }
 let rank=0,work=matrix.map(row=>[...row]);
 for(let j=0;j<6;j++){
  let pivot=rank;for(let r=rank+1;r<6;r++)if(Math.abs(work[r][j])>Math.abs(work[pivot][j]))pivot=r;
  if(Math.abs(work[pivot][j])<1e-8)continue;
  [work[rank],work[pivot]]=[work[pivot],work[rank]];
  const v=work[rank][j];for(let c=j;c<6;c++)work[rank][c]/=v;
  for(let r=0;r<6;r++)if(r!==rank){const factor=work[r][j];for(let c=j;c<6;c++)work[r][c]-=factor*work[rank][c];}
  rank++;
 }
 return {count:scientificChoiceTasks.length,holdout:scientificChoiceTasks.filter(t=>t.studyRole==='holdout').length,
  fullRank:rank===6,rank,frequency,leftBetter,dominated:scientificChoiceTasks.filter(t=>dominated(t.a,t.b)).length,
  version:DCE_DESIGN_VERSION};
}
