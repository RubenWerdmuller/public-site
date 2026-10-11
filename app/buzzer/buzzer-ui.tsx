'use client';
import {useState} from 'react';
import {BellRing} from 'lucide-react';
import {SiteNavigation} from '@/components/site-navigation';
import '../reiskantoor/reiskantoor.css';
export function Buzzer({embedded=false}:{embedded?:boolean}){
 const [sending,setSending]=useState(false);
 const [feedback,setFeedback]=useState('');
 const [error,setError]=useState('');
 async function buzz(){
  if(sending)return;
  setSending(true);setFeedback('');setError('');
  try{
   const res=await fetch('/api/buzzer',{method:'POST',headers:{'Content-Type':'application/json'}});
   const data=await res.json();
   if(!res.ok)throw Error(data.error??'Buzzer niet verzonden.');
   setFeedback('Buzzer verstuurd!');
  }catch(e){setError(e instanceof Error?e.message:'Buzzer niet verzonden.');}
  finally{setSending(false);}
 }
 return <div className={'rk-shell'+(embedded?' rk-embedded':'')}>
  {!embedded&&<SiteNavigation current="/buzzer"/>}
  <main className="rk-main rk-buzzer-page">
   <button type="button" disabled={sending} className="rk-buzzer-button" onClick={()=>void buzz()}
    aria-label="Stuur Buzzer naar je reisgenoot">
    <BellRing size={44} strokeWidth={1.7} aria-hidden="true"/>
    <span>Buzzer</span>
   </button>
   {feedback&&<p className="rk-buzzer-feedback" role="status">{feedback}</p>}
   {error&&<p className="rk-error" role="alert">{error}</p>}
  </main>
 </div>;
}
