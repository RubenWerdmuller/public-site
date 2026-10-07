import {test} from 'node:test';
import assert from 'node:assert/strict';
import webpush from 'web-push';
import {pushReadiness} from '../lib/push-config';
import {sendPush} from '../lib/push';
import {localHour,notificationWindow} from '../lib/domain';
function env(){const keys=webpush.generateVAPIDKeys();return {NEXT_PUBLIC_VAPID_PUBLIC_KEY:keys.publicKey,VAPID_PRIVATE_KEY:keys.privateKey,VAPID_SUBJECT:'https://rubenwerdmuller.nl',CRON_SECRET:'x'.repeat(43)};}
test('push readiness detects missing credentials without exposing secret values',()=>{const result=pushReadiness({});assert.equal(result.ready,false);assert.deepEqual(result.missing,['NEXT_PUBLIC_VAPID_PUBLIC_KEY','VAPID_PRIVATE_KEY','VAPID_SUBJECT','CRON_SECRET']);assert.deepEqual(pushReadiness(env()),{ready:true,missing:[]});});
test('mismatched keys, invalid subject and weak scheduler secret cannot enable push',()=>{const config=env();config.VAPID_PRIVATE_KEY=env().VAPID_PRIVATE_KEY;config.VAPID_SUBJECT='javascript:alert(1)';config.CRON_SECRET='short';assert.deepEqual(pushReadiness(config),{ready:false,missing:['VAPID_KEY_PAIR','VAPID_SUBJECT','CRON_SECRET']});});
test('free daily cron hour stays after every target and inside the Amsterdam window including DST',()=>{for(const iso of ['2026-01-15T18:00:00Z','2026-07-15T18:00:00Z','2026-03-29T18:59:00Z','2026-10-25T18:59:00Z']){const time=new Date(iso);assert.ok(localHour(time)>=19);assert.equal(notificationWindow(time),true);}});
test('real push transport gets a bounded lifetime and timeout; no provider is contacted in tests',async context=>{
 const previous={...process.env};Object.assign(process.env,env());
 const send=context.mock.method(webpush,'sendNotification',async()=>({statusCode:201,body:'',headers:{}}));
 try{await sendPush({endpoint:'https://fcm.googleapis.com/test-only',keys:{p256dh:'test-only',auth:'test-only'}},{title:'Test',body:'Test',url:'/?screen=settings'});assert.equal(send.mock.callCount(),1);assert.deepEqual(send.mock.calls[0].arguments[2],{TTL:3600,timeout:10000});delete process.env.VAPID_PRIVATE_KEY;await assert.rejects(()=>sendPush({endpoint:'test',keys:{p256dh:'test',auth:'test'}},{title:'Test',body:'Test',url:'/'}));assert.equal(send.mock.callCount(),1);}finally{for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
});
