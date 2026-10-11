/** Pure invariants of the four-question user-facing set. */
export type SavedChoice={userId:string;choice:0|1};
export function revealedTo(requestingUser:string,members:string[],answers:SavedChoice[]){
 const own=answers.find(a=>a.userId===requestingUser)?.choice??null;
 const complete=members.length===2&&members.every(id=>answers.some(a=>a.userId===id));
 const other=complete?answers.find(a=>a.userId!==requestingUser)?.choice??null:null;
 return {own,partner:own!==null?other:null};
}
export function mayAdvance(members:string[],slots:{ready:boolean;choices:SavedChoice[]}[]):boolean{
 return members.length===2&&slots.length===4&&slots.every(s=>
  s.ready&&members.every(m=>s.choices.some(c=>c.userId===m))
 );
}
export function canonicalSetSequence(legacyIds:string[],scienceOrdinals:(number|null)[]){
 if(legacyIds.length!==2||new Set(legacyIds).size!==2||scienceOrdinals.length!==2)
  throw Error('A complete set needs two distinct story questions and two experimental slots.');
 const keys=['legacy-'+legacyIds[0],'science-0','legacy-'+legacyIds[1],'science-1'];
 return keys.map((key,i)=>({key,kind:i%2===0?'legacy' as const:'scientific' as const,
  ref:i===0?legacyIds[0]:i===2?legacyIds[1]:scienceOrdinals[(i-1)/2]}));
}


/** Prefer a personal companion to the core dilemma; if possible stay on-theme. */
export function selectStoryPair<T extends {id:string;theme:string;role?:string}>(orderedIds:string[],bank:T[]):string[]{
 const first=bank.find(q=>q.id===orderedIds[0]);
 if(!first)return[];
 const candidates=orderedIds.slice(1).map(id=>bank.find(q=>q.id===id)).filter((q):q is T=>!!q);
 const matching=candidates.find(q=>q.role==='personal'&&q.theme===first.theme)
  ??candidates.find(q=>q.theme===first.theme)
  ??candidates.find(q=>q.role==='personal')
  ??candidates[0];
 return matching?[first.id,matching.id]:[];
}


/** No one needs to wait for the other traveller before requesting another set. */
export function mayAdvancePersonally(slots:{ready:boolean;own:number|null}[]):boolean{
 return slots.length===4&&slots.every(s=>s.ready&&s.own!==null);
}
