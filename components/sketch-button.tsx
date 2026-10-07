'use client';
import { useEffect, useRef, type ButtonHTMLAttributes } from 'react';
import rough from 'roughjs';
// Adapted from SketchUI's Rough.js button approach; fluid sizing and native button semantics.
export function SketchButton({children,className='',...props}:ButtonHTMLAttributes<HTMLButtonElement>) {
  const ref=useRef<SVGSVGElement>(null);
  useEffect(()=>{ const svg=ref.current; if(!svg)return; const draw=()=>{svg.replaceChildren(); const w=svg.clientWidth;const h=svg.clientHeight;svg.appendChild(rough.svg(svg).rectangle(3,3,w-6,h-6,{seed:42,roughness:1.2,stroke:'#354238',strokeWidth:1.4,fill:'#edca78',fillStyle:'solid'}));};draw();const observer=new ResizeObserver(draw);observer.observe(svg);return()=>observer.disconnect();},[]);
  return <button {...props} className={`sketch-button ${className}`}><svg ref={ref} aria-hidden="true"/><span>{children}</span></button>;
}
