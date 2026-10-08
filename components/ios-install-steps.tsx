import {useState} from 'react';
import {Share} from 'lucide-react';
import type {InstallBrowser} from '@/lib/install-browser';
const names:Record<InstallBrowser,string>={unknown:'Andere browser',ecosia:'Ecosia',safari:'Safari',chrome:'Chrome',firefox:'Firefox',edge:'Edge'};
export function IosInstallSteps({browser}:{browser:InstallBrowser}){
 const [chosen,setChosen]=useState<InstallBrowser|null>(null);
 const active=chosen??browser;
 return <>
  <label>Welke browser gebruik je?<select value={active} onChange={event=>setChosen(event.target.value as InstallBrowser)}>{Object.entries(names).map(([value,name])=><option key={value} value={value}>{name}</option>)}</select></label>
  <ol>
   <li>{active==='unknown'?'Open deze website in je browser op je iPhone of iPad.':`Open deze website in ${names[active]} op je iPhone of iPad.`}</li>
   <li>{active==='ecosia'?<>Tik in Ecosia op Delen <Share size={18} aria-hidden="true"/>, direct naast de adresbalk.</>:active==='chrome'?<>Tik in Chrome op Delen <Share size={18} aria-hidden="true"/> naast de adresbalk.</>:active==='safari'?<>Tik in Safari op Delen <Share size={18} aria-hidden="true"/>. Zie je de knop niet? Open het paginamenu bij de adresbalk en kies Delen.</>:<>Tik op Delen <Share size={18} aria-hidden="true"/> bij de adresbalk of in het browsermenu.</>}</li>
   <li>Kies ‘Zet op beginscherm’, laat ‘Open als webapp’ aan als je die optie ziet, en tik op ‘Voeg toe’.</li>
   <li>Open Samen op reis via het nieuwe icoon.</li>
  </ol>
  <p>Zie je ‘Zet op beginscherm’ niet? Scrol in het deelmenu omlaag. Ontbreekt de optie nog steeds, probeer dezelfde website in Safari.</p>
 </>;
}
