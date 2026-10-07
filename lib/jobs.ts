import type webpush from 'web-push';
import {sendPush} from './push';
import {pushReadiness} from './push-config';
import { query } from './db';
import { ensureAssignments, weeklyReport } from './service';
import { localDay, localHour, notificationWindow,weekKey } from './domain';
import { createHash } from 'node:crypto';
import { ensureWeeklyQuestion } from './weekly-questions';
export async function runJobs(now = new Date()) {
  const pairs=await query<{id:string}&Record<string,unknown>>('SELECT id FROM travel_pairs WHERE EXISTS(SELECT 1 FROM memberships WHERE pair_id=travel_pairs.id)');
  const day=localDay(now),week=weekKey(now);
  for(const pair of pairs) { await ensureAssignments(pair.id,day); await ensureWeeklyQuestion(pair.id,week); await weeklyReport(pair.id,week); }
  if(!notificationWindow(now)||!pushReadiness().ready) return {pairs:pairs.length,sent:0,push:'not configured or outside window'};
  const members=await query<{id:string;pair_id:string}&Record<string,unknown>>('SELECT u.id,m.pair_id FROM users u JOIN memberships m ON m.user_id=u.id WHERE EXISTS(SELECT 1 FROM push_subscriptions WHERE user_id=u.id)'); let sent=0;
  for(const user of members) {
    const targetHour=9+createHash('sha256').update(`${user.id}:${day}`).digest()[0]%11;
    if(localHour(now)<targetHour) continue;
    const pending=await query<{question_id:string}&Record<string,unknown>>('SELECT ids.question_id FROM question_sets q CROSS JOIN LATERAL jsonb_array_elements_text(q.question_ids) WITH ORDINALITY AS ids(question_id,position) WHERE q.pair_id=$1 AND q.day=$2 AND q.ordinal=coalesce((SELECT ordinal FROM set_progress WHERE user_id=$3 AND day=$2),1) AND NOT EXISTS(SELECT 1 FROM answers a WHERE a.question_id=ids.question_id AND a.user_id=$3) AND NOT EXISTS(SELECT 1 FROM saved_questions s WHERE s.question_id=ids.question_id AND s.pair_id=$1) ORDER BY ids.position LIMIT 1',[user.pair_id,day,user.id]);
    const monday=new Date(`${day}T12:00:00Z`).getUTCDay()===1; const kind=monday?'report':'daily'; if(!monday&&!pending.length) continue;
    const claim=await query("INSERT INTO notification_deliveries(user_id,day,kind,sent) VALUES($1,$2,$3,false) ON CONFLICT(user_id,day,kind) DO UPDATE SET claimed_at=now() WHERE NOT notification_deliveries.sent AND notification_deliveries.claimed_at<now()-interval '10 minutes' RETURNING user_id",[user.id,day,kind]); if(!claim.length) continue;
    const subscriptions=await query<{endpoint:string;subscription:webpush.PushSubscription}&Record<string,unknown>>('SELECT endpoint,subscription FROM push_subscriptions WHERE user_id=$1',[user.id]); let delivered=false;
    for(const s of subscriptions) { try { await sendPush(s.subscription,{title:'Samen op reis',body:monday?'Jullie nieuwe reisrapport is er ✨':'Vier kleine keuzes. Een beetje dichter bij jullie reis.',url:monday?'/?screen=report':`/?screen=question&q=${pending[0].question_id}`}); delivered=true; sent++; } catch(error) { const status=(error as {statusCode?:number}).statusCode; if(status===404||status===410) await query('DELETE FROM push_subscriptions WHERE endpoint=$1',[s.endpoint]); } }
    if(delivered)await query('UPDATE notification_deliveries SET sent=true,sent_at=now() WHERE user_id=$1 AND day=$2 AND kind=$3',[user.id,day,kind]);
    else await query('DELETE FROM notification_deliveries WHERE user_id=$1 AND day=$2 AND kind=$3 AND NOT sent',[user.id,day,kind]);
  }
  return {pairs:pairs.length,sent};
}
