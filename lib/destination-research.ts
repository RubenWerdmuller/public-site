/**
 * Future AI destination-research boundary.
 *
 * This module deliberately has no connected search or booking provider.
 * An LLM may suggest questions/candidates, but may NOT create VerifiedTripOffers
 * without original provider evidence, a complete connected route, and a date.
 */
export type Evidence={sourceUrl:string;checkedAt:string;provider:string};
export type GeocodedPlace={id:string;name:string;country:string;lat:number;lon:number;evidence:Evidence};
export type GroundedTravelLeg={fromId:string;toId:string;estimatedMinutes:number;travelMode:'car';evidence:Evidence};
export type GroundedStay={placeId:string;startDate:string;endDate:string;available:boolean|null;
  priceEuro:number|null;priceEvidence:Evidence|null;availabilityEvidence:Evidence|null};
export type VerifiedTripOffer={
 id:string;name:string;places:GeocodedPlace[];
 legs:GroundedTravelLeg[];stays:GroundedStay[];
 sourceType:'connected_provider';createdByAi:boolean;
};
export type Validation={valid:boolean;issues:string[];isBookable:boolean;providerConfirmed:boolean};
export function verifyTripOffer(offer:VerifiedTripOffer,checkedOn:string,maxAgeDays=60):Validation{
 const issues:string[]=[];
 const now=Date.parse(checkedOn);
 if(!Number.isFinite(now))return {valid:false,issues:['Ongeldige evaluatiedatum.'],isBookable:false,providerConfirmed:false};
 const validEvidence=(item:Evidence|null|undefined,label:string)=>{
  if(!item||!item.provider.trim()||!/^https:\/\//i.test(item.sourceUrl)){issues.push(label+' heeft geen herleidbare https-bron.');return false;}
  const date=Date.parse(item.checkedAt);
  if(!Number.isFinite(date)||date>now+86400000||now-date>maxAgeDays*86400000){
   issues.push(label+' mist recente bronverificatie.');return false;
  }
  return true;
 };
 if(offer.sourceType!=='connected_provider')issues.push('AI-ideeën zijn geen geverifieerde aanbiedingen.');
 if(offer.places.length<2)issues.push('Een route heeft minimaal twee gegeocodeerde plekken nodig.');
 const ids=new Set(offer.places.map(p=>p.id));
 if(ids.size!==offer.places.length)issues.push('Plekken hebben niet-unieke identifiers.');
 for(const p of offer.places){
  if(!Number.isFinite(p.lat)||Math.abs(p.lat)>90||!Number.isFinite(p.lon)||Math.abs(p.lon)>180)issues.push('Plek '+p.id+' heeft ongeldige coördinaten.');
  validEvidence(p.evidence,'Plek '+p.id);
 }
 if(offer.legs.length!==Math.max(0,offer.places.length-1))issues.push('De reisroute bevat niet precies één verplaatsing tussen opeenvolgende plekken.');
 for(const [index,leg] of offer.legs.entries()){
  if(!ids.has(leg.fromId)||!ids.has(leg.toId)||leg.fromId!==offer.places[index]?.id||leg.toId!==offer.places[index+1]?.id)
   issues.push('De route is niet aaneengesloten bij verplaatsing '+(index+1)+'.');
  if(leg.travelMode!=='car'||!Number.isFinite(leg.estimatedMinutes)||leg.estimatedMinutes<=0)
   issues.push('De auto-reistijd mist een geldige geverifieerde raming.');
  validEvidence(leg.evidence,'Rijtijd '+(index+1));
 }
 for(const stay of offer.stays){
  if(!ids.has(stay.placeId))issues.push('Verblijf verwijst naar onbekende plek.');
  const start=Date.parse(stay.startDate),end=Date.parse(stay.endDate);
  if(!Number.isFinite(start)||!Number.isFinite(end)||end<=start)issues.push('Verblijf heeft ongeldige data.');
  if(stay.priceEuro!==null&&(!Number.isFinite(stay.priceEuro)||stay.priceEuro<0))issues.push('Ongeldige verblijfskosten.');
  if(stay.priceEuro!==null)validEvidence(stay.priceEvidence,'Verblijfskosten');
  if(stay.available!==null)validEvidence(stay.availabilityEvidence,'Beschikbaarheid');
 }
 // The present validator checks structure, time freshness and evidence *claims* only.
 // It cannot fetch records from providers and must never assert a bookable offer.
 return {valid:issues.length===0,issues,isBookable:false,providerConfirmed:false};
}
export function onlyVerifiedOffers(offers:VerifiedTripOffer[],checkedOn:string):VerifiedTripOffer[]{
 return offers.filter(offer=>verifyTripOffer(offer,checkedOn).valid);
}
