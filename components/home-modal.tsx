'use client';
import {useEffect,useId,useRef,type ReactNode} from 'react';
import {X} from 'lucide-react';

/** Native dialog keeps keyboard focus inside and restores it on close. */
export function HomeModal({open,title,onClose,children,wide=false}:{open:boolean;title:string;onClose:()=>void;children:ReactNode;wide?:boolean}){
 const dialogRef=useRef<HTMLDialogElement>(null);
 const titleId=useId();
 useEffect(()=>{
  const dialog=dialogRef.current;
  if(!dialog)return;
  if(open&&!dialog.open)dialog.showModal();
  if(!open&&dialog.open)dialog.close();
 },[open]);
 useEffect(()=>{
  if(!open)return;
  const previous=document.body.style.overflow;
  document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=previous;};
 },[open]);
 return <dialog ref={dialogRef} aria-labelledby={titleId} className={'home-dialog'+(wide?' home-dialog-wide':'')} onClose={onClose} onClick={event=>{if(event.target===event.currentTarget)onClose();}}>
  <div className="home-dialog-inner">
   <header className="home-dialog-head"><h2 id={titleId}>{title}</h2><button type="button" className="home-dialog-close" aria-label="Venster sluiten" onClick={onClose}><X size={20}/></button></header>
   <div className="home-dialog-body">{children}</div>
  </div>
 </dialog>;
}
