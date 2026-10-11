import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import webpush from 'web-push';
import {BUZZER_NOTIFICATION,BUZZER_COOLDOWN_SECONDS,BUZZER_TTL_SECONDS,buzzerRecipient,isExpiredSubscription} from '../lib/buzzer';
import {sendPush} from '../lib/push';
test('Buzzer sends the exact one-word notification without details',()=>{
 assert.deepEqual(BUZZER_NOTIFICATION,{title:'Buzzer',body:'',url:'/buzzer'});
 assert.equal(BUZZER_TTL_SECONDS,90);
 assert.ok(BUZZER_COOLDOWN_SECONDS>=60);
});
test('buzzer recipient is always the other person in a two-person pair',()=>{
 assert.equal(buzzerRecipient('me',[{user_id:'me'},{user_id:'other'}]),'other');
 assert.equal(buzzerRecipient('other',[{user_id:'me'},{user_id:'other'}]),'me');
 assert.equal(buzzerRecipient('me',[{user_id:'me'}]),null);
 assert.equal(buzzerRecipient('stranger',[{user_id:'me'},{user_id:'other'}]),null);
 assert.equal(buzzerRecipient('me',[{user_id:'me'},{user_id:'me'}]),null);
 assert.equal(buzzerRecipient('me',[{user_id:'me'},{user_id:'other'},{user_id:'third'}]),null);
});
test('expired subscription detection handles provider-specific expiration signals',()=>{
 assert.equal(isExpiredSubscription(404),true);
 assert.equal(isExpiredSubscription(410),true);
 assert.equal(isExpiredSubscription(429),false);
 assert.equal(isExpiredSubscription(undefined),false);
});
test('service worker accepts /buzzer navigation and shows a single Buzzer notification',()=>{
 const src=readFileSync('public/sw.js','utf8');
 assert.match(src,/'\/buzzer'/);
 assert.match(src,/data\.title==='Buzzer'/);
 assert.match(src,/typeof data\.body==='string'\?data\.body/);
});
test('Buzzer uses 90-second TTL while other push retains original TTL',async context=>{
 const original={...process.env},keys=webpush.generateVAPIDKeys();
 Object.assign(process.env,{NEXT_PUBLIC_VAPID_PUBLIC_KEY:keys.publicKey,VAPID_PRIVATE_KEY:keys.privateKey,VAPID_SUBJECT:'https://rubenwerdmuller.nl',CRON_SECRET:'x'.repeat(43)});
 const mock=context.mock.method(webpush,'sendNotification',async()=>({statusCode:201,body:'',headers:{}}));
 const sub={endpoint:'https://fcm.googleapis.com/test-only',keys:{p256dh:'test-only',auth:'test-only'}};
 try{
  await sendPush(sub,BUZZER_NOTIFICATION,{ttlSeconds:BUZZER_TTL_SECONDS});
  await sendPush(sub,{title:'Test',body:'Test',url:'/'});
  assert.equal(mock.mock.callCount(),2);
  assert.deepEqual(mock.mock.calls[0].arguments[2],{TTL:90,timeout:10000});
  assert.deepEqual(mock.mock.calls[1].arguments[2],{TTL:3600,timeout:10000});
  assert.deepEqual(JSON.parse(String(mock.mock.calls[0].arguments[1])),BUZZER_NOTIFICATION);
 }finally{for(const key of Object.keys(process.env))if(!(key in original))delete process.env[key];Object.assign(process.env,original);}
});
