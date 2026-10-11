'use client';
import Link from 'next/link';
import {BookOpen,Home,Settings} from 'lucide-react';

/** One source of truth for destinations, icons, order and selected state. */
export type PrimaryDestination='today'|'vragen'|'settings';
export type PrimaryNavVariant='sidebar'|'mobile'|'footer';
const destinations=[
 {id:'today',label:'Home',href:'/',Icon:Home},
 {id:'vragen',label:'Vragen',href:'/vragen',Icon:BookOpen},
 {id:'settings',label:'Instellingen',href:'/?screen=settings',Icon:Settings},
] as const;

export function PrimaryNavigation({
 current,variant='footer',demo=false,onNavigate,
}:{
 current?:PrimaryDestination|null;
 variant?:PrimaryNavVariant;
 demo?:boolean;
 onNavigate?:(destination:'today'|'settings')=>void;
}){
 return <nav className={`app-primary-nav app-primary-nav--${variant} ${variant==='mobile'?'mobile-nav':variant==='footer'?'site-nav':''}`}
  aria-label={variant==='mobile'?'Mobiele navigatie':'Hoofdnavigatie'}>
  <div className={variant==='footer'?'site-nav-links':'app-primary-nav-links'}>
   {destinations.map(({id,label,href,Icon})=><Link
    key={id}
    href={demo&&id!=='vragen'?(id==='today'?'/test':'/test?screen=settings'):href}
    className={`app-primary-nav-link ${current===id?'app-primary-nav-link--active':''} ${variant==='footer'&&current===id?'site-nav-selected':''}`}
    aria-current={current===id?'page':undefined}
    onClick={event=>{
     if(onNavigate&&(id==='today'||id==='settings')){
      event.preventDefault();
      onNavigate(id);
     }
    }}
   ><Icon size={20} aria-hidden="true"/><span>{label}</span></Link>)}
  </div>
 </nav>;
}
