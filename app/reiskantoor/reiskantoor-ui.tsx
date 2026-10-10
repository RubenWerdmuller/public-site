'use client';
import Link from 'next/link';
import {ArrowLeft,ArrowRight,Compass,Route,RefreshCw,MapPin,Clock3} from 'lucide-react';
import {useTripExperience} from '@/components/trip-experience';
import './reiskantoor.css';
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
       <p className="rk-muted">Deze indeling is een gezamenlijk, begrensd optimalisatiescenario. Het model beschermt de gekozen minimale lange verblijven, telt alle weken één keer en maakt afwegingen tussen de reisfasen. Het resultaat is nog niet geboekt en zegt niets over exacte rijtijden.</p>
      </section>:<section className="rk-paper rk-skeleton-result"><Route size={31}/><h2>De etappes ontstaan vanzelf.</h2><p>Beantwoord eerst samen de vragen over totale duur, heenreis, terugreis en hoe vaak jullie ergens willen landen. Daarna verschijnt hier een verdeling, zonder dat je handmatig een reis invult.</p><Link href="/reisvragen">Verder met de reisvragen <ArrowRight size={17}/></Link></section>}
     {travel?.disagreements.length?<section className="rk-paper"><span className="rk-kicker">03 · VERSCHILLEN TUSSEN JULLIE</span><h2>Hier is nog iets te bespreken.</h2><ul className="rk-warnings">{travel.disagreements.map(d=><li key={d}>{d}</li>)}</ul><p className="rk-muted">Een verschil is geen probleem: het helpt bepalen welke vervolgvraag nuttig is.</p></section>:null}
     {travel?.routeIdeas.length?<section className="rk-paper"><span className="rk-kicker">04 · EERSTE RICHTING</span><h2>Een mogelijke routefamilie.</h2><ul className="rk-warnings">{travel.routeIdeas.map(r=><li key={r}><MapPin size={15}/> {r}</li>)}</ul><p className="rk-muted">Dit zijn uitsluitend illustratieve corridors op basis van jullie gekozen richting. Er is nog geen controle op wegen, seizoenen, visumregels, afstanden, werkelijke kosten of beschikbaarheid.</p></section>:null}
     {travel?.legs.length?<section className="rk-paper"><span className="rk-kicker">05 · BINNEN DE HEEN- EN TERUGREIS</span><h2>Ook onderweg heb je tijd nodig.</h2>
      <div className="rk-proposals">{travel.legs.map(leg=><div key={leg.stageId} className="rk-proposal">
        <h3>{leg.stageName} · {leg.days} dagen</h3>
        {leg.requestedStops!==null?<p>{leg.requestedStops} gewenste tussenstops{leg.preferredStopDays!==null?', gemiddeld '+leg.preferredStopDays+' dagen per stop':''}.</p>:<p className="rk-muted">Aantal stops nog niet uit jullie gezamenlijke vragen afgeleid.</p>}
        {leg.stops.length>0&&<div className="rk-proposal-line">{leg.stops.map(stop=><div key={stop.id}><span>{stop.title}</span><strong>{stop.days} dagen</strong></div>)}</div>}
        {leg.transitAllowanceDays!==null&&<p>Minimaal {leg.transitAllowanceDays} vrije planningsdagen voor verplaatsingen. Geen berekende rijtijd.</p>}
        {leg.unallocatedDays!==null&&<p className={leg.unallocatedDays<0?'rk-error':'rk-muted'}>{leg.unallocatedDays>=0?leg.unallocatedDays+' dagen nog vrij voor andere activiteiten, extra rust of werkelijke reistijd.':Math.abs(leg.unallocatedDays)+' dagen tekort: deze stopwensen passen niet in deze etappe.'}</p>}
        {leg.openQuestions.length>0&&<p className="rk-muted">Nog te ontdekken: {leg.openQuestions.join(' ')}</p>}
       </div>)}</div>
      <p className="rk-muted">De subetappes zijn verbonden aan hun reisfase: een tussenstop voegt nooit weken toe aan de totale reis. Plaatsen en rijroutes worden in een latere, gecontroleerde AI-fase bepaald.</p>
     </section>:null}
     {travel?.ideas.length?<section className="rk-paper"><span className="rk-kicker">06 · PASSENDE SOORTEN VERBLIJF</span><h2>Wat jullie er kunnen doen.</h2><ul className="rk-warnings">{travel.ideas.map(idea=><li key={idea}>{idea}</li>)}</ul>
       <p className="rk-muted">Dit zijn verblijfs- en activiteitstypen afgeleid uit jullie keuzes, geen echte, beschikbare accommodaties.</p></section>:null}
     {travel?.alternatives.length?<section className="rk-paper"><span className="rk-kicker">07 · ALLES HANGT SAMEN</span><h2>Vergelijk meerdere complete reizen.</h2>
       <div className="rk-proposals">{travel.alternatives.map(option=><div key={option.id} className="rk-proposal">
         <h3>{option.title} · {option.plan.weeks} weken</h3>
         <div className="rk-proposal-line">{option.plan.stages.map(stage=><div key={stage.id}><span>{stage.name}</span><strong>{stage.idealWeeks} weken</strong></div>)}</div>
         <p className="rk-muted">{option.reason}</p>
         {option.tradeoffs.map(t=><p key={t} className="rk-muted">Afweging: {t}</p>)}
       </div>)}</div>
       <p className="rk-muted">Elke complete variant heeft een eigen tijdsverdeling en dezelfde bewuste beperkingen. Het zijn mogelijke scenario’s, geen boekbare routes of gevalideerde ranglijsten.</p>
     </section>:null}
     {travel?.conflicts.length?<section className="rk-paper"><span className="rk-kicker">08 · CONFLICTEN IN DE PLANNING</span><h2>Waar de keuzes botsen.</h2>
      <ul className="rk-warnings">{travel.conflicts.map(c=><li key={c}>{c}</li>)}</ul>
      <p className="rk-muted">Deze vragen krijgen extra aandacht in de volgende iteratie. Er wordt geen minimum ingekort zonder dat zichtbaar te maken.</p></section>:null}
     {travel?.method.futureAiInput.length?<section className="rk-paper"><span className="rk-kicker">09 · DE LATERE AI-REISMAKER</span><h2>Wat nog echte data nodig heeft.</h2>
       <ul className="rk-warnings">{travel.method.futureAiInput.map(input=><li key={input.kind}>{input.kind} · nog niet gekoppeld</li>)}</ul>
       <p className="rk-muted">De AI kan straks bestemmingen rangschikken binnen deze randvoorwaarden, met controleerbare herkomst voor routes, prijzen en beschikbaarheid. Dat gebeurt nu nog niet.</p>
      </section>:null}
     {travel?.warnings.length?<section className="rk-paper"><Compass size={21}/><h2>Nog niet geverifieerd.</h2><ul className="rk-warnings">{travel.warnings.map(w=><li key={w}>{w}</li>)}</ul></section>:null}
     <div className="rk-footerlinks"><Link href="/reisvragen">Beantwoord meer reisvragen <ArrowRight size={17}/></Link><Link href="/reis-dna">Bekijk wie wat belangrijk vindt <ArrowRight size={17}/></Link></div>
    </div>}
  </main>
 </div>;
}
