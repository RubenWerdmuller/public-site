'use client';
import {useCallback,useEffect,useState} from 'react';
import type {ChoiceTask,StageQuestion,Proposal,RankingItem,ModelDiagnostics} from '@/lib/reiskantoor';
import type {ScienceTravel} from '@/lib/itinerary-science';
export type TripExperience={
 paired:boolean;completed:number;completedStages:number;totalStageQuestions:number;answeredByMe:number;
 people:{id:string;name:string;avatar:number;observations:number;ranking:RankingItem[];diagnostics:ModelDiagnostics;message:string}[];
 choice:{ordinal:number;task:StageQuestion|ChoiceTask;own:0|1|null}|null;
 lastReveal:{question:string;own:0|1;partner:0|1}|null;
 travel:ScienceTravel & {proposals:Proposal[]};
 funFacts:{same:number;different:number};
 modelStatus:string;
};
export function useTripExperience(){
 const [data,setData]=useState<TripExperience|null>(null);
 const [busy,setBusy]=useState(false);
 const [loading,setLoading]=useState(true);
 const [error,setError]=useState('');
 const refresh=useCallback(async()=>{
   try{
     const response=await fetch('/api/reiskantoor',{cache:'no-store'});
     const json=await response.json();
     if(!response.ok)throw Error(json.error??'Reisgegevens ophalen lukt niet.');
     setData(json as TripExperience);setError('');
   }catch(e){setError(e instanceof Error?e.message:'Geen verbinding.');}
   finally{setLoading(false);}
 },[]);
 useEffect(()=>{queueMicrotask(()=>void refresh());},[refresh]);
 async function answer(ordinal:number,choice:0|1){
   if(busy)return;
   setBusy(true);setError('');
   try{
     const response=await fetch('/api/reiskantoor',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'answer',ordinal,choice})});
     const json=await response.json();
     if(!response.ok)throw Error(json.error??'Je keuze kon niet worden opgeslagen.');
     setData(json as TripExperience);
   }catch(e){setError(e instanceof Error?e.message:'Je keuze kon niet worden opgeslagen.');}
   finally{setBusy(false);}
 }
 return {data,busy,loading,error,refresh,answer};
}
