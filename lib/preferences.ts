import type { Answer, Question } from './domain';
export type PreferenceKind = 'hard_constraint' | 'soft_constraint' | 'strong_preference' | 'weak_preference' | 'interest' | 'personal_wish' | 'open_question';
export type PreferenceBoundary = { preferred?: [number, number]; acceptable?: [number, number]; hard?: [number, number]; unit: string; exceptions?: string[] };
export type Preference = { key: string; subject: 'couple' | 'roebie' | 'oelie'; attribute: string; kind: PreferenceKind; value: unknown; confidence: number; source: 'explicitly_stated' | 'inferred'; notes: string; boundary?: PreferenceBoundary };
// Seed input only. Live selection reads the persisted rows, never this constant.
export const knownTravelContext: Preference[] = [
  { key:'car', subject:'couple', attribute:'transport', kind:'strong_preference', value:'car', confidence:1, source:'explicitly_stated', notes:'De eigen auto is het uitgangspunt.' },
  { key:'flight', subject:'couple', attribute:'flight', kind:'strong_preference', value:'avoid', confidence:.9, source:'explicitly_stated', notes:'Geen vliegreis gewenst; nog bevestigen of dit absoluut is.' },
  { key:'duration', subject:'couple', attribute:'months', kind:'open_question', value:null, confidence:.4, source:'explicitly_stated', notes:'Denkbereik 1,5 tot 6 maanden; geen definitieve grens.', boundary:{preferred:[1.5,6],unit:'maanden'} },
  { key:'departure', subject:'couple', attribute:'departureMonth', kind:'open_question', value:null, confidence:0, source:'explicitly_stated', notes:'Startmaand nog open.' },
  { key:'budget', subject:'couple', attribute:'monthlyBudget', kind:'open_question', value:null, confidence:0, source:'explicitly_stated', notes:'Maandbudget voor twee inclusief verblijf, eten en vervoer nog open.' },
  { key:'warmth', subject:'couple', attribute:'temperature', kind:'soft_constraint', value:'warm_and_dry', confidence:.8, source:'explicitly_stated', notes:'Liefst warm en droog; uitzonderingen bespreekbaar.', boundary:{preferred:[20,35],unit:'°C',exceptions:['Bijzondere ervaring of community']} },
  { key:'sea', subject:'couple', attribute:'beach', kind:'weak_preference', value:true, confidence:.8, source:'explicitly_stated', notes:'Zee is fijn, geen uitsluitingscriterium.' },
  ...['community','spirituality','learning','volunteering','playfulness','slowTravel'].map(attribute=>({key:attribute,subject:'couple' as const,attribute,kind:'interest' as const,value:true,confidence:.7,source:'explicitly_stated' as const,notes:'Genoemde interesse; vorm, intensiteit en voorwaarden nog ontdekken.'})),
  { key:'food', subject:'couple', attribute:'vegetarian', kind:'soft_constraint', value:true, confidence:.9, source:'explicitly_stated', notes:'Vegetarisch/vegan vriendelijk; sluit geen bestemming uit.' },
  { key:'boat', subject:'roebie', attribute:'sailing', kind:'personal_wish', value:'Een paar dagen meezeilen, leren en eventueel slapen aan boord', confidence:.9, source:'explicitly_stated', notes:'Roebies droom; niet automatisch van Oelie of de hele reis.' },
  { key:'oelieDream', subject:'oelie', attribute:'personalDream', kind:'open_question', value:null, confidence:0, source:'explicitly_stated', notes:'Oelies eigen dromen nog ophalen; niets invullen.' },
];
export type SetRole = 'core' | 'boundary' | 'personal' | 'wildcard';
export function selectTravelSet(bank: Question[], seen: string[], recent: Answer[], context: Preference[], count=4): Question[] {
  const excluded=new Set(seen);
  const open=new Set(context.filter(p=>p.kind==='open_question'||p.confidence<.6).map(p=>p.attribute));
  const conflicts=new Set(recent.filter(a=>recent.some(b=>b.user_id!==a.user_id&&b.question_id===a.question_id&&b.choice!==a.choice)).flatMap(a=>a.snapshot.focus??[]));
  const frequency=new Map<string,number>(); recent.slice(-24).forEach(a=>frequency.set(a.snapshot.theme,(frequency.get(a.snapshot.theme)??0)+1));
  const hard=context.filter(p=>p.subject==='couple'&&p.kind==='hard_constraint');
  const ranked=bank.filter(q=>q.role&&!excluded.has(q.id)&&q.options.every(o=>hard.every(p=>{
    if(p.attribute==='flight'&&p.value==='avoid')return o.attributes.transport!=='flight';
    const v=o.attributes[p.attribute]; if(v===undefined)return true;
    if(p.boundary?.hard&&typeof v==='number')return v>=p.boundary.hard[0]&&v<=p.boundary.hard[1];
    return p.value===v;
  }))).sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id));
  function score(q:Question){return q.informationValue+(q.focus??[]).filter(k=>open.has(k)).length*2+(q.focus??[]).filter(k=>conflicts.has(k)).length-(frequency.get(q.theme)??0);}
  const selected:Question[]=[];
  for(const role of ['core','boundary','personal','wildcard'] as const){const next=ranked.find(q=>q.role===role&&!selected.includes(q));if(next&&selected.length<count)selected.push(next);}
  for(const q of ranked)if(selected.length<count&&!selected.includes(q))selected.push(q);
  return selected;
}
export function completedSetCount(sets: {questionIds:string[]}[], answers: Answer[], userId:string) {
  const answered=new Set(answers.filter(a=>a.user_id===userId&&a.mode!=='example').map(a=>a.question_id));
  return sets.filter(s=>s.questionIds.length>0&&s.questionIds.every(id=>answered.has(id))).length;
}

// These fields describe quantities, including when their initial value is still null.
const numericPreferences=new Set(['months','departureMonth','monthlyBudget','temperature']);
export function normalizePreferenceValue(attribute:string,value:string|number|boolean|null){
  if(value===null||typeof value==='boolean')return value;
  const raw=typeof value==='string'?value.trim():String(value);if(!raw)return null;
  if(!numericPreferences.has(attribute)||(attribute==='temperature'&&raw==='warm_and_dry'))return typeof value==='number'?value:raw;
  if(typeof value==='string'&&!/^-?\d+(?:[.,]\d+)?$/.test(raw))throw Error('Vul een geldig getal in bij deze reisafspraak.');
  const number=Number(raw.replace(',','.'));
  if(!Number.isFinite(number)||(attribute!=='temperature'&&number<0)||(attribute==='months'&&number===0)||(attribute==='departureMonth'&&(!Number.isInteger(number)||number<1||number>12)))throw Error('Controleer het getal: reisduur is positief en een vertrekmaand ligt tussen 1 en 12.');
  return number;
}
