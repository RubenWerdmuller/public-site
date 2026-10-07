import webpush from 'web-push';
import { query } from './db';
import { ensureAssignments, weeklyReport } from './service';
import { localDay, localHour, notificationWindow } from './domain';
import { createHash } from 'node:crypto';
import { ensureWeeklyQuestion } from './weekly-questions';
export async function runJobs(now = new Date()) {
  const pairs=await query<{id:string}&Record<string,unknown>>('SELECT id FROM travel_pairs WHERE EXISTS(SELECT 1 FROM memberships WHERE pair_id=travel_pairs.id)');
  for(const pair of pairs) { await ensureAssignments(pair.id); await ensureWeeklyQuestion(pair.id); await weeklyReport(pair.id); }
  if(!notificationWindow(now)||!process.env.VAPID_PRIVATE_KEY||!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return {pairs:pairs.length,sent:0,push:'not configured or outside window'};
  webpush.setVapidDetails(process.env.VAPID_SUBJECT??'mailto:hello@example.com',process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY);
  const members=await query<{id:string;pair_id:string}&Record<string,unknown>>('SELECT u.id,m.pair_id FROM users u JOIN memberships m ON m.user_id=u.id WHERE EXISTS(SELECT 1 FROM push_subscriptions WHERE user_id=u.id)'); let sent=0;
  for(const user of members) {
    const day=localDay(now); const targetHour=9+createHash('sha256').update(`${user.id}:${day}`).digest()[0]%11;
    if(localHour(now)<targetHour) continue;
    const pending=await query<{question_id:string}&Record<string,unknown>>('SELECT d.question_id FROM daily_assignments d WHERE d.pair_id=$1 AND d.day=$2 AND NOT EXISTS(SELECT 1 FROM answers a WHERE a.question_id=d.question_id AND a.user_id=$3) AND NOT EXISTS(SELECT 1 FROM saved_questions s WHERE s.question_id=d.question_id AND s.user_id=$3) ORDER BY d.position LIMIT 1',[user.pair_id,day,user.id]);
    const monday=new Date(`${day}T12:00:00Z`).getUTCDay()===1; const kind=monday?'report':'daily'; if(!monday&&!pending.length) continue;
    const claim=await query('INSERT INTO notification_deliveries(user_id,day,kind) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING user_id',[user.id,day,kind]); if(!claim.length) continue;
    const subscriptions=await query<{endpoint:string;subscription:webpush.PushSubscription}&Record<string,unknown>>('SELECT endpoint,subscription FROM push_subscriptions WHERE user_id=$1',[user.id]); let delivered=false;
    for(const s of subscriptions) { try { await webpush.sendNotification(s.subscription,JSON.stringify({title:'Samen op reis',body:monday?'Jullie nieuwe reisrapport is er ✨':'Vier kleine keuzes. Een beetje dichter bij jullie reis.',url:monday?'/?screen=report':`/?screen=question&q=${pending[0].question_id}`})); delivered=true; sent++; } catch(error) { const status=(error as {statusCode?:number}).statusCode; if(status===404||status===410) await query('DELETE FROM push_subscriptions WHERE endpoint=$1',[s.endpoint]); } }
    if(!delivered) await query('DELETE FROM notification_deliveries WHERE user_id=$1 AND day=$2 AND kind=$3',[user.id,day,kind]);
  }
  return {pairs:pairs.length,sent};
}
