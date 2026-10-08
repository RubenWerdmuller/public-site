import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Samen op reis — kleine keuzes, groot avontuur',description:'Een dagelijks reisspelletje voor twee. Ontdek samen waar jullie volgende avontuur begint.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:[{url:'/apple-touch-icon.png?v=2',sizes:'180x180',type:'image/png'}]},appleWebApp:{capable:true,statusBarStyle:'default',title:'Samen op reis'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#f7f5ed'};
export default function Layout({children}:{children:React.ReactNode}) { return <html lang="nl"><body>{children}</body></html>; }
