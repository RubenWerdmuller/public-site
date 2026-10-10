'use client';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Compass,Route,RefreshCw,MapPin,Clock3} from 'lucide-react';
import {useTripExperience} from '@/components/trip-experience';
import './reiskantoor.css';
const formatCost=(cost:number)=>'€ '+cost.toLocaleString('nl-NL');
export function Reiskantoor(){
 const {data,loading,error,refresh}=useTripExperience();
 const travel=data?.travel;
 const plan=travel?.plan;
 return <div className="rk-shell">
  <header className="rk-top"><Link href="/" className="rk-back"><ArrowLeft size={17}/> Ons reisboekje</Link><span>Oelie & Roebie</span></header>
  <main className="rk-main">
   <div className="rk-intro"><span className="rk-kicker">HET RESULTAAT VAN JULLIE KEUZES</span><h1>Het Reiskantoor<span>.</span></h1>
     <p>Jullie hoeven hier niets in te vullen. De reis groeit uit de antwoorden van jullie allebei. Wat nog onzeker is, blijft open.</p></div>
   {error&&<p className="rk-error" role="alert">{error}</p>}
   {loading?<section className="rk-paper">Jullie gezamenlijke reis ophalen…</section>:!data?<section className="rk-paper"><h2>Open jullie gezamenlijke reisboekje</h2><p>Log in om jullie gedeelde resultaten te zien.</p><Link href="/" className="rk-button">Naar het reisboekje</Link></section>:
    <div className="rk-results">
     <section className="rk-paper">
      <div className="rk-section-head"><div><span className="rk-kicker">01 · WAAR STAAN WE?</span><h2>Een reis in wording.</h2></div><button className="rk-quiet" onClick={()=>void refresh()}><RefreshCw size={15}/> Vernieuw</button></div>
      <p>{travel?.confidenceLabel}</p>
      <div className="rk-progress"><div><strong>{data.completedStages} / {data.totalStageQuestions}</strong><span>etappevragen</span></div><div><strong>{data.completed}</strong><span>gezamenlijke keuzes</span></div></div>
      <Link href="/reisvragen" className="rk-button">Verder met Reisvragen <ArrowRight size={17}/></Link>
     </section>
     {plan?<section className="rk-paper"><span className="rk-kicker">02 · VOORLOPIGE REISINDELING</span><h2>Zo verdelen jullie de weken.</h2>
       <div className="rk-metrics"><div><strong>{plan.weeks}</strong><span>weken totale reisduur</span></div><div><strong>{plan.stages.length}</strong><span>etappes</span></div><div><strong>Open</strong><span>definitieve bestemmingen</span></div></div>
       <div className="rk-bars">{plan.stages.map((stage,i)=><div key={stage.id} className={'rk-bar rk-tone-'+i%4} style={{flex:Math.max(1,stage.idealWeeks)}} title={stage.name+': '+stage.idealWeeks+' weken'}/>)}</div>
       <ol className="rk-result-stages">{plan.stages.map((stage,i)=><li key={stage.id}>
         <span className={'rk-stage-marker rk-tone-'+i%4}>{i+1}</span><div><strong>{stage.name}</strong><p>{stage.region}</p>
           <small><Clock3 size={13}/> {stage.idealWeeks} {stage.idealWeeks===1?'week':'weken'} als voorlopig gezamenlijk compromis</small>
         </div></li>)}</ol>
       <p className="rk-muted">De getoonde weken zijn afgeleid uit jullie antwoorden. Bij verschillen neemt de eerste berekening het midden; dit is geen bevestigde afspraak of geboekte route.</p>
      </section>:<section className="rk-paper rk-skeleton-result"><Route size={31}/><h2>De etappes ontstaan vanzelf.</h2><p>Beantwoord eerst samen de vragen over totale duur, heenreis, terugreis en hoe vaak jullie ergens willen landen. Daarna verschijnt hier een verdeling, zonder dat je handmatig een reis invult.</p><Link href="/reisvragen">Verder met de reisvragen <ArrowRight size={17}/></Link></section>}
     {travel?.disagreements.length?<section className="rk-paper"><span className="rk-kicker">03 · LEUKE ONTDEKKINGEN</span><h2>Hier is nog iets te bespreken.</h2><ul className="rk-warnings">{travel.disagreements.map(d=><li key={d}>{d}</li>)}</ul><p className="rk-muted">Een verschil is geen probleem: het helpt bepalen welke vervolgvraag nuttig is.</p></section>:null}
     {travel?.routeIdeas.length?<section className="rk-paper"><span className="rk-kicker">04 · EERSTE RICHTING</span><h2>Een mogelijke routefamilie.</h2><ul className="rk-warnings">{travel.routeIdeas.map(r=><li key={r}><MapPin size={15}/> {r}</li>)}</ul><p className="rk-muted">Dit zijn uitsluitend illustratieve corridors op basis van jullie gekozen richting. Er is nog geen controle op wegen, seizoenen, visumregels, afstanden, werkelijke kosten of beschikbaarheid.</p></section>:null}
     {plan&&travel?.proposals.length?<section className="rk-paper"><span className="rk-kicker">05 · DE PLANNER REKENT MEE</span><h2>Drie tijdsverdelingen.</h2><div className="rk-proposals">{travel.proposals.map(proposal=><div key={proposal.id} className="rk-proposal">
       <h3>{proposal.title}</h3><div className="rk-proposal-line">{plan.stages.map((stage,i)=><div key={stage.id}><span>{stage.name}</span><strong>{proposal.weeks[i]} weken</strong></div>)}</div>
       {proposal.cost!==null&&<p>Opgegeven raming: {formatCost(proposal.cost)}</p>}
       <p className="rk-muted">{proposal.cost===null?'Nog geen betrouwbare kostenraming.':'Kosten op basis van bekende uitgangspunten.'}</p>
     </div>)}</div><p className="rk-muted">Rekenkundige scenario’s, geen bewezen beste route. De volledige reisplanning wordt pas concreet wanneer ook echte bestemmingseigenschappen, reisdagen en actuele prijzen bekend zijn.</p></section>:null}
     {travel?.warnings.length?<section className="rk-paper"><Compass size={21}/><h2>Wat we nog niet weten.</h2><ul className="rk-warnings">{travel.warnings.map(w=><li key={w}>{w}</li>)}</ul></section>:null}
     <div className="rk-footerlinks"><Link href="/reisvragen">Beantwoord meer reisvragen <ArrowRight size={17}/></Link><Link href="/reis-dna">Bekijk wie wat belangrijk vindt <ArrowRight size={17}/></Link></div>
    </div>}
  </main>
 </div>;
}
