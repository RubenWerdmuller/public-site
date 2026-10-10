'use client';
import Link from 'next/link';
import {useState} from 'react';
import {ArrowLeft,ArrowRight,BrainCircuit,TrendingUp,Info,BookOpen,BarChart3} from 'lucide-react';
import {Avatar} from '@/components/illustrations';
import {useTripExperience} from '@/components/trip-experience';
import '../reiskantoor/reiskantoor.css';
export function ReisDna(){
 const {data,loading,error}=useTripExperience();
 const [selected,setSelected]=useState<string|null>(null);
 const people=data?.people??[],person=people.find(p=>p.id===selected)??people[0];
 const report=data?.archiveReport;
 return <div className="rk-shell"><header className="rk-top"><Link href="/" className="rk-back"><ArrowLeft size={17}/> Ons reisboekje</Link><span>Oelie & Roebie</span></header>
 <main className="rk-main rk-readable">
  <div className="rk-intro"><span className="rk-kicker">SAMEN ONTDEKKEN · REIS-DNA</span><h1>Een reis die op jullie lijkt<span>.</span></h1>
   <p>Jullie eerdere reisverhaal én een nieuw, beter gecontroleerd keuzeonderzoek. Kies iemand om te ontdekken wat de afwegingen zeggen — en wat we nog niet weten.</p></div>
  {error&&<p className="rk-error" role="alert">{error}</p>}
  {loading?<section className="rk-paper">Jullie antwoorden en rapport worden opgehaald…</section>:!data?<section className="rk-paper"><p>Log in met je bestaande account.</p><Link href="/" className="rk-button">Naar het reisboekje</Link></section>:
  <>
   <section className="rk-paper">
    <span className="rk-kicker">UIT JULLIE EERDERE REISRAPPORT</span><h2>Dit verhaal hebben jullie al samen gemaakt.</h2>
    {report?.hasData?<><div className="rk-report-prose"><p>{report.summary}</p><p>{report.discovery}</p></div>
      {report.vignette&&<div className="rk-report-vignette"><BookOpen size={20}/><p>{report.vignette}</p></div>}
      <div className="rk-progress"><div><strong>{report.completed}</strong><span>gezamenlijke oude dilemma's</span></div><div><strong>{report.matched}</strong><span>keer hetzelfde gekozen</span></div><div><strong>{report.agreement===null?'—':report.agreement+'%'}</strong><span>speelse overeenstemming</span></div></div>
      <p className="rk-muted">{report.week?'Bewaard rapport van de week '+report.week+'.':'Samenvatting opnieuw opgebouwd uit jullie bestaande antwoorden.'} {report.methodologicalCaveat}</p>
     </>:<><p>Jullie oude rapport heeft nog weinig gezamenlijke antwoorden. Het nieuwe onderzoek kan onafhankelijk beginnen.</p><p className="rk-muted">Als jullie eerder een rapport hebben bewaard, verschijnt het hier zodra die gegevens beschikbaar zijn.</p></>}
   </section>
   <section className="rk-paper">
     <span className="rk-kicker">EEN ECHT EXPERIMENTEEL ONTWERP</span><h2>Zo leren we jullie eerlijker kennen.</h2>
     <div className="rk-progress"><div><strong>{data.study.estimation}</strong><span>nieuwe schattingskeuzes</span></div><div><strong>{data.study.reserved}</strong><span>aparte controlevragen</span></div><div><strong>{data.study.total-data.study.answered}</strong><span>nieuwe vergelijkingen te gaan</span></div></div>
     <p>De nieuwe vragenbank heeft zes kenmerken, telkens drie vooraf gekozen niveaus. De alternatieven zijn zo samengesteld dat geen enkele optie overal beter is. De volgende vraag probeert onzekerheid te verkleinen; zes vragen zijn vooraf apart gezet voor een voorspellingstoets.</p>
     <div className="rk-science-stat"><span>Ontwerpversie: {data.study.version}</span><span>{data.study.design.fullRank?'Alle zes kenmerken afzonderlijk schatbaar in het totale ontwerp':'Ontwerp is nog niet identificeerbaar'}</span></div>
     <p className="rk-muted">Dit is een reproduceerbaar onderzoeksontwerp, geen onafhankelijk gevalideerd onderzoek. Het oude rapport helpt bepalen welke thema's nog interessant zijn, maar telt niet als nieuw conjointbewijs.</p>
   </section>
   <div className="rk-people" aria-label="Kies de reiziger">{people.map(p=><button key={p.id} aria-pressed={person?.id===p.id} className={'rk-person '+(person?.id===p.id?'rk-person-current':'')} onClick={()=>setSelected(p.id)}><Avatar id={p.avatar} size={44}/><span>{p.name}</span></button>)}</div>
   {person&&<section className="rk-paper">
    <span className="rk-kicker">PERSOONLIJK KEUZEPROFIEL</span><h2>Wat weegt voor {person.name} het zwaarst?</h2>
    <p className="rk-muted">{person.observations} nieuwe schattingskeuzes. Positief betekent: relatief meer aantrekkingskracht van dit kenmerk, rekening houdend met de andere kenmerken in de vergelijking.</p>
    {person.ranking.length?<ol className="rk-ranking">{person.ranking.map((item,i)=><li key={item.key}><span className="rk-rank-number">{i+1}</span><div className="rk-rank-data">
      <div className="rk-rank-head"><strong>{item.label}</strong><span>{item.sign==='positive'?'Voorlopig positief':item.sign==='negative'?'Voorlopig negatief':'Nog onduidelijk'}</span></div>
      <div className="rk-rank-track rk-rank-zero"><div style={{width:(Math.min(100,Math.max(0,(item.estimate+2)/4*100)))+'%'}}/></div>
      <small>Geschat gewicht {item.estimate.toFixed(2)} · 90%-benaderingsinterval [{item.lower.toFixed(2)}, {item.upper.toFixed(2)}]</small>
     </div></li>)}</ol>:<p className="rk-wait">Er zijn nog minimaal vijf nieuwe gezamenlijke schattingsvragen nodig voordat hier een voorlopige rangorde verschijnt. Tot die tijd verzinnen we geen wetenschappelijke ranking.</p>}
    {person.legacyRanking.length>0&&<div className="rk-legacy-profile"><h3>Wat de oudere keuzevragen al suggereerden</h3><p className="rk-muted">Deze vroegere, minder gecontroleerde vragen zijn een gesprekstarter. Ze worden niet gemengd met de nieuwe wetenschappelijke schatting.</p><div className="rk-legacy-tags">{person.legacyRanking.slice(0,3).map(item=><span key={item.key}>{item.label} · {item.signal==='voorlopig'?'voorzichtig signaal':'onzeker'}</span>)}</div></div>}
   </section>}
   {person&&<section className="rk-paper"><BarChart3 size={24}/><h2>Kunnen we nieuwe antwoorden voorspellen?</h2>
    {person.diagnostics.brier===null?<p>{person.diagnostics.label}</p>:<><p>Van de {person.diagnostics.heldOut} apart gehouden vergelijkingen heeft het model een gemiddelde <strong>Brier-score van {person.diagnostics.brier.toFixed(3)}</strong>.</p>
    <p>Een ongeïnformeerde 50/50-gok scoort 0,250. Lager is beter. {person.diagnostics.label}</p></>}
    <p className="rk-muted">De aparte controlevragen worden niet voor het fitten van het profiel gebruikt. Met twee deelnemers en weinig antwoorden is dit nog geen externe of populatievalidatie.</p>
   </section>}
   <section className="rk-paper"><span className="rk-kicker">WAT JULLIE SAMEN ONTDEKKEN</span><h2>Waar jullie op één lijn zitten — en waar nog niet.</h2>
    <div className="rk-progress"><div><strong>{data.funFacts.same}</strong><span>keer hetzelfde gekozen</span></div><div><strong>{data.funFacts.different}</strong><span>keer anders gekozen</span></div><div><strong>{data.completed}</strong><span>alle gezamenlijke keuzes</span></div></div>
    {data.lastReveal&&<p>Jullie laatste afweging: <strong>{data.lastReveal.question}</strong>.</p>}
   </section>
   <section className="rk-paper"><BrainCircuit size={23}/><h2>Waarom juist die volgende vraag?</h2>
    <p>Het systeem weegt mee over welke kenmerken jullie nog weinig verteld hebben en welke vragen informatie toevoegen aan beide persoonlijke modellen. Het oude reisrapport kan thema's aanwijzen die jullie nog verder willen onderzoeken.</p>
    <div className="rk-explainer"><Info size={19}/><div><strong>Wat we niet kunnen claimen</strong><p>De vragen zijn kwantitatief ontworpen en apart getest, maar gebruikersonderzoek, controle op begrijpelijkheid en een externe validatieset ontbreken nog. De gekozen kenmerken en niveaus zijn een onderzoeksaanname, geen universele waarheid over reizen.</p></div></div>
   </section>
   <div className="rk-footerlinks"><Link href="/reisvragen"><TrendingUp size={17}/> Beantwoord de volgende vraag <ArrowRight size={17}/></Link><Link href="/reiskantoor">Wat betekent dit voor jullie reis? <ArrowRight size={17}/></Link></div>
  </>}
 </main></div>;
}
