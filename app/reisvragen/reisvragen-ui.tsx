'use client';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,RefreshCw,CheckCircle2,HelpCircle} from 'lucide-react';
import {useTripExperience} from '@/components/trip-experience';
import type {ChoiceProfile} from '@/lib/reiskantoor';
import '../reiskantoor/reiskantoor.css';
const attributes:Record<keyof ChoiceProfile,string>={budget:'Kosten samen per week',dwell:'Weken op één plek',drive:'Rijuren op een reisdag',nature:'Natuur (1 weinig · 5 veel)',comfort:'Comfort (1 basic · 5 luxe)',community:'Ontmoetingen (1 weinig · 5 veel)'};
function ChoiceDetails({values,other}:{values:ChoiceProfile;other:ChoiceProfile}){
 return <div className="rk-choice-attributes">{Object.entries(values).map(([k,v])=><div key={k} className={v!==other[k as keyof ChoiceProfile]?'rk-attr-difference':''}>
  <span>{attributes[k as keyof ChoiceProfile]}</span>
  <strong>{k==='budget'?'€ ':''}{v}{k==='budget'?'/week':''}{['nature','comfort','community'].includes(k)?' / 5':''}</strong>
 </div>)}</div>;
}
export function Reisvragen(){
 const {data,loading,error,busy,refresh,answer}=useTripExperience();
 const q=data?.choice;
 return <div className="rk-shell"><header className="rk-top"><Link href="/" className="rk-back"><ArrowLeft size={17}/> Ons reisboekje</Link><span>Oelie & Roebie</span></header>
 <main className="rk-main rk-readable">
 <div className="rk-intro"><span className="rk-kicker">VRAGEN EERST · ETAPPES DAARNA</span><h1>Reisvragen<span>.</span></h1><p>Jullie dromen worden stap voor stap een route. Niet zelf een reisplan invullen, maar ieder kiezen wat aantrekkelijk klinkt. Het Reiskantoor groeit mee.</p></div>
 {error&&<p className="rk-error" role="alert">{error}</p>}
 {loading?<section className="rk-paper">Jullie volgende vraag ophalen…</section>:!data?<section className="rk-paper"><p>Log in via jullie reisboekje om samen te kiezen.</p><Link className="rk-button" href="/">Naar inloggen <ArrowRight size={17}/></Link></section>:
 <>
 <div className="rk-progress"><div><strong>{data.completedStages}/{data.totalStageQuestions}</strong><span>etappevragen samen beantwoord</span></div><div><strong>{data.study.answered}/{data.study.total}</strong><span>wetenschappelijk ontworpen vergelijkingen</span></div><div><strong>{data.funFacts.same}</strong><span>keer dezelfde keuze</span></div></div>
 <section className="rk-study-explainer"><strong>{data.study.answered===0?'Jullie wetenschappelijke vragen beginnen na de etappes.':'Het model wordt steeds specifieker.'}</strong><p>We vergelijken vooraf ontworpen reisprofielen met verschillende kosten, rijtijd, verblijfsduur, natuur, comfort en ontmoetingen. Niet zomaar leuke dilemma’s: sommige antwoorden schatten jullie voorkeuren, andere controleren of we echt iets hebben geleerd.</p>
 {data.archiveReport.hasData&&<p>Uit jullie eerdere reisrapport nemen we mee welke onderwerpen extra aandacht verdienen. Oudere antwoorden worden niet hergebruikt als nieuwe studiemetingen.</p>}
 <Link href="/reis-dna">Zo groeit jullie Reis-DNA <ArrowRight size={15}/></Link></section>
 {!data.paired&&<p className="rk-wait">Nodig eerst je reisgenoot uit via het reisboekje. De etappes worden pas op basis van beide keuzes afgeleid.</p>}
 {q?<section className="rk-paper rk-main-question">
   <span className="rk-kicker">{'kind' in q.task?'ETAPPEVRAAG':'ADAPTIEVE VOORKEURVRAAG'} · VRAAG {q.ordinal+1}</span>
   <h2>{q.task.question}</h2>
   {'kind' in q.task?<p className="rk-muted">{q.task.description}</p>:<p className="rk-muted">Beide opties zijn denkbeeldig. De <strong>gemarkeerde kenmerken</strong> verschillen, de andere zijn gelijk. Vergelijk het geheel, niet één cijfer. Er is geen goed of fout antwoord.</p>}
   <div className="rk-answer-pair">{([0,1] as const).map(which=>{
     const opt=which===0?q.task.a:q.task.b;
     const other=which===0?q.task.b:q.task.a;
     const chosen=q.own===which;
     return <button key={which} className={'rk-answer-tile '+(chosen?'rk-answer-chosen':'')} disabled={busy||q.own!==null} onClick={()=>void answer(q.ordinal,which)}>
       <span className="rk-answer-label">{which===0?'A':'B'}{chosen?' · jouw keuze ✓':''}</span>
       {'label' in opt?<><strong>{opt.label}</strong><span>{opt.detail}</span></>:<><strong>{which===0?'Reis A':'Reis B'}</strong>{'label' in other?null:<ChoiceDetails values={opt} other={other}/>}</>}
     </button>;
   })}</div>
   {q.own!==null?<p className="rk-wait">Je keuze is opgeslagen. Je reisgenoot ziet jouw antwoord pas nadat die zelf gekozen heeft.</p>:<p className="rk-muted"><HelpCircle size={15} style={{verticalAlign:'middle'}}/> Je kunt ieder op een eigen telefoon antwoorden.</p>}
   <button className="rk-quiet" onClick={()=>void refresh()} disabled={busy}><RefreshCw size={15}/> Kijk of de ander klaar is</button>
 </section>:<section className="rk-paper"><CheckCircle2 size={30}/><h2>Alle beschikbare vragen zijn samen beantwoord.</h2><p>Bekijk wat jullie keuzes tot nu toe betekenen. Nieuwe reisvragen kunnen later worden toegevoegd.</p></section>}
 {data.lastReveal&&<section className="rk-paper"><span className="rk-kicker">LAATSTE KEUZE VAN JULLIE TWEE</span><h2>{data.lastReveal.question}</h2><p>Jij koos {data.lastReveal.own===0?'A':'B'} · Je reisgenoot koos {data.lastReveal.partner===0?'A':'B'}.</p></section>}
 <div className="rk-footerlinks"><Link href="/reiskantoor">Bekijk het Reiskantoor <ArrowRight size={17}/></Link><Link href="/reis-dna">Ontdek jullie Reis-DNA <ArrowRight size={17}/></Link></div>
 </>}
 </main></div>;
}
