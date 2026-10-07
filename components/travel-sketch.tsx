import rough from 'roughjs';
import { selectTravelSketch, travelSketches, type TravelSketch as Sketch } from '@/lib/travel-sketches';
const generator=rough.generator();
// Stable, precomputed pencil strokes: no effects, randomness on hydration, or image requests.
const drawings=new Map(travelSketches.map((sketch,scene)=>[sketch.id,sketch.paths.flatMap((path,index)=>generator.toPaths(generator.path(path.d,{seed:scene*101+index+1,roughness:.65,bowing:.7,stroke:'#354238',strokeWidth:1.7,fill:path.fill,fillStyle:'solid'})))]));
export function TravelSketchDrawing({sketch}:{sketch:Sketch}) {
 return <svg viewBox="40 10 320 195" fill="none" aria-hidden="true" className="landscape travel-sketch" data-sketch={sketch.id}><g stroke="#879b7c" strokeWidth="1.4" strokeLinecap="round"><path d="M45 190q84-9 155-2t153-2" opacity=".35"/><path d="m57 180-3-7m6 8 5-9m262 9 2-8m5 8 5-7" opacity=".5"/></g>{sketch.file&&<><defs><filter id={`pencil-${sketch.id}`} x="-10%" y="-10%" width="120%" height="120%"><feMorphology in="SourceAlpha" operator="erode" radius="0.55" result="thin"/><feComposite in="SourceGraphic" in2="thin" operator="in"/></filter></defs><path d="M122 132q-11-74 68-83 82-13 93 65 15 60-66 67-76 4-95-49z" fill={['surf','sailing'].includes(sketch.art)?'#d5e1e1':['alpaca','coffee','dance'].includes(sketch.art)?'#efe2b7':'#dce5d2'} opacity=".75"/><image filter={`url(#pencil-${sketch.id})`} href={sketch.file} x="126" y="42" width="150" height="134"/></>}{drawings.get(sketch.id)?.map((path,index)=><path key={index} d={path.d} stroke={path.stroke} strokeWidth={path.strokeWidth} fill={path.fill} strokeLinecap="round" strokeLinejoin="round"/>)}<g stroke="#d6ae54" strokeWidth="1.3" strokeLinecap="round" fill="none"><path d="m319 44 4-7 4 7-7-4h7m-22 19 2-4 2 4"/></g></svg>;
}

export function TravelSketch({option,questionId,index}:{option:import('@/lib/domain').Option;questionId:string;index:number}) {
 return <TravelSketchDrawing sketch={selectTravelSketch(option,questionId,index)}/>;
}
