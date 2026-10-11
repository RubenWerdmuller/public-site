'use client';
import Link from 'next/link';
import {ArrowLeft} from 'lucide-react';
import {PrimaryNavigation,type PrimaryDestination} from './primary-navigation';

/** All stand-alone app pages share the same three-destination navigation. */
export function SiteNavigation({current}:{current?:string}){
 const destination:PrimaryDestination|null=current==='/vragen'?'vragen':current==='/'?'today':current==='/?screen=settings'?'settings':null;
 return <PrimaryNavigation variant="footer" current={destination}/>;
}

/** Reusable non-navigation heading for stand-alone report/legacy pages. */
export function SectionHeader(){
 return <header className="rk-top"><Link href="/" className="rk-back"><ArrowLeft size={17}/> Ons reisboekje</Link><span>Oelie & Roebie</span></header>;
}
