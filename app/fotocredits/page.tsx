import Link from 'next/link';
import Image from 'next/image';
import photos from '@/public/photos/credits.json';
export default function PhotoCredits(){return <main className="photo-credits"><Link href="/">← Terug naar ons boekje</Link><h1>Een wereld aan voorpret.</h1><p>{photos.length} sfeerbeelden voor onze dilemma’s. Ze illustreren een ervaring; ze beloven geen specifieke bestemming of verblijf. Gratis te gebruiken onder de <a href="https://unsplash.com/license">Unsplash License</a>. De bronpagina vermeldt de fotograaf.</p><div className="photo-gallery">{photos.map(p=><a href={p.source} key={p.id} target="_blank" rel="noreferrer"><Image src={p.file} alt={p.caption} width={480} height={320}/><span>{p.caption} ↗</span></a>)}</div></main>;}
