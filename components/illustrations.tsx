import { portrait } from '@/lib/characters';
export function Landscape({kind='mountain'}:{kind?:string}) {
  return <svg viewBox="0 0 400 210" fill="none" aria-hidden="true" className="landscape"><g stroke="#354238" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="307" cy="48" r="23" fill="#efce7e" stroke="none"/><path d="M287 19l-3-9m37 9 4-8m-45 40-10 2m65-2 11 3" stroke="#d6ae54"/>{kind==='mountain'?<><path d="M8 181 107 44 183 151 244 75 389 184" fill="#d4dfcf"/><path d="m74 89 33-45 32 44-19-7-14 9-10-11z" fill="#fffdf4"/><path d="m208 118 36-43 30 37-19-5-13 12-10-12" fill="#fffdf4"/><path d="M1 185c80-24 112-21 174 0s122 17 220-8"/><path d="M212 201c-5-18-56-17-63-35-5-13 25-16 18-28" strokeDasharray="5 7"/><path d="m29 146 13-30 13 30h-10v28m284-7 15-37 16 37h-13v22" fill="#87a184"/></>:<><path d="M20 188c63-27 113-23 177-5s126 6 195-5" fill="#d5dfcf"/><path d="m117 99 79-61 84 60-9 9H123z" fill="#bf725b"/><path d="M129 105v76h136v-75" fill="#f3e6ce"/><path d="M178 180v-49h37v49" fill="#d5bfa2"/><path d="M143 119h22v24h-22zm87 0h22v24h-22z" fill="#adc5bb"/><path d="M197 132v45m-43-57v22m-11-11h22m76-11v22m-11-11h22"/><path d="M243 70V41h18v41" fill="#bf725b"/><path d="M245 31c-9-12 15-15 5-27" strokeDasharray="4 5"/><path d="m43 162 14-37 16 37H61v22m256-15 14-42 20 42h-16v17" fill="#87a184"/></>}<path d="M6 204h388" opacity=".2"/></g></svg>;
}
export function Avatar({id=0,size=44}:{id?:number;size?:number}) {
  const person = portrait(id);
  return <svg width={size} height={size} viewBox="0 0 80 80" role="img" aria-label={person.name}>
    <circle cx="40" cy="40" r="37" fill={person.background}/>
    <g stroke="#384038" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path d="M18 72c2-21 42-22 45 0" fill={person.shirt}/>
      {person.hair==='long'&&<path d="M20 48c-7-23 2-38 20-38 21 0 28 18 21 40l-8 9H26z" fill={person.hairColor}/>}
      <path d="M23 31c-4 30 39 35 35 0-1-24-34-25-35 0" fill="#f7dbbb"/>
      {person.hair==='short'&&<path d="M21 33c-6-24 36-36 39-4-8 3-17-1-22-9-3 7-9 11-17 13" fill={person.hairColor}/>}
      {person.hair==='long'&&<path d="M22 31c-1-19 29-30 37-4-12-1-18-7-21-11-3 7-9 11-16 15" fill={person.hairColor}/>}
      {person.hair==='bald'&&!person.cap&&<path d="M29 22c4-6 14-7 20-2" stroke="#e7bd99"/>}
      <path d="M31 36v2m17-2v2m-12 13q6 4 12-2"/>
      {person.glasses&&<path d="M26 34h13v10H26zm16 0h13v10H42zm-3 3h3"/>}
      {person.beard&&<path d="M34 47q8 9 15-1" strokeWidth="4"/>}
      {person.cap&&<><path d="M21 29c-1-23 39-25 39-2l-14 3z" fill="#8c9d83"/><path d="M36 25c12-3 23-1 30 5-8 5-19 5-28 0z" fill="#a7b598"/><path d="M39 11v12" stroke="#687c5e"/></>}
    </g>
  </svg>;
}
