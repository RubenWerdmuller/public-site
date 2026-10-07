import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PGlite} from '@electric-sql/pglite';
import webpush from 'web-push';
import {schema} from '../lib/schema';
import {questions} from '../lib/questions';
import {query,transaction} from '../lib/db';
import {ensureSet} from '../lib/sets';
import {ensureAssignments} from '../lib/service';
import {joinPair,recordQuestion} from '../lib/pair-actions';
import {answerWeeklyQuestion,ensureWeeklyQuestion} from '../lib/weekly-questions';
import {initialPreview,previewSave,previewAnswer} from '../lib/demo';
import {runJobs} from '../lib/jobs';
import type {User} from '../lib/auth';
import {appScreen,isAppScreen} from '../lib/navigation';

const user=(id:string,pair_id:string):User=>({id,pair_id,email:`${id}@example.test`,name:id,avatar:0});
async function database(work:()=>Promise<void>){
  const db=new PGlite();const local=globalThis as typeof globalThis & {travelDB?:Promise<unknown>};
  await db.exec(schema);
  await db.exec("INSERT INTO avatars VALUES(0,'Test'); INSERT INTO travel_pairs(id) VALUES('a'),('b'),('c'); INSERT INTO users(id,email,name,password_hash,avatar) VALUES('one','one@example.test','One','test',0),('two','two@example.test','Two','test',0),('three','three@example.test','Three','test',0); INSERT INTO memberships VALUES('one','a',1),('two','b',1),('three','c',1)");
  await db.query('INSERT INTO questions SELECT * FROM jsonb_to_recordset($1::jsonb) AS x(id text,content jsonb)',[JSON.stringify(questions.map(content=>({id:content.id,content})))]);
  local.travelDB=Promise.resolve(db);
  try{await work();}finally{delete local.travelDB;await db.close();}
}

test('transactions roll back and simultaneous invitations cannot move an account twice',async()=>database(async()=>{
  await assert.rejects(transaction(async read=>{await read("INSERT INTO travel_pairs(id) VALUES('rollback')");throw Error('stop');}));
  assert.equal((await query("SELECT id FROM travel_pairs WHERE id='rollback'")).length,0);
  await query("INSERT INTO invites(code,pair_id,expires_at) VALUES('invite-b','b',now()+interval '1 day'),('invite-c','c',now()+interval '1 day'),('old-invite','a',now()+interval '1 day')");
  const results=await Promise.allSettled([joinPair(user('one','a'),'invite-b'),joinPair(user('one','a'),'invite-c')]);
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  assert.equal((await query('SELECT code FROM invites WHERE used_at IS NOT NULL')).length,2);
  assert.equal((await query("SELECT code FROM invites WHERE code='old-invite' AND used_at IS NOT NULL")).length,1);
  assert.equal((await query("SELECT user_id FROM memberships WHERE slot=2 AND user_id='one'")).length,1);
}));

test('a weekly answer prevents joining; stale pair requests cannot write answers',async()=>database(async()=>{
  const assignment=await ensureWeeklyQuestion('a','2026-10-05');assert.ok(assignment);
  assert.equal(await answerWeeklyQuestion('a','one',assignment.week,0),true);
  await query("INSERT INTO invites(code,pair_id,expires_at) VALUES('invite-b','b',now()+interval '1 day')");
  await assert.rejects(joinPair(user('one','a'),'invite-b'),/eerste antwoord/);
  await assert.rejects(answerWeeklyQuestion('b','one',assignment.week,1),/gewijzigd/);
  assert.equal((await query('SELECT code FROM invites WHERE used_at IS NOT NULL')).length,0);
}));

test('concurrent shared answers clean saved cards; completed cards cannot be saved again',async()=>database(async()=>{
  await query("UPDATE memberships SET pair_id='a',slot=2 WHERE user_id='two'");
  const set=await ensureSet('a','2026-10-07');assert.ok(set);
  const qid=set.question_ids[0];
  await recordQuestion(user('one','a'),qid,{action:'save'});
  await Promise.all([recordQuestion(user('one','a'),qid,{action:'answer',choice:0,mode:'daily'}),recordQuestion(user('two','a'),qid,{action:'answer',choice:1,mode:'daily'})]);
  assert.equal((await query('SELECT * FROM saved_questions')).length,0);
  await recordQuestion(user('one','a'),qid,{action:'save'});
  assert.equal((await query('SELECT * FROM saved_questions')).length,0);
  await recordQuestion(user('one','a'),qid,{action:'answer',choice:1,mode:'daily'});
  assert.equal((await query<{choice:number}&Record<string,unknown>>("SELECT choice FROM answers WHERE user_id='one'"))[0].choice,0);
  await assert.rejects(recordQuestion(user('three','c'),qid,{action:'save'}),/stapel/);
  await assert.rejects(recordQuestion(user('two','b'),qid,{action:'answer',choice:0,mode:'daily'}),/gewijzigd/);
}));

