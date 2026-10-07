import {createECDH,timingSafeEqual} from 'node:crypto';
export function pushReadiness(env:Record<string,string|undefined>=process.env){
 const missing:string[]=[];
 const publicKey=env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,privateKey=env.VAPID_PRIVATE_KEY;
 if(!publicKey)missing.push('NEXT_PUBLIC_VAPID_PUBLIC_KEY');
 if(!privateKey)missing.push('VAPID_PRIVATE_KEY');
 if(publicKey&&privateKey){try{const curve=createECDH('prime256v1');curve.setPrivateKey(Buffer.from(privateKey,'base64url'));const actual=curve.getPublicKey(),expected=Buffer.from(publicKey,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))missing.push('VAPID_KEY_PAIR');}catch{missing.push('VAPID_KEY_PAIR');}}
 const subject=env.VAPID_SUBJECT;
 if(!subject||!URL.canParse(subject)||!['https:','mailto:'].includes(new URL(subject).protocol))missing.push('VAPID_SUBJECT');
 if(!env.CRON_SECRET||env.CRON_SECRET.length<32)missing.push('CRON_SECRET');
 return {ready:missing.length===0,missing};
}
