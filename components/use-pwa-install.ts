import {useEffect,useState} from 'react';
import {installBrowser,type InstallBrowser} from '@/lib/install-browser';
type Choice={outcome:'accepted'|'dismissed'};
type InstallPrompt=Event & {prompt:()=>Promise<Choice|void>;userChoice?:Promise<Choice>};
export function usePwaInstall(demo:boolean){
 const [pending,setPending]=useState<InstallPrompt|null>(null);
 const [installed,setInstalled]=useState(false);
 const [ios,setIos]=useState(false);
 const [browser,setBrowser]=useState<InstallBrowser>('unknown');
 const [installing,setInstalling]=useState(false);
 useEffect(()=>{
  const display=window.matchMedia('(display-mode: standalone)');
  const check=()=>setInstalled(display.matches||Boolean((navigator as Navigator & {standalone?:boolean}).standalone));
  queueMicrotask(()=>{check();setBrowser(installBrowser(navigator.userAgent));setIos(/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1));});
  if(demo)return;
  const capture=(event:Event)=>{event.preventDefault();setPending(event as InstallPrompt);};
  const complete=()=>{setInstalled(true);setPending(null);};
  window.addEventListener('beforeinstallprompt',capture);window.addEventListener('appinstalled',complete);display.addEventListener('change',check);
  return()=>{window.removeEventListener('beforeinstallprompt',capture);window.removeEventListener('appinstalled',complete);display.removeEventListener('change',check);};
 },[demo]);
 async function requestInstall(){
  if(demo)return 'demo' as const;
  if(installed)return 'installed' as const;
  if(!pending)return 'manual' as const;
  const prompt=pending;setPending(null);setInstalling(true);
  try{const result=await prompt.prompt();const choice=result??await prompt.userChoice;return choice?.outcome??'dismissed';}
  finally{setInstalling(false);}
 }
 return {installed,ios,browser,installing,canPrompt:!!pending,requestInstall};
}
