'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,BrainCircuit,Check,Compass,Heart,RefreshCw,Route,Sparkles} from 'lucide-react';
import {SiteNavigation} from '@/components/site-navigation';
import {AnswerChoice,ChoiceAttributes,AppAction} from '@/components/ui';
import '../reiskantoor/reiskantoor.css';
type Slot={
 key:string;kind:'story'|'stage'|'dce'|'legacy';role:string;title:string;intro:string;
 legacyId:string|null;round:number|null;
 options:{title:string;detail:string;attributes?:Record<string,number|string>}[];
 own:number|null;partner:number|null;ready:boolean;
};
type Data={set:{ordinal:number;theme:string;slots:Slot[];completed:number;bothCompleted:boolean;waiting:boolean}|null;
 members:number;totalCompleted:number;scienceCount:number;lastDiscovery:string|null};
export function UnifiedQuestions(){
 const [data,setData]=useState<Data|null>(null);
 const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false);
 const [error,setError]=useState(''),[focus,setFocus]=useState<number|null>(null),[notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{
  try{
   const response=await fetch('/api/vragen',{cache:'no-store'});
   const result=await response.json();
   if(!response.ok)throw Error(result.error??'Geen verbinding met het reisboekje.');
   setData(result as Data);setError('');
  }catch(e){setError(e instanceof Error?e.message:'Er ging iets mis.');}
  finally{setLoading(false);}
 },[]);
 useEffect(()=>{queueMicrotask(()=>void refresh());},[refresh]);
 async function submit(payload:Record<string,unknown>){
  if(busy)return;
  setBusy(true);setError('');setNotice('');
  try{
   const response=await fetch('/api/vragen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
   const result=await response.json();if(!response.ok)throw Error(result.error??'Opslaan ging mis.');
   const updated=result as Data;setData(updated);
   if(payload.action==='next-set'){setFocus(0);setNotice('Jullie volgende set staat klaar.');}
   else {
    const next=(updated.set?.slots??[]).findIndex((slot,index)=>slot.own===null&&slot.ready&&index!==(focus??-1));
    setFocus(next>=0?next:null);
   }
  }catch(e){setError(e instanceof Error?e.message:'Opslaan ging mis.');}
  finally{setBusy(false);}
 }
 const set=data?.set,slots=set?.slots??[],current=focus===null?null:slots[focus];
 const personalDone=slots.length===4&&slots.every(slot=>slot.ready&&slot.own!==null);
 const answering=!!current&&current.ready&&current.own===null;
 return <div className={'rk-shell rk-questions '+(answering?'rk-focus-mode':'rk-overview-mode')}>
 {answering&&<div className="rk-question-exit"><AppAction variant="quiet" onClick={()=>setFocus(null)}><ArrowLeft size={16}/> Terug naar jullie set</AppAction><span>Set {set?.ordinal} · {focus!+1} van 4</span></div>}
 <main className="rk-main rk-readable">
 {error&&<p className="rk-error" role="alert">{error}</p>}
 {notice&&<p className="rk-success" role="status">{notice}</p>}
 {current?<section className="rk-paper rk-main-question">
  <span className="rk-kicker">VRAAG {focus!+1} / 4 · {current.role}</span><h1>{current.title}</h1><p className="rk-muted">{current.intro}</p>
  {current.ready?<div className="rk-answer-pair">{current.options.map((opt,index)=><AnswerChoice
    key={index} label={index===0?'A':'B'} title={opt.title} description={opt.detail}
    chosen={current.own===index} disabled={busy||current.own!==null}
    onClick={()=>void submit({action:'answer',key:current.key,choice:index})}>
    {opt.attributes&&<ChoiceAttributes attributes={opt.attributes} other={current.options[1-index]?.attributes??{}}/>}
   </AnswerChoice>)}</div>:<div className="rk-wait">Deze wetenschappelijke vraag is nog niet beschikbaar. Je kunt gewoon een andere vraag kiezen of naar de set teruggaan.</div>}
  {current.own!==null&&<div className="rk-discovery"><Heart size={18}/>{current.partner!==null?
   <span>Jij koos {current.options[current.own]?.title}. Je reisgenoot koos {current.options[current.partner]?.title}. {current.own===current.partner?'Jullie kozen hetzelfde!':'Een verschil om over te praten.'}</span>:
   <span>Jouw antwoord is opgeslagen. Wat je reisgenoot koos blijft geheim totdat die zelf heeft geantwoord.</span>}</div>}
  <div className="rk-set-navigation"><AppAction variant="quiet" disabled={focus===0} onClick={()=>setFocus(i=>Math.max(0,(i??0)-1))}><ArrowLeft size={16}/> Vorige</AppAction>
   <AppAction variant="quiet" onClick={()=>focus===3?setFocus(null):setFocus(i=>Math.min(3,(i??0)+1))}>{focus===3?'Naar setoverzicht':'Volgende vraag'} <ArrowRight size={16}/></AppAction></div>
 </section>:<>
 <div className="rk-intro"><span className="rk-kicker">ÉÉN SPEL · ZOVEEL VRAGEN ALS JE WILT</span><h1>Vragen<span>.</span></h1>
 <p>Ga verder wanneer je zin hebt. Vier kleine keuzes per set: bijzonder, persoonlijk en reisgericht. Ieder op je eigen tempo; jullie resultaten groeien samen.</p></div>
 {loading?<section className="rk-paper">Jullie volgende vragen ophalen…</section>:!data?
  <section className="rk-paper"><h2>Open jullie reisboekje</h2><p>Log in om de vragen te beantwoorden.</p><Link className="rk-button" href="/">Naar inloggen</Link></section>:
  <><section className="rk-paper"><div className="rk-section-head"><div><span className="rk-kicker">SET {set?.ordinal??'—'}</span><h2>{set?.theme??'Een volgende ontdekking'}</h2></div>
   <AppAction variant="quiet" onClick={()=>void refresh()} disabled={busy}><RefreshCw size={16}/> Vernieuwen</AppAction></div>
   {set?<><div className="rk-progress"><div><strong>{set.completed} / 4</strong><span>door jou gekozen</span></div>
    <div><strong>{set.bothCompleted?'4 / 4':'Apart'}</strong><span>{set.bothCompleted?'samen afgerond':'ieder eigen tempo'}</span></div>
    <div><strong>∞</strong><span>meer sets mogelijk</span></div></div>
   <div className="rk-set-steps">{slots.map((slot,index)=><button key={slot.key} className={'rk-set-step '+(slot.own===null?'rk-set-step-open':'')}
    onClick={()=>setFocus(index)}>
    <span>{slot.own!==null?<Check size={16}/>:index+1}</span><strong>{slot.role}</strong>
    <small>{!slot.ready?'Nog niet beschikbaar':slot.own===null?'Kies nu':slot.partner!==null?'Samen onthuld':'Jouw antwoord staat vast'}</small>
   </button>)}</div>
   {personalDone?<div className="rk-set-complete"><Sparkles size={24}/><h3>Jouw set is klaar!</h3>
    <p>Je kunt meteen verder. Je reisgenoot beantwoordt de vragen op eigen tempo; daardoor blijft de wetenschap eerlijk.</p>
    <AppAction variant="primary" disabled={busy} onClick={()=>void submit({action:'next-set',ordinal:set.ordinal})}>
     Nog een set <ArrowRight size={17}/></AppAction></div>:
    <AppAction variant="primary" disabled={busy} onClick={()=>setFocus(Math.max(0,slots.findIndex(slot=>slot.own===null&&slot.ready)))}>
     {set.completed===0?'Begin met deze set':'Verder met vragen'} <ArrowRight size={17}/></AppAction>}
   </>:<div className="rk-set-complete"><h2>Er is meer te ontdekken.</h2><p>Vernieuw de pagina als er een vraag klaarstaat. Eerdere antwoorden blijven bewaard.</p></div>}
   </section>
   <section className="rk-paper rk-set-outcomes"><span className="rk-kicker">WAT JULLIE AAN HET ONTDEKKEN ZIJN</span>
    <h2>Elke vraag heeft een eigen rol.</h2>
    <div className="rk-outcome-list"><div><BookOpen size={20}/><span><b>Reisverhaal:</b> gekke en persoonlijke dilemma’s om samen over te praten.</span></div>
     <div><BrainCircuit size={20}/><span><b>Reis-DNA:</b> gecontroleerde wetenschappelijke vragen leveren voorzichtige, toetsbare inzichten.</span></div>
     <div><Route size={20}/><span><b>Reiskantoor:</b> etappekeuzes helpen de lange reis op elkaar af te stemmen.</span></div></div>
    <p className="rk-muted">Er kunnen altijd nieuwe verhalende vragen volgen. Als een vast wetenschappelijk experiment afgerond is, worden nieuwe speelse vragen niet als wetenschappelijke metingen meegerekend.</p>
   </section></>}
 <div className="rk-footerlinks"><Link href="/?screen=onderzoek"><BrainCircuit size={17}/> Wat leren we al? <ArrowRight size={16}/></Link></div>
 </>}
 </main>
 {!answering&&<SiteNavigation current="/vragen"/>}
 </div>;
}
