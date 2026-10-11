/** The partner only receives the single word Buzzer; no hidden message content. */
export const BUZZER_COOLDOWN_SECONDS=60;
export const BUZZER_TTL_SECONDS=90;
export const BUZZER_NOTIFICATION=Object.freeze({title:'Buzzer',body:'',url:'/buzzer'});
export function buzzerRecipient(senderId:string, members:{user_id:string}[]):string|null{
 if(members.length!==2||new Set(members.map(m=>m.user_id)).size!==2)return null;
 if(!members.some(m=>m.user_id===senderId))return null;
 return members.find(m=>m.user_id!==senderId)?.user_id??null;
}
export function isExpiredSubscription(status:number|undefined):boolean{
 return status===404||status===410;
}