test('concurrent days select unique sets and repair interrupted daily assignment creation',async()=>database(async()=>{
  const [first,second,retry]=await Promise.all([ensureSet('a','2026-10-07'),ensureSet('a','2026-10-08'),ensureSet('a','2026-10-07')]);
  assert.ok(first&&second&&retry);assert.deepEqual(first.question_ids,retry.question_ids);
  assert.equal(second.question_ids.some(id=>first.question_ids.includes(id)),false);
  await ensureAssignments('a','2026-10-07');
  await query("DELETE FROM daily_assignments WHERE pair_id='a' AND day='2026-10-07' AND position>0");
  await ensureAssignments('a','2026-10-07');
  assert.equal((await query("SELECT * FROM daily_assignments WHERE pair_id='a' AND day='2026-10-07'")).length,first.question_ids.length);
}));

test('daily push uses the active set, excludes shared saves and recovers abandoned claims',async context=>database(async()=>{
  const previous={...process.env};
  const keys=webpush.generateVAPIDKeys();Object.assign(process.env,{VAPID_SUBJECT:'https://example.test',NEXT_PUBLIC_VAPID_PUBLIC_KEY:keys.publicKey,VAPID_PRIVATE_KEY:keys.privateKey,CRON_SECRET:'x'.repeat(43)});
  const send=context.mock.method(webpush,'sendNotification',async()=>({statusCode:201,body:'',headers:{}}));
  try{
    await query("UPDATE memberships SET pair_id='a',slot=2 WHERE user_id='two'");
    const first=await ensureSet('a','2026-10-07');assert.ok(first);
    for(const id of first.question_ids)await recordQuestion(user('one','a'),id,{action:'save'});
    const second=await ensureSet('a','2026-10-07',2);assert.ok(second);
    await query("INSERT INTO set_progress(user_id,day,ordinal) VALUES('one','2026-10-07',2)");
    await recordQuestion(user('two','a'),second.question_ids[0],{action:'save'});
    await query('INSERT INTO push_subscriptions(endpoint,user_id,subscription) VALUES($1,$2,$3::jsonb)',['https://fcm.googleapis.com/test','one',JSON.stringify({endpoint:'https://fcm.googleapis.com/test',keys:{auth:'test',p256dh:'test'}})]);
    await query("INSERT INTO notification_deliveries(user_id,day,kind,sent,claimed_at) VALUES('one','2026-10-07','daily',false,now()-interval '20 minutes')");
    const now=new Date('2026-10-07T18:30:00Z');
    await runJobs(now);await runJobs(now);
    assert.equal(send.mock.callCount(),1);
    assert.equal(JSON.parse(send.mock.calls[0].arguments[1] as string).url,`/?screen=question&q=${second.question_ids[1]}`);
    assert.equal((await query<{sent:boolean}&Record<string,unknown>>('SELECT sent FROM notification_deliveries'))[0].sent,true);
    await query("UPDATE notification_deliveries SET sent=false,claimed_at=now()-interval '20 minutes'");
    send.mock.mockImplementationOnce(async()=>{throw Error('temporary');});
    await runJobs(now);assert.equal((await query('SELECT * FROM notification_deliveries')).length,0);
    await runJobs(now);assert.equal(send.mock.callCount(),3);
  }finally{for(const key of Object.keys(process.env))if(!(key in previous))delete process.env[key];Object.assign(process.env,previous);}
}));

test('preview rejects unknown and completed saved questions just like the live app',()=>{
  let state=initialPreview();assert.equal(previewSave(state,'unknown'),state);
  const id=state.sets[0][0];state=previewAnswer(state,id,0);state=previewAnswer({...state,active:'roebie'},id,1);
  assert.equal(previewSave(state,id),state);assert.deepEqual(state.saved,[]);
});
test('unknown screens recover instead of leaving an empty app; login accepts report/settings links',()=>{
  assert.equal(appScreen('unknown',false),'today');assert.equal(appScreen('',true),'question');
  assert.equal(appScreen('notification',false),'today');assert.equal(appScreen('notification',true),'notification');
  assert.equal(isAppScreen('report'),true);assert.equal(isAppScreen('settings'),true);assert.equal(isAppScreen('https://evil.example'),false);
});
