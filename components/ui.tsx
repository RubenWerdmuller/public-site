'use client';
import Link from 'next/link';
import type {ButtonHTMLAttributes,ReactNode} from 'react';

/** One action component; an href uses a semantic link, otherwise a native button. */
export function AppAction({variant='quiet',href,className='',children,type='button',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{
 variant?:'quiet'|'primary';href?:string;children?:ReactNode;
}){
 const classes=`${variant==='primary'?'rk-button':'rk-quiet'} ${className}`.trim();
 return href?<Link className={classes} href={href}>{children}</Link>:
  <button {...props} type={type} className={classes}>{children}</button>;
}

/** Both question flows use the same selectable answer surface and semantics. */
export function AnswerChoice({label,title,description,chosen=false,children,className='',type='button',...props}:ButtonHTMLAttributes<HTMLButtonElement>&{
 label:'A'|'B';title:string;description?:string;chosen?:boolean;children?:ReactNode;
}){
 return <button {...props} type={type} className={`rk-answer-tile ${chosen?'rk-answer-chosen':''} ${className}`.trim()}>
  <span className="rk-answer-label">{label}{chosen?' · jouw keuze ✓':''}</span>
  <strong>{title}</strong>
  {description&&<span>{description}</span>}
  {children}
 </button>;
}

const attributeLabels:Record<string,string>={
 budget:'Kosten samen per week',dwell:'Weken op één plek',drive:'Rijuren per reisdag',
 nature:'Natuur',comfort:'Comfort',community:'Ontmoetingen',
};
/** The six comparable DCE attributes are rendered identically in each flow. */
export function ChoiceAttributes<T extends object>({attributes,other}:{attributes:T;other:T}){
 const comparison=other as Record<string,unknown>;
 return <div className="rk-choice-attributes">
  {Object.entries(attributes).map(([key,value])=><div key={key} className={value!==comparison[key]?'rk-attr-difference':''}>
   <span>{attributeLabels[key]??key}</span>
   <strong>{key==='budget'?'€ ':''}{String(value)}{key==='budget'?'/week':''}{['nature','comfort','community'].includes(key)?' / 5':''}</strong>
  </div>)}
 </div>;
}

/** Small entry points on Home share one card structure. */
export function QuickAction({title,description,icon,onClick}:{
 title:string;description:string;icon:ReactNode;onClick:()=>void;
}){
 return <button className="home-action" type="button" onClick={onClick}>{icon}<strong>{title}</strong><span>{description}</span></button>;
}
