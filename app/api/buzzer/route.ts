import {NextRequest,NextResponse} from 'next/server';
import type webpush from 'web-push';
import {currentUser} from '@/lib/auth';
import {query} from '@/lib/db';
import {sendPush} from '@/lib/push';
import {pushReadiness} from '@/lib/push-config';
import {buzzerRecipient,isExpiredSubscription,BUZZER_NOTIFICATION,BUZZER_COOLDOWN_SECONDS,BUZZER_TTL_SECONDS} from '@/lib/buzzer';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const json=(value:unknown,status=200)=>NextResponse.json(value,{status,headers:{'Cache-Control':'no-store'}});
type Member={user_id:string}&Record<string,unknown>;
type Subscriber={endpoint:string;subscription:webpush.PushSubscription}&Record<string,unknown>;
type Claim={last_sent_at:Date}&Record<string,unknown>;
export async function POST(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin||!URL.canParse(origin)||new URL(origin).host!==req.headers.get('host'))
  return json({error:'Open de Buzzer vanuit de app.'},403);
 const user=await currentUser();
 if(!user)return json({error:'Log eerst in.'},401);
 if(!pushReadiness().ready)return json({error:'Notificaties zijn op dit moment niet beschikbaar.'},503);
 try{
  const members=await query<Member>('SELECT user_id FROM memberships WHERE pair_id=$1 ORDER BY slot',[user.pair_id]);
  const recipient=buzzerRecipient(user.id,members);
  if(!recipient)return json({error:'Koppel eerst je reisgenoot om te buzzeren.'},409);
  const subs=await query<Subscriber>('SELECT endpoint,subscription FROM push_subscriptions WHERE user_id=$1',[recipient]);
  if(!subs.length)return json({error:'Je reisgenoot moet eerst pushnotificaties aanzetten op diens eigen toestel.'},409);
  // Atomic user-specific throttle; two simultaneous requests cannot flood the partner.
  const [claim]=await query<Claim>("INSERT INTO partner_buzzer_cooldowns(sender_id) VALUES($1) ON CONFLICT(sender_id) DO UPDATE SET last_sent_at=now() WHERE partner_buzzer_cooldowns.last_sent_at <= now()-($2::integer * interval '1 second') RETURNING last_sent_at",[user.id,BUZZER_COOLDOWN_SECONDS]);
  if(!claim)return json({error:'Je hebt net gebuzzerd. Probeer het over een minuut opnieuw.'},429);
  const outcomes=await Promise.allSettled(subs.map(s=>sendPush(s.subscription,BUZZER_NOTIFICATION,{ttlSeconds:BUZZER_TTL_SECONDS})));
  let accepted=0;
  for(let i=0;i<outcomes.length;i++){
   const result=outcomes[i];
   if(result.status==='fulfilled'){accepted++;continue;}
   const status=(result.reason as {statusCode?:number})?.statusCode;
   if(isExpiredSubscription(status))
    await query('DELETE FROM push_subscriptions WHERE user_id=$1 AND endpoint=$2',[recipient,subs[i].endpoint]);
  }
  if(!accepted){
   // Do not rate-limit failed deliveries indefinitely; protect any newer claim.
   await query('DELETE FROM partner_buzzer_cooldowns WHERE sender_id=$1 AND last_sent_at=$2',[user.id,claim.last_sent_at]);
   return json({error:'Geen toestel kon de Buzzer ontvangen. Laat je reisgenoot notificaties opnieuw inschakelen.'},502);
  }
  // Accepted by a push provider; device delivery cannot be guaranteed.
  return json({ok:true});
 }catch(error){
  console.error('Partner buzzer failed:',error instanceof Error?error.name:'unknown');
  return json({error:'Buzzer verzenden lukte niet. Probeer het opnieuw.'},500);
 }
}
