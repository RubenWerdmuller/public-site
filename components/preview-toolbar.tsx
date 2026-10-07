'use client';
import { useState } from 'react';
import Link from 'next/link';
import { Bell, RotateCcw, MessageSquare, X } from 'lucide-react';
import { Avatar } from './illustrations';
import { CHARACTERS, type CharacterId } from '@/lib/characters';
import type { PreviewState } from '@/lib/demo';

export function PreviewToolbar({state,onSwitch,onReset,onCap,onNotification,onReport,onNextWeek}: {state:PreviewState;onSwitch:(id:CharacterId)=>void;onReset:()=>void;onCap:()=>void;onNotification:()=>void;onReport:()=>void;onNextWeek:()=>void}) {
  const [review,setReview] = useState(false);
  const [notes,setNotes] = useState('');
  return <>
    <section className="preview-toolbar" aria-label="Testmodus">
      <div className="preview-caption"><span>Testmodus · niets wordt opgeslagen</span></div>
      <div className="preview-personas" role="group" aria-label="Wie probeert de app?">{Object.values(CHARACTERS).map(person => <button key={person.id} aria-label={`Speel als ${person.name}`} aria-pressed={state.active === person.id} onClick={()=>onSwitch(person.id)}><Avatar id={person.id === 'roebie' && !state.roebieCap ? CHARACTERS.roebie.withoutCapAvatar : person.avatar} size={28}/><span>{person.name}</span></button>)}</div>
      <details className="preview-options"><summary>Testopties</summary><div className="preview-actions"><button onClick={onNotification}><Bell size={15}/>Test berichtje</button><button onClick={onReport}>Voorbeeldweek</button><button onClick={onNextWeek}>Volgende week</button><button onClick={onCap} aria-pressed={state.roebieCap}>{state.roebieCap?'Pet af':'Pet op'}</button><button onClick={()=>setReview(!review)} aria-expanded={review}><MessageSquare size={15}/>Bespreken</button><button onClick={()=>{setNotes('');onReset();}}><RotateCcw size={15}/>Opnieuw</button><Link href="/">Uit testmodus</Link></div></details>
    </section>
    {review && <section className="preview-review paper" aria-label="Samen bespreken"><button className="modal-close" aria-label="Bespreken sluiten" onClick={()=>setReview(false)}><X size={18}/></button><h2>Hoe voelt dit voor jullie?</h2><p>Bespreek het per scherm: snap je meteen wat je kunt doen? Voelt de vraag leuk? Is de reveal duidelijk? Wat mis je?</p><label>Krabbels voor deze testronde<textarea value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Bijvoorbeeld: de vraag mag korter, de poppetjes mogen groter…"/></label><p>Ook deze krabbels verdwijnen bij opnieuw laden of ‘Opnieuw’. Kopieer ze zelf als je ze met ons wilt bespreken.</p></section>}
  </>;
}
