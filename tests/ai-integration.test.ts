import test, { mock } from 'node:test';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';
import { schema } from '../lib/schema';
import { questions } from '../lib/questions';
import { batch } from './fixtures/ai-batch';
import webpush from 'web-push';

test('publication is atomic, pair-scoped, retry-safe and preserves answer snapshots', async () => {
  const db = new PGlite();
  await db.exec(schema);
  await db.query("INSERT INTO avatars(id,name) VALUES(0,'Test')");
  await db.query('INSERT INTO questions SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text,content jsonb)', [JSON.stringify(questions.map(content => ({ id: content.id, content })))]);
  const local = globalThis as typeof globalThis & { travelDB?: Promise<unknown> };
  local.travelDB = Promise.resolve(db);
  delete process.env.DATABASE_URL;
  delete process.env.VERCEL;
  process.env.AI_ADMIN_EMAILS = 'owner@example.com';
  try {
    const { query } = await import('../lib/db');
    const { enqueueTask, claimTask, publishQuestions, listTasks, availableBank, pipelineTick } = await import('../lib/ai-tasks');
    for (const id of ['pair-a', 'pair-b']) await query('INSERT INTO travel_pairs(id) VALUES($1)', [id]);
    const user = { id: 'owner', pair_id: 'pair-a', email: 'owner@example.com', name: 'Owner', avatar: 0 };
    await query('INSERT INTO users(id,email,name,password_hash,avatar) VALUES($1,$2,$3,$4,0)', [user.id, user.email, user.name, 'test-only']);
    await query('INSERT INTO memberships(user_id,pair_id,slot) VALUES($1,$2,1)', [user.id, user.pair_id]);
    await enqueueTask(user, { kind: 'questions', instruction: 'Maak een nieuw reisdilemma', scheduledAt: new Date().toISOString(), repeatWeekly: true });
    const task = await claimTask('questions'); assert.ok(task);
    assert.equal(await claimTask('questions'), null);
    const [old] = await query<{ content: unknown } & Record<string, unknown>>("SELECT content FROM questions WHERE id='q001'");
    await query("INSERT INTO answers(user_id,pair_id,question_id,choice,snapshot,mode) VALUES($1,$2,'q001',0,$3::jsonb,'daily')", [user.id, user.pair_id, JSON.stringify(old.content)]);
    assert.equal(await publishQuestions(task.id, 'wrong-receipt', batch()), false);
    assert.equal(await publishQuestions(task.id, task.receipt, batch('Een nieuw uitzicht onderweg?', 'q001')), true);
    assert.equal(await publishQuestions(task.id, task.receipt, batch()), false);
    const mine = await availableBank('pair-a'); const theirs = await availableBank('pair-b');
    assert.equal(mine.some(q => q.id.startsWith('ai_')), true);
    assert.equal(theirs.some(q => q.id.startsWith('ai_')), false);
    assert.equal(mine.some(q => q.id === 'q001'), false);
    assert.equal(theirs.some(q => q.id === 'q001'), true);
    const [answer] = await query('SELECT snapshot FROM answers WHERE user_id=$1', [user.id]);
    assert.deepEqual(answer.snapshot, old.content);
    await pipelineTick(); await pipelineTick();
    assert.equal((await listTasks(user)).length, 2);
    assert.equal((await listTasks(user)).filter(t => t.status === 'queued').length, 1);
    const otherUser = { ...user, pair_id: 'pair-b' };
    assert.equal((await listTasks(otherUser)).length, 0);
    const rows = await query('SELECT * FROM question_options WHERE question_id LIKE $1', ['ai_%']); assert.equal(rows.length, 2);
  } finally {
    await db.close();
    delete local.travelDB;
  }
});
test('additive schema can be applied twice without losing queued tasks', async () => {
  const db = new PGlite();
  await db.exec(schema); await db.exec(schema);
  const rows = await db.query("SELECT table_name FROM information_schema.tables WHERE table_name='ai_tasks'");
  assert.equal(rows.rows.length, 1);
  await db.close();
});
test('notification claims recover after interruption and retry transient push errors without duplicate delivery', async () => {
  const db = new PGlite();
  await db.exec(schema);
  const local = globalThis as typeof globalThis & { travelDB?: Promise<unknown> };
  local.travelDB = Promise.resolve(db);
  let calls = 0;
  const send = mock.method(webpush, 'sendNotification', async () => {
    calls++;
    if (calls === 1) throw new Error('Temporary push failure');
    return { statusCode: 201, body: '', headers: {} };
  });
  const keys = webpush.generateVAPIDKeys();
  process.env.AI_ADMIN_EMAILS = 'owner@example.com';
  process.env.VAPID_SUBJECT = 'mailto:owner@example.test';
  process.env.VAPID_PRIVATE_KEY = keys.privateKey;
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = keys.publicKey;
  try {
    await db.exec("INSERT INTO avatars VALUES(0,'Test'); INSERT INTO travel_pairs(id) VALUES('pair'); INSERT INTO users(id,email,name,password_hash,avatar) VALUES('owner','owner@example.com','Test','test-only',0); INSERT INTO memberships VALUES('owner','pair',1)");
    await db.query('INSERT INTO push_subscriptions(endpoint,user_id,subscription) VALUES($1,$2,$3::jsonb)', ['https://fcm.googleapis.com/test', 'owner', JSON.stringify({ endpoint: 'https://fcm.googleapis.com/test', keys: { auth: 'test', p256dh: 'test' } })]);
    await db.exec("INSERT INTO ai_tasks(id,pair_id,created_by,kind,instruction,scheduled_at,status,finished_at) VALUES('task','pair','owner','questions','Test opdracht',now(),'published',now()); INSERT INTO ai_notification_deliveries(user_id,event,claimed_at) VALUES('owner','task:published',now()-interval '20 minutes')");
    const { sendAiNotifications } = await import('../lib/ai-notifications');
    const now = new Date('2026-10-07T10:00:00Z');
    await sendAiNotifications(now); await sendAiNotifications(now); await sendAiNotifications(now);
    assert.equal(calls, 2);
    const rows = await db.query<{ sent: boolean }>("SELECT sent FROM ai_notification_deliveries WHERE event='task:published'");
    assert.equal(rows.rows[0].sent, true);
  } finally {
    send.mock.restore(); await db.close(); delete local.travelDB;
    delete process.env.VAPID_SUBJECT; delete process.env.VAPID_PRIVATE_KEY; delete process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  }
});
