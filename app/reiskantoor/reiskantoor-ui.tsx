'use client';
import Link from 'next/link';
import {useEffect,useMemo,useState} from 'react';
import {ArrowLeft,ArrowDown,ArrowUp,Check,Compass,Heart,Lock,Plus,RefreshCw,Save,Trash2,Unlock,Sparkles} from 'lucide-react';
import {createProposals,planWarnings,validatePlan,starterPlan,choiceTasks,type TripPlan,type Stage,type StageKind,type ChoiceProfile,type Proposal} from '@/lib/reiskantoor';
import './reiskantoor.css';
type ChoiceView={ordinal:number;task:{id:string;question:string;a:ChoiceProfile;b:ChoiceProfile};own:0|1|null;partner:0|1|null;complete:boolean};
type Status={
  plan:TripPlan;revision:number;paired:boolean;suggestions:Proposal[];warnings:string[];
  choice:ChoiceView|null;completed:number;lastReveal:{question:string;own:0|1;partner:0|1}|null;funFacts:{same:number;different:number;latestDifference:string|null};remaining:number;model:{sampleSize:number;weights:{label:string;value:number}[];label:string}|null;modelStatus:string;
};
const labels:Record<StageKind,string>={outbound:'Heenreis',stay:'Verblijf',return:'Terugreis',other:'Tussenetappe'};
const months=['Nog open','Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December'];
const readable:Record<keyof ChoiceProfile,string>={budget:'Weekbudget',dwell:'Weken op één plek',drive:'Rijuren',nature:'Natuur (1–5)',comfort:'Comfort (1–5)',community:'Ontmoetingen (1–5)'};
function number(value:unknown,min:number,max:number){const n=Number(value);return Number.isFinite(n)?Math.min(max,Math.max(min,Math.round(n))):min;}
function newStage():Stage{
 return {id:crypto.randomUUID(),name:'Nieuwe etappe',region:'Nog te kiezen',kind:'other',minWeeks:1,idealWeeks:2,maxWeeks:6,locked:false,weeklyBudget:0,travelHours:0,notes:''};
}
export function Reiskantoor(){
 const [status,setStatus]=useState<Status|null>(null);
 const [plan,setPlan]=useState<TripPlan>(starterPlan);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[dirty,setDirty]=useState(false);
 const [error,setError]=useState(''),[info,setInfo]=useState('');
 const [active,setActive]=useState(0);
 async function load(){
   try{
     const response=await fetch('/api/reiskantoor',{cache:'no-store'});
     const body=await response.json();
     if(!response.ok)throw Error(body.error??'Het reisplan is niet bereikbaar.');
     setStatus(body as Status);setPlan(body.plan);setDirty(false);setError('');
   }catch(e){setError(e instanceof Error?e.message:'De verbinding is weg.');}
   finally{setLoading(false);}
 }
 useEffect(()=>{queueMicrotask(()=>void load());},[]);
 const problems=useMemo(()=>validatePlan(plan),[plan]);
 const warnings=useMemo(()=>planWarnings(plan),[plan]);
 const proposals=useMemo(()=>dirty?createProposals(plan):status?.suggestions??createProposals(plan),[dirty,plan,status]);
 const allocated=plan.stages.reduce((sum,s)=>sum+s.idealWeeks,0);
 const estimated=plan.stages.every(s=>s.weeklyBudget>0)?plan.stages.reduce((sum,s)=>sum+s.idealWeeks*s.weeklyBudget,0):null;
 function edit(p:TripPlan){setPlan(p);setDirty(true);setInfo('');}
 function patchStage(i:number,change:Partial<Stage>){edit({...plan,stages:plan.stages.map((s,index)=>index===i?{...s,...change}:s)});}
 function move(i:number,to:number){if(to<0||to>=plan.stages.length)return;const next=[...plan.stages];const [s]=next.splice(i,1);next.splice(to,0,s);edit({...plan,stages:next});setActive(to);}
 async function post(payload:Record<string,unknown>){
   setBusy(true);setError('');setInfo('');
   try{
     const response=await fetch('/api/reiskantoor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
     const data=await response.json();
     if(!response.ok)throw Error(data.error??'Opslaan mislukt.');
     setStatus(data as Status);
     if(payload.action==='save-plan'){setPlan(data.plan);setDirty(false);setInfo('Jullie reisplan is opgeslagen.');}
     else setInfo('Jouw keuze is opgeslagen. De ander ziet hem pas na het eigen antwoord.');
   }catch(e){setError(e instanceof Error?e.message:'Opslaan is niet gelukt.');}
   finally{setBusy(false);}
 }
 const choice=status?.choice;
 return <div className="rk-shell">
   <header className="rk-top"><Link href="/" className="rk-back"><ArrowLeft size={17}/> Terug naar het reisboekje</Link><span>Oelie en Roebie <Heart size={14}/></span></header>
   <main className="rk-main">
     <div className="rk-intro"><span className="rk-kicker">JULLIE REIS · STAP 1 T/M 4</span><h1>Het Reiskantoor<span>.</span></h1><p>Geen strakke route die al vastligt. Een gedeeld reisplan dat meebeweegt met wat jullie onderweg ontdekken.</p></div>
     {loading?<div className="rk-paper">Jullie reisplan wordt geopend…</div>:
     !status?<section className="rk-paper"><h2>Log in om samen te plannen</h2><p>{error||'Gebruik je account in het reisboekje om jullie etappes te bewaren.'}</p><Link className="rk-button" href="/">Naar inloggen</Link></section>:
     <>
     {error&&<p className="rk-error" role="alert">{error}</p>}
     {info&&<p className="rk-success" role="status">{info}</p>}
     <div className="rk-columns">
     <div className="rk-content">
       <section className="rk-paper rk-overview">
         <div className="rk-section-head"><div><span className="rk-kicker">01 · REISCANVAS</span><h2>Zo lang mogen we wegdromen.</h2></div><button className="rk-quiet" onClick={()=>void load()} disabled={busy}><RefreshCw size={15}/> Herladen</button></div>
         <div className="rk-plan-inputs">
           <label>Totale reis (weken)<input type="number" min={2} max={52} value={plan.weeks} onChange={e=>edit({...plan,weeks:number(e.target.value,2,52)})}/></label>
           <label>Maximaal totaalbudget (€)<input type="number" min={0} max={1000000} step={100} value={plan.maxBudget} onChange={e=>edit({...plan,maxBudget:number(e.target.value,0,1000000)})}/><small>0 = nog onbekend</small></label>
           <label>Vertrekmaand<select value={plan.departureMonth} onChange={e=>edit({...plan,departureMonth:number(e.target.value,0,12)})}>{months.map((m,i)=><option key={m} value={i}>{m}</option>)}</select></label>
         </div>
         <div className="rk-bars" aria-label="Gewenste verdeling etappes">
           {plan.stages.map((s,i)=><div key={s.id} className={'rk-bar rk-tone-'+i%4} style={{flex:Math.max(1,s.idealWeeks)}} title={s.name+': '+s.idealWeeks+' weken'}/>)}
         </div>
         <div className="rk-metrics"><div><strong>{allocated}</strong><span>weken verdeeld</span></div><div><strong>{plan.weeks-allocated}</strong><span>weken nog vrij / teveel</span></div><div><strong>{estimated===null?'—':'€ '+estimated.toLocaleString('nl-NL')}</strong><span>raming ingevulde etappes</span></div></div>
       </section>
       <section className="rk-paper">
         <div className="rk-section-head"><div><span className="rk-kicker">01 · JULLIE ETAPPES</span><h2>De reis in hoofdstukken.</h2></div><span className="rk-count">{plan.stages.length}/12</span></div>
         <p className="rk-muted">Heenreis, lange verblijven, tussenstops en terugreis: geef elke etappe een eigen rol, eigen grenzen en een plek in het verhaal.</p>
         <div className="rk-stage-list">
         {plan.stages.map((s,i)=><article key={s.id} className={'rk-stage '+(active===i?'rk-stage-active':'')}>
           <div className="rk-stage-head"><button type="button" className="rk-stage-title" onClick={()=>setActive(active===i?-1:i)} aria-expanded={active===i}><span className={'rk-dot rk-tone-'+i%4}/><span><strong>{s.name}</strong><small>{s.idealWeeks} weken · {labels[s.kind]}{s.locked?' · vastgezet':''}</small></span></button><div className="rk-stage-actions"><button aria-label="Etappe omhoog" title="Omhoog" disabled={i===0} onClick={()=>move(i,i-1)}><ArrowUp size={16}/></button><button aria-label="Etappe omlaag" title="Omlaag" disabled={i===plan.stages.length-1} onClick={()=>move(i,i+1)}><ArrowDown size={16}/></button><button aria-label={s.locked?'Ontgrendel etappe':'Zet etappe vast'} title={s.locked?'Ontgrendel':'Zet vast'} onClick={()=>patchStage(i,{locked:!s.locked})}>{s.locked?<Lock size={16}/>:<Unlock size={16}/>}</button><button aria-label="Verwijder etappe" title="Verwijder" disabled={plan.stages.length===1} onClick={()=>{edit({...plan,stages:plan.stages.filter(x=>x.id!==s.id)});setActive(0);}}><Trash2 size={15}/></button></div></div>
           {active===i&&<div className="rk-stage-body">
             <div className="rk-grid2">
               <label>Naam<input maxLength={70} value={s.name} onChange={e=>patchStage(i,{name:e.target.value})}/></label>
               <label>Soort<select value={s.kind} onChange={e=>patchStage(i,{kind:e.target.value as StageKind})}>{Object.entries(labels).map(([key,value])=><option key={key} value={key}>{value}</option>)}</select></label>
               <label>Regio / richting<input maxLength={100} value={s.region} onChange={e=>patchStage(i,{region:e.target.value})}/></label>
               <label>Geschat budget / week (€)<input type="number" min={0} max={20000} value={s.weeklyBudget} onChange={e=>patchStage(i,{weeklyBudget:number(e.target.value,0,20000)})}/></label>
             </div>
             <div className="rk-grid3">
               <label>Min. weken<input type="number" min={1} max={52} value={s.minWeeks} onChange={e=>patchStage(i,{minWeeks:number(e.target.value,1,52)})}/></label>
               <label>Gewenst<input type="number" min={1} max={52} value={s.idealWeeks} onChange={e=>patchStage(i,{idealWeeks:number(e.target.value,1,52)})}/></label>
               <label>Max. weken<input type="number" min={1} max={52} value={s.maxWeeks} onChange={e=>patchStage(i,{maxWeeks:number(e.target.value,1,52)})}/></label>
             </div>
             <label>Reistijd naar deze etappe (uren, zelf invullen)<input type="number" min={0} max={240} step="0.5" value={s.travelHours} onChange={e=>patchStage(i,{travelHours:Math.max(0,Math.min(240,Number(e.target.value)||0))})}/></label>
             <label>Waar hopen we op?<textarea rows={2} maxLength={400} value={s.notes} onChange={e=>patchStage(i,{notes:e.target.value})} placeholder="Bijvoorbeeld keramiek leren, ergens landen of een mooie kustroute…"/></label>
           </div>}
         </article>)}
         </div>
         <button className="rk-add" disabled={plan.stages.length>=12} onClick={()=>{edit({...plan,stages:[...plan.stages,newStage()]});setActive(plan.stages.length);}}><Plus size={18}/> Etappe toevoegen</button>
         {problems.length>0&&<div className="rk-issues" role="alert">{problems.map(t=><p key={t}>{t}</p>)}</div>}
         <div className="rk-save"><span>{dirty?'Nog niet opgeslagen':'Opgeslagen voor jullie allebei'}</span><button className="rk-button" disabled={busy||!dirty||problems.length>0} onClick={()=>void post({action:'save-plan',plan,revision:status.revision})}><Save size={16}/>{busy?'Even bewaren…':'Reisplan bewaren'}</button></div>
       </section>
       <section className="rk-paper">
         <div className="rk-section-head"><div><span className="rk-kicker">02 · REISLOGICA</span><h2>Wat kan, en wat schuurt?</h2></div><Compass size={24}/></div>
         {!warnings.length?<p className="rk-success">De opgegeven grenzen passen op elkaar. Controleer nog wel echte reistijden en prijzen.</p>:<ul className="rk-warnings">{warnings.map(w=><li key={w}>{w}</li>)}</ul>}
         <p className="rk-muted">Dit rekent met jullie eigen aannames, zonder verzonnen prijzen, wegen of weersgegevens. Etappes die vaststaan blijven vast.</p>
       </section>
       <section className="rk-paper">
         <div className="rk-section-head"><div><span className="rk-kicker">04 · SLIMME VOORSTELLEN</span><h2>Andere manieren om te reizen.</h2></div><Sparkles size={24}/></div>
         {!proposals.length?<p>Er is nog geen haalbare verdeling. Pas de totale duur of de minimale/maximale etappes aan.</p>:
         <div className="rk-proposals">{proposals.map(proposal=><article key={proposal.id} className="rk-proposal"><h3>{proposal.title}</h3><div className="rk-proposal-line">{plan.stages.map((s,i)=><div key={s.id}><span>{s.name}</span><strong>{proposal.weeks[i]} weken</strong></div>)}</div>{proposal.cost!==null&&<p>Zelf ingeschatte kosten: € {proposal.cost.toLocaleString('nl-NL')}</p>}{proposal.warnings.map(w=><p className="rk-muted" key={w}>{w}</p>)}<button className="rk-quiet" disabled={busy} onClick={()=>{edit({...plan,stages:plan.stages.map((s,i)=>({...s,idealWeeks:proposal.weeks[i]}))});setInfo('Variant overgenomen in je concept. Bewaar je reisplan om deze te delen.');window.scrollTo({top:0,behavior:'smooth'});}}><Check size={15}/> Neem deze verdeling over</button></article>)}</div>}
         <p className="rk-muted">Dit zijn voorstellen voor de <em>verdeling van weken</em>, nog geen gecontroleerde routes of concrete bestemmingen. Er worden geen boekingen gedaan.</p>
       </section>
     </div>
     <aside className="rk-side">
       <section className="rk-paper rk-question">
         <span className="rk-kicker">03 · ADAPTIEVE KEUZES</span><h2>Wat leren we over jullie?</h2>
         <p className="rk-muted">Kies ieder afzonderlijk. De volgende vraag wordt gekozen op basis van jullie gezamenlijke leerbehoefte; iemands antwoord blijft geheim totdat de ander ook koos.</p>
         {!status.paired&&<p className="rk-wait">Koppel eerst jullie twee accounts in het reisboekje. Je kunt ondertussen het reisplan bewerken.</p>}
         {choice&&<>
           <span className="rk-count">Vergelijking {choice.ordinal+1} / 16</span><h3>{choice.task.question}</h3>
           <div className="rk-options">{([0,1] as const).map(id=><button key={id} className={'rk-option '+(choice.own===id?'rk-picked':'')} disabled={busy||choice.own!==null} onClick={()=>void post({action:'answer',ordinal:choice.ordinal,choice:id})}>
             <strong>{id===0?'A':'B'} {choice.own===id?'✓':''}</strong>
             <span>{Object.entries(id===0?choice.task.a:choice.task.b).map(([key,v])=><span key={key}><span>{readable[key as keyof ChoiceProfile]}</span><b>{key==='budget'?'€ ':''}{v}{key==='budget'?'/wk':''}</b></span>)}</span>
           </button>)}</div>
           {choice.own!==null&&!choice.complete&&<p className="rk-wait">Jouw keuze staat vast. De keuze van je reisgenoot blijft verborgen tot die ook antwoord heeft gegeven.</p>}
           {choice.complete&&<p className="rk-success">Jullie hebben allebei gekozen. De volgende adaptieve vergelijking verschijnt zodra het Reiskantoor bijgewerkt is.</p>}
         </>}
         {!choice&&<p>Jullie hebben alle experimentele vragen doorlopen.</p>}
         <div className="rk-model"><strong>{status.completed} gezamenlijk beantwoorde vergelijkingen</strong>
         {status.lastReveal&&<div className="rk-last-reveal"><b>Laatst samen ontdekt</b><p>{status.lastReveal.question}</p><span>Jij koos {status.lastReveal.own===0?'A':'B'} · Je reisgenoot koos {status.lastReveal.partner===0?'A':'B'}</span></div>}
         {status.completed>0&&<p>Jullie kozen {status.funFacts.same} keer hetzelfde en {status.funFacts.different} keer anders.
           {status.funFacts.latestDifference&&<> Een mooi gespreksonderwerp: {choiceTasks.find(t=>t.id===status.funFacts.latestDifference)?.question}</>}
         </p>}
         <p>{status.modelStatus}</p>
         {status.model&&<><h3>Voorzichtige signalen</h3>{status.model.weights.map(w=><div key={w.label}><span>{w.label}</span><span>{Math.abs(w.value)<0.15?'Nog open':w.value>0?'Meer hiervan':'Minder hiervan'}</span></div>)}<small>{status.model.label}</small></>}</div>
       </section>
       <section className="rk-paper rk-info"><h3>Jullie eigen reiskantoor</h3><p>Je kunt eerst zomaar wat proberen. Elke etappe is bewerkbaar en kan worden vastgezet. Het systeem helpt bij afwegingen — de keuze blijft van jullie.</p></section>
     </aside>
     </div>
     </>}
   </main>
 </div>;
}
