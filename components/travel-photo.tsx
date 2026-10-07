import Image from 'next/image';
import photos from '@/lib/photo-library.json';
import { Landscape } from './illustrations';
import type { Option } from '@/lib/domain';
export function TravelPhoto({option,questionId,index}:{option:Option;questionId:string;index:number}) {
  const theme=option.art==='mountain'?'hiking':option.art==='house'?'coffee':option.art;
  const matches=photos.filter(p=>p.theme===theme);
  const seed=Number(questionId.slice(1))+index;
  const photo=matches[seed%matches.length];
  return photo?<div className="travel-photo"><Image src={photo.file} alt="" width={960} height={640} loading="eager" sizes="(max-width: 550px) 90vw, 40vw"/><span className="photo-tape"/></div>:<Landscape kind={option.art}/>;
}
