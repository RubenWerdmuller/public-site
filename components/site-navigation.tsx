'use client';
import Link from 'next/link';
import {BookOpen,Compass,Home,Settings} from 'lucide-react';
/** The three primary destinations; extra actions live on Home. */
const destinations=[
 {href:'/',label:'Home',Icon:Home},
 {href:'/vragen',label:'Vragen',Icon:BookOpen},
 {href:'/?screen=settings',label:'Instellingen',Icon:Settings},
];
export function SiteNavigation({current}:{current?:string}){
 return <nav className="site-nav" aria-label="Hoofdnavigatie">
  <span className="site-nav-brand"><Compass size={18}/> Oelie & Roebie</span>
  <div className="site-nav-links">{destinations.map(({href,label,Icon})=><Link key={href} href={href}
   aria-current={current===href?'page':undefined} className={current===href?'site-nav-selected':''}>
   <Icon size={16}/><span>{label}</span>
  </Link>)}</div>
 </nav>;
}
