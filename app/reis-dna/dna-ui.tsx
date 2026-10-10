'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,BrainCircuit,TrendingUp,Info} from 'lucide-react';
import {Avatar} from '@/components/illustrations';
import {useTripExperience} from '@/components/trip-experience';
import '../reiskantoor/reiskantoor.css';
export function ReisDna(){
 const {data,loading,error}=useTripExperience();
 const [selected,setSelected]=useState<string|null>(null);
 const people=data?.people??[];
 const person=people.find(p=>p.id===selected)??people[0];
 return <div className="rk-shell">
   <header className="rk-top"><Link href="/" className="rk-back"><ArrowLeft size={17}/> Ons reisboekje</Link><span>Oelie & Roebie</span></header>
   <main className="rk-main rk-readable">
    <div className="rk-intro"><span className="rk-kicker">WETENSCHAPPELIJK GEÏNSPIREERD · NOG IN ONDERZOEK</span><h1>Reis-DNA<span>.</span></h1>
      <p>Wat weegt er voor jullie het zwaarst? Kies iemand om de persoonlijke rangorde en de onderliggende onzekerheid te ontdekken.</p></div>
    {error&&<p className="rk-error" role="alert">{error}</p>}
    {loading?<section className="rk-paper">De voorkeuren worden berekend…</section>:!data?<section className="rk-paper"><p>Log in om jullie reis-DNA te bekijken.</p><Link href="/" className="rk-button">Naar het reisboekje</Link></section>:
    <>
      <div className="rk-people" aria-label="Kies persoon">{people.map(p=><button key={p.id} aria-pressed={person?.id===p.id} className={'rk-person '+(person?.id===p.id?'rk-person-current':'')} onClick={()=>setSelected(p.id)}><Avatar id={p.avatar} size={44}/><span>{p.name}</span></button>)}</div>
      {person&&<section className="rk-paper"><span className="rk-kicker">PERSOONLIJKE RANGORDE</span><h2>Wat trekt {person.name} het meest?</h2>
        <p className="rk-muted">{person.observations} samen afgeronde keuze-experimenten beschikbaar voor dit persoonlijke model.</p>
        {person.ranking.length?<ol className="rk-ranking">{person.ranking.map((item,i)=><li key={item.key}>
          <span className="rk-rank-number">{i+1}</span><div className="rk-rank-data"><div className="rk-rank-head"><strong>{item.label}</strong><span>{item.signal==='voorlopig'?'Voorlopig signaal':'Nog onzeker'}</span></div>
            <div className="rk-rank-track"><div style={{width:(Math.max(0,Math.min(1,(item.weight+2)/4))*100)+'%'}}/></div>
            <small>Geschat relatief gewicht: {item.weight.toFixed(2)} · onzekerheid (≈1 SD): ±{item.uncertainty.toFixed(2)}</small>
          </div>
        </li>)}</ol>:<p className="rk-wait">Nog niet genoeg dubbel beantwoorde afwegingsvragen. Beantwoord eerst de etappevragen en daarna een paar voorkeurdilemma’s, samen met je reisgenoot.</p>}
        <div className="rk-explainer"><Info size={19}/><div><strong>Controle van de voorspellingen</strong>
         {person.diagnostics.looBrier!==null?<p>Leave-one-out Brier-score: {person.diagnostics.looBrier.toFixed(3)} (blind kansniveau: 0,250; lager is beter). {person.diagnostics.label}</p>:<p>{person.diagnostics.label}</p>}
         <p>De vraagkeuze is adaptief en de steekproef klein. Deze interne score bewijst geen wetenschappelijke kalibratie of generaliseerbaarheid.</p></div></div>
        <div className="rk-explainer"><Info size={19}/><div><strong>Hoe wetenschappelijk is dit?</strong><p>De app gebruikt voorlopig een geregulariseerd binair-logitmodel met een Bayesiaanse prior en Laplace-onzekerheidsbenadering. Dit is een eerste schatting, geen gevalideerd DCE of definitieve uitspraak over iemands karakter. Een hoge plaats betekent relatief sterker positief gewicht binnen deze zes kenmerken; een negatieve waarde kan een afkeer uitdrukken. Vergelijk de absolute waardes niet zomaar met andere studies.</p></div></div>
      </section>}
      <section className="rk-paper"><span className="rk-kicker">WAT JULLIE SAMEN ONTDEKKEN</span><h2>De overeenkomsten en verschillen.</h2>
       <div className="rk-progress"><div><strong>{data.funFacts.same}</strong><span>keer hetzelfde gekozen</span></div><div><strong>{data.funFacts.different}</strong><span>keer verschillend gekozen</span></div><div><strong>{data.completed}</strong><span>gezamenlijke keuzes</span></div></div>
       {data.lastReveal&&<p>Laatste gezamenlijke afweging: <strong>{data.lastReveal.question}</strong></p>}
      </section>
      <section className="rk-paper"><BrainCircuit size={25}/><h2>De volgende vraag is niet toevallig.</h2><p>Na jullie etappevragen selecteert de app een volgende vergelijking op basis van de geschatte informatiewaarde voor jullie beiden. Daardoor leert het model gaandeweg waar nog de meeste onzekerheid zit.</p><p className="rk-muted">Dat is een experimenteel adaptief keuzeonderzoek; claims over nauwkeurigheid vereisen eerst calibratie en onafhankelijke evaluatie.</p></section>
      <div className="rk-footerlinks"><Link href="/reisvragen"><TrendingUp size={17}/> Verder met vragen <ArrowRight size={17}/></Link><Link href="/reiskantoor">Zie wat dit voor de reis betekent <ArrowRight size={17}/></Link></div>
    </>}
   </main>
 </div>;
}
