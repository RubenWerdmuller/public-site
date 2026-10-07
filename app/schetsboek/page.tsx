import Link from 'next/link';
import { TravelSketchDrawing } from '@/components/travel-sketch';
import { travelSketches } from '@/lib/travel-sketches';
export default function Sketchbook(){return <main className="sketchbook"><Link href="/test">← Terug naar proefreizen</Link><span className="eyebrow">KLEINE TEKENINGEN, GROTE PLANNEN</span><h1>Ons schetsboek.</h1><p>{travelSketches.length} losse schetsjes voor onderweg. Van een zeildroom tot een bijzonder eigenwijze gans.</p><div className="sketch-gallery">{travelSketches.map(sketch=><figure key={sketch.id}><TravelSketchDrawing sketch={sketch}/><figcaption>{sketch.title}</figcaption></figure>)}</div><Link href="/">Naar ons boekje →</Link></main>;}
