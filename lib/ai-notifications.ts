import webpush from 'web-push';
import { query } from './db';
import { localDay, notificationWindow, weekKey } from './domain';
import { isAiAdmin } from './ai-contracts';

export async function sendAiNotifications(now = new Date()) {
  if (!notificationWindow(now) || !process.env.VAPID_PRIVATE_KEY || !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_SUBJECT) return;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT, process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
  const users = await query<{ id: string; email: string; pair_id: string } & Record<string, unknown>>('SELECT u.id,u.email,m.pair_id FROM users u JOIN memberships m ON m.user_id=u.id WHERE EXISTS(SELECT 1 FROM push_subscriptions p WHERE p.user_id=u.id)');
  for (const user of users.filter(u => isAiAdmin(u.email))) {
    const monday = new Date(`${localDay(now)}T12:00:00Z`).getUTCDay() === 1;
    const updates = await query<{ id: string; status: string } & Record<string, unknown>>("SELECT id,status FROM ai_tasks WHERE pair_id=$1 AND status IN('review','published','failed') AND finished_at>now()-interval '7 days' ORDER BY finished_at DESC LIMIT 20", [user.pair_id]);
    const events = updates.map(t => ({ id: `${t.id}:${t.status}`, body: t.status === 'published' ? 'Je AI-opdracht is gepubliceerd. Bekijk het resultaat.' : t.status === 'review' ? 'Je aanpassing staat klaar om te bekijken en goed te keuren.' : 'Een AI-opdracht is niet gelukt. Bekijk de status.' }));
    if (monday) events.push({ id: `reminder:${weekKey(now)}`, body: 'Wat mag de AI deze week voor jullie vragen en reisboekje verbeteren?' });
    const claimed: string[] = [];
    let body = '';
    for (const event of events) {
      const rows = await query("INSERT INTO ai_notification_deliveries(user_id,event) VALUES($1,$2) ON CONFLICT(user_id,event) DO UPDATE SET claimed_at=now() WHERE NOT ai_notification_deliveries.sent AND ai_notification_deliveries.claimed_at<now()-interval '10 minutes' RETURNING event", [user.id, event.id]);
      if (rows.length) { claimed.push(event.id); body ||= event.body; }
    }
    if (!claimed.length) continue;
    let delivered = false;
    const subscriptions = await query<{ endpoint: string; subscription: webpush.PushSubscription } & Record<string, unknown>>('SELECT endpoint,subscription FROM push_subscriptions WHERE user_id=$1', [user.id]);
    for (const s of subscriptions) {
      try { await webpush.sendNotification(s.subscription, JSON.stringify({ title: 'Samen op reis · AI', body, url: '/ai' }), { timeout: 5000, TTL: 3600 }); delivered = true; }
      catch (error) { if ([404, 410].includes((error as { statusCode: number }).statusCode)) await query('DELETE FROM push_subscriptions WHERE endpoint=$1', [s.endpoint]); }
    }
    if (delivered) await query('UPDATE ai_notification_deliveries SET sent=true,delivered_at=now() WHERE user_id=$1 AND event=ANY($2::text[])', [user.id, claimed]);
    else await query('DELETE FROM ai_notification_deliveries WHERE user_id=$1 AND event=ANY($2::text[]) AND NOT sent', [user.id, claimed]);
  }
}
