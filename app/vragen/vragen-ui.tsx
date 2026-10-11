'use client';
import Link from 'next/link';
import {useCallback,useEffect,useState} from 'react';
import {ArrowLeft,ArrowRight,BookOpen,BrainCircuit,Check,Compass,Heart,RefreshCw,Route,Sparkles} from 'lucide-react';
import '../reiskantoor/reiskantoor.css';
type Slot={
 key:string;kind:'story'|'stage'|'dce'|'legacy';role:string;title:string;intro:string;
 legacyId:string|null;round:number|null;
 options:{title:string;detail:string;attributes?:Record<string,number|string>}[];
 own:number|null;partner:number|null;ready:boolean;
};
type Data={set:{ordinal:number;theme:string;slots:Slot[];completed:number;bothCompleted:boolean;waiting:boolean}|null;
 members:number;totalCompleted:number;scienceCount:number;lastDiscovery:string|null};
const units:Record<string,string>={budget:'Kosten samen per week',dwell:'Weken op één plek',drive:'Rijuren per reisdag',nature:'Natuur',comfort:'Comfort',community:'Ontmoetingen'};
function Values({attributes,other}:{attributes:Record<string,number|string>;other:Record<string,number|string>}){
 return <div className="rk-choice-attributes">{Object.entries(attributes).map(([key,value])=><div className={value!==other[key]?'rk-attr-difference':''} key={key}><span>{units[key]??key}</span><strong>{key==='budget'?'€ ':''}{value}{key==='budget'?'/week':''}{['nature','comfort','community'].includes(key)?' / 5':''}</strong></div>)}</div>;
}
export function UnifiedQuestions(){
 const [data,setData]=useState<Data|null>(null),[loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[focus,setFocus]=useState<number>(0),[notice,setNotice]=useState('');
 const refresh=useCallback(async()=>{try{const response=await fetch('/api/vragen',{cache:'no-store'});const result=await response.json();if(!response.ok)throw Error(result.error??'Geen verbinding met het reisboekje.');setData(result as Data);setError('');}catch(e){setError(e instanceof Error?e.message:'Er ging iets mis.');}finally{setLoading(false);}},[]);
 useEffect(()=>{queueMicrotask(()=>void refresh());},[refresh]);
 async function submit(payload:Record<string,unknown>){
  setBusy(true);setError('');setNotice('');
  try{const res=await fetch('/api/vragen',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const result=await res.json();if(!res.ok)throw Error(result.error??'Opslaan ging mis.');setData(result as Data);
   if(payload.action==='next-set'){setFocus(0);setNotice('Nieuwe set geopend.');}
   else {const slots=(result as Data).set?.slots??[];const next=slots.findIndex(s=>s.own===null&&s.ready);if(next>=0)setFocus(next);else setFocus(Math.min(slots.length-1,focus));}
  }catch(e){setError(e instanceof Error?e.message:'Opslaan ging mis.');}
  finally{setBusy(false);}
 }
 const set=data?.set,slots=set?.slots??[],current=slots[focus];
 return <div className="rk-shell">
 <header className="rk-top"><Link href="/?screen=history" className="rk-back"><ArrowLeft size={17}/> Geschiedenis</Link><span>Oelie & Roebie</span></header>
 <main className="rk-main rk-readable">
  <div className="rk-intro"><span className="rk-kicker">ÉÉN SPEL · TWEE REIZIGERS</span><h1>Vragen<span>.</span></h1><p>Vier kleine keuzes per set. Soms gek, soms persoonlijk, soms over de hele reis. Achter de schermen bouwen ze samen aan jullie Reis-DNA en het Reiskantoor.</p></div>
  {error&&<p className="rk-error" role="alert">{error}</p>}
  {notice&&<p className="rk-success" role="status">{notice}</p>}
  {loading?<section className="rk-paper"><p>Jullie volgende set wordt geopend…</p></section>:!data?<section className="rk-paper"><h2>Open samen jullie reisboekje</h2><p>Log in om jullie vragen verder te ontdekken.</p><Link className="rk-button" href="/">Inloggen</Link></section>:
  <><section className="rk-paper">
   <div className="rk-section-head"><div><span className="rk-kicker">JULLIE SET {set?.ordinal??'—'}</span><h2>{set?.theme??'Er komen nieuwe vragen'}</h2></div><button className="rk-quiet" onClick={()=>void refresh()} disabled={busy}><RefreshCw size={16}/> Vernieuwen</button></div>
   <p className="rk-muted">Jij kunt op je eigen telefoon kiezen. Jullie antwoorden verschijnen voor elkaar pas wanneer jullie allebei dezelfde vraag beantwoorden. De volgende wetenschappelijke vraag wordt daarna pas gekozen.</p>
   {!data.members||data.members<2?<p className="rk-wait">Je kunt de set bekijken; koppel je reisgenoot om samen het Reis-DNA te laten groeien.</p>:null}
   {set?<><div className="rk-progress"><div><strong>{set.completed} / 4</strong><span>door jou gekozen</span></div><div><strong>{set.bothCompleted?'4 / 4':'Samen'}</strong><span>{set.bothCompleted?'door jullie afgerond':'ieder eigen tempo'}</span></div><div><strong>{set.ordinal}</strong><span>deze set</span></div></div>
    <div className="rk-set-steps">{slots.map((slot,index)=><button key={slot.key} className={'rk-set-step '+(focus===index?'rk-set-step-current':'')} onClick={()=>setFocus(index)} aria-pressed={focus===index}>
     <span>{slot.own!==null?<Check size={16}/>:index+1}</span><strong>{slot.role}</strong><small>{slot.ready?(slot.own===null?'Nog te kiezen':slot.partner!==null?'Samen onthuld':'Op de ander wachten'):'Volgt na jullie vorige keuze'}</small>
    </button>)}</div>
   </>:<p className="rk-wait">Er zijn momenteel onvoldoende nieuwe vragen beschikbaar. Eerder beantwoorde sets en Reis-DNA blijven bewaard.</p>}
  </section>
  {current&&<section className="rk-paper rk-main-question">
   <span className="rk-kicker">VRAAG {focus+1} / 4 · {current.role}</span><h2>{current.title}</h2>
   <p className="rk-muted">{current.intro}</p>
   {current.ready?<div className="rk-answer-pair">{current.options.map((opt,index)=><button key={index} className={'rk-answer-tile '+(current.own===index?'rk-answer-chosen':'')} disabled={busy||current.own!==null} onClick={()=>void submit({action:'answer',key:current.key,choice:index})}>
      <span className="rk-answer-label">{index===0?'A':'B'}{current.own===index?' · jouw keuze ✓':''}</span><strong>{opt.title}</strong><span>{opt.detail}</span>
      {opt.attributes&&<Values attributes={opt.attributes} other={current.options[1-index]?.attributes??{}}/>}
    </button>)}</div>:<p className="rk-wait">Deze vraag wordt gekozen als jullie allebei de vorige wetenschappelijke vraag hebben beantwoord. Dat voorkomt dat we iemands nog geheime antwoord gebruiken.</p>}
   {current.own!==null?<div className="rk-discovery"><Heart size={18}/>{current.partner!==null?<span>Jij koos {current.options[current.own]?.title}. Je reisgenoot koos {current.options[current.partner]?.title}. {current.own===current.partner?'Leuk, jullie kozen hetzelfde!':'Een verschil om samen over te praten.'}</span>:<span>Jouw antwoord staat vast en blijft nog even geheim voor de ander.</span>}</div>:null}
   <div className="rk-set-navigation"><button className="rk-quiet" disabled={focus===0} onClick={()=>setFocus(n=>Math.max(0,n-1))}><ArrowLeft size={15}/> Vorige vraag</button>
    <button className="rk-quiet" disabled={focus===3} onClick={()=>setFocus(n=>Math.min(3,n+1))}>Volgende vraag <ArrowRight size={15}/></button></div>
  </section>}
  {set?.bothCompleted?<section className="rk-paper rk-set-complete"><Sparkles size={29}/><h2>Een setje dichter bij jullie reis.</h2><p>Jullie hebben vier keer gekozen. Het Reiskantoor en Reis-DNA gebruiken alleen de antwoorden waarvoor dat verantwoord is.</p>
   <button className="rk-button" disabled={busy} onClick={()=>void submit({action:'next-set',ordinal:set.ordinal})}>Open de volgende set <ArrowRight size={16}/></button></section>:set?.completed===4?<section className="rk-paper"><h2>Jij bent klaar!</h2><p>Je reisgenoot kan op het eigen account afronden. Daarna onthullen jullie samen de resultaten en verschijnt een nieuwe set.</p><button className="rk-quiet" onClick={()=>void refresh()}><RefreshCw size={15}/> Kijk of de ander klaar is</button></section>:null}
  <section className="rk-paper rk-set-outcomes"><span className="rk-kicker">HET LEUKE ERACHTER</span><h2>Wat leert deze set?</h2><div className="rk-outcome-list"><div><BookOpen size={20}/><span><b>Een mooi reisverhaal</b> · de speelse vragen leveren herinneringen en verrassingen.</span></div><div><BrainCircuit size={20}/><span><b>Reis-DNA</b> · de gecontroleerde afwegingen verbeteren voorzichtig jullie persoonlijke model.</span></div><div><Route size={20}/><span><b>Reiskantoor</b> · etappekeuzes helpen om een haalbare lange reis te maken.</span></div></div>
   <p className="rk-muted">Wetenschappelijke controlevragen tellen nooit mee voor het trainen van het model. De oude speelse vragen blijven een andere bron van inzicht.</p></section>
  <div className="rk-footerlinks"><Link href="/?screen=saved">Voor later <ArrowRight size={17}/></Link><Link href="/?screen=settings">Instellingen <ArrowRight size={17}/></Link><Link href="/reis-dna"><BrainCircuit size={17}/> Bekijk Reis-DNA <ArrowRight size={17}/></Link><Link href="/reiskantoor"><Compass size={17}/> Bekijk het Reiskantoor <ArrowRight size={17}/></Link></div>
  </>}
 </main></div>;
}
