import webpush from 'web-push';
import {pushReadiness} from './push-config';
export type PushMessage={title:string;body:string;url:string};
export async function sendPush(subscription:webpush.PushSubscription,message:PushMessage,options?:{ttlSeconds?:number}){
 if(!pushReadiness().ready)throw Error('Push is nog niet volledig ingesteld.');
 webpush.setVapidDetails(process.env.VAPID_SUBJECT!,process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,process.env.VAPID_PRIVATE_KEY!);
 return webpush.sendNotification(subscription,JSON.stringify(message),{TTL:options?.ttlSeconds??3600,timeout:10000});
}
