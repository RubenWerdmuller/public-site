import { NextRequest, NextResponse } from 'next/server';
import { randomBytes, randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { currentUser, createSession, hashToken, passwordHash, verifyPassword } from '@/lib/auth';
import { query } from '@/lib/db';
import { dashboard, refreshInsights } from '@/lib/service';
import { nextSet, SetNotReadyError } from '@/lib/sets';
import { answerWeeklyQuestion } from '@/lib/weekly-questions';
import type { Question } from '@/lib/domain';
export const runtime='nodejs';
export const dynamic='force-dynamic';
function json(data:unknown,status=200) { return NextResponse.json(data,{status,headers:{'Cache-Control':'no-store'}}); }
export async function GET() { const user=await currentUser(); return json(user ? await dashboard(user) : {user:null}); }
const credentials=z.object({email:z.email().max(200),password:z.string().min(10).max(128),name:z.string().trim().min(1).max(40).optional(),avatar:z.number().int().min(0).max(11).optional()});
export async function POST(req:NextRequest) {
  // Next dev's internal URL uses 0.0.0.0; the request Host preserves localhost/LAN.
  const origin=req.headers.get('origin');
  if(!origin||!URL.canParse(origin)||new URL(origin).host!==req.headers.get('host')) return json({error:'Deze aanvraag komt niet uit de app.'},403);
  try {
    const body=await req.json(); const action=z.string().parse(body.action);
    if(action==='register'||action==='login') {
      const data=credentials.parse(body); const email=data.email.toLowerCase();
      const key=hashToken(email); const attempts=await query<{attempts:number}&Record<string,unknown>>("INSERT INTO auth_attempts(key,attempts) VALUES($1,1) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN auth_attempts.window_start < now()-interval '15 minutes' THEN 1 ELSE auth_attempts.attempts+1 END,window_start=CASE WHEN auth_attempts.window_start < now()-interval '15 minutes' THEN now() ELSE auth_attempts.window_start END RETURNING attempts",[key]);
      if(attempts[0].attempts>12) return json({error:'Even pauze. Probeer het over 15 minuten opnieuw.'},429);
      let id:string;
      if(action==='register') {
        if(!data.name) return json({error:'Hoe mogen we je noemen?'},400);
        id=randomUUID(); const pairId=randomUUID(); const code=randomBytes(9).toString('hex');
        await query(`WITH new_user AS (INSERT INTO users(id,email,name,password_hash,avatar) VALUES($1,$2,$3,$4,$5) RETURNING id), new_pair AS (INSERT INTO travel_pairs(id) VALUES($6) RETURNING id), member AS (INSERT INTO memberships(user_id,pair_id,slot) SELECT new_user.id,new_pair.id,1 FROM new_user,new_pair) INSERT INTO invites(code,pair_id,expires_at) SELECT $7,id,now()+interval '7 days' FROM new_pair`,[id,email,data.name,passwordHash(data.password),data.avatar??0,pairId,code]);
      } else { const users=await query<{id:string;password_hash:string}&Record<string,unknown>>('SELECT id,password_hash FROM users WHERE email=$1',[email]); if(!users[0]||!verifyPassword(data.password,users[0].password_hash)) return json({error:'E-mail of wachtwoord klopt niet.'},401); id=users[0].id; }
      await createSession(id); return json({ok:true});
    }
    const user=await currentUser(); if(!user) return json({error:'Log eerst in.'},401);
    if(action==='weekly-answer'){const week=z.string().regex(/^\d{4}-\d{2}-\d{2}$/).parse(body.week);const choice=z.number().int().min(0).max(1).parse(body.choice);return await answerWeeklyQuestion(user.pair_id,user.id,week,choice)?json({ok:true}):json({error:'Deze hoofdvraag hoort niet bij jullie week.'},403);}
    if(action==='logout') { const token=(await cookies()).get('travel-session')?.value; if(token) await query('DELETE FROM sessions WHERE token_hash=$1',[hashToken(token)]); (await cookies()).delete('travel-session'); return json({ok:true}); }
    if(action==='join') {
      const code=z.string().regex(/^[a-f0-9]{18}$/).parse(body.code);
      const existing=await query('SELECT user_id FROM memberships WHERE pair_id=$1',[user.pair_id]);
      const ownAnswers=await query('SELECT question_id FROM answers WHERE user_id=$1 LIMIT 1',[user.id]);
      if(existing.length>1||ownAnswers.length) return json({error:'Koppelen kan alleen vóór je eerste antwoord en als je nog geen partner hebt.'},409);
      const rows=await query(`WITH target AS (SELECT code,pair_id FROM invites WHERE code=$1 AND used_at IS NULL AND expires_at>now() AND pair_id<>$3 FOR UPDATE), joined AS (UPDATE memberships SET pair_id=target.pair_id,slot=2 FROM target WHERE memberships.user_id=$2 RETURNING memberships.pair_id) UPDATE invites SET used_at=now() WHERE code=$1 AND pair_id IN (SELECT pair_id FROM joined) RETURNING pair_id`,[code,user.id,user.pair_id]);
      if(!rows.length) return json({error:'Deze uitnodiging is verlopen of al gebruikt.'},409); await query('DELETE FROM set_progress WHERE user_id=$1',[user.id]); return json({ok:true});
    }
    if(action==='preference') {
      const data=z.object({preferenceId:z.string().max(150),kind:z.enum(['hard_constraint','soft_constraint','strong_preference','weak_preference','interest','personal_wish','open_question']),notes:z.string().max(1000),value:z.union([z.string().max(1000),z.number().finite(),z.boolean(),z.null()]),confidence:z.number().min(0).max(1),boundary:z.object({unit:z.string().max(40),preferred:z.tuple([z.number(),z.number()]).optional(),acceptable:z.tuple([z.number(),z.number()]).optional(),hard:z.tuple([z.number(),z.number()]).optional(),exceptions:z.array(z.string().max(200)).max(10).optional()}).refine(b=>[b.preferred,b.acceptable,b.hard].every(range=>!range||range[0]<=range[1])).nullable()}).parse(body);
      const changed=await query('UPDATE travel_preferences p SET kind=$1,value=$2::jsonb,confidence=$3,notes=$4,boundary=$5::jsonb,updated_at=now() FROM preference_subjects s WHERE p.subject_id=s.id AND s.pair_id=$6 AND p.id=$7 AND p.source=$8 RETURNING p.id',[data.kind,JSON.stringify(data.value),data.confidence,data.notes,JSON.stringify(data.boundary),user.pair_id,data.preferenceId,'explicitly_stated']);
      return changed.length?json({ok:true}):json({error:'Dit uitgangspunt hoort niet bij jullie boekje.'},403);
    }
    if(action==='next-set') {const id=z.string().max(120).parse(body.setId);const next=await nextSet(user,id);return next?json({ok:true}):json({error:'Jullie hebben alle sets ontdekt. Tijd om de bewaarde vragen samen te bekijken.'},409);}
    if(action==='answer'||action==='save') {
      const qid=z.string().regex(/^q\d{3}$/).parse(body.questionId);
      const accessible=await query<{content:Question}&Record<string,unknown>>('SELECT q.content FROM questions q WHERE q.id=$1 AND (EXISTS(SELECT 1 FROM question_sets s WHERE s.pair_id=$2 AND s.question_ids @> jsonb_build_array(q.id)) OR EXISTS(SELECT 1 FROM daily_assignments d WHERE d.question_id=q.id AND d.pair_id=$2) OR EXISTS(SELECT 1 FROM saved_questions s WHERE s.question_id=q.id AND s.pair_id=$2))',[qid,user.pair_id]);
      if(!accessible[0]) return json({error:'Deze vraag hoort niet bij jullie stapel.'},403);
      if(action==='save') await query('INSERT INTO saved_questions(user_id,pair_id,question_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING',[user.id,user.pair_id,qid]);
      else {
        const choice=z.number().int().min(0).max(1).parse(body.choice); const mode=z.enum(['daily','later']).parse(body.mode??'daily');
        await query('INSERT INTO answers(user_id,pair_id,question_id,choice,snapshot,mode,information_value) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT DO NOTHING',[user.id,user.pair_id,qid,choice,JSON.stringify(accessible[0].content),mode,accessible[0].content.informationValue]);
        // Shared saved card remains until both people have answered.
        await query('DELETE FROM saved_questions WHERE pair_id=$1 AND question_id=$2 AND (SELECT count(*) FROM answers WHERE pair_id=$1 AND question_id=$2)=2',[user.pair_id,qid]);
        await refreshInsights(user.pair_id);
      }
      return json({ok:true});
    }
    if(action==='profile') { const name=z.string().trim().min(1).max(40).parse(body.name); const avatar=z.number().int().min(0).max(11).parse(body.avatar); await query('UPDATE users SET name=$1,avatar=$2 WHERE id=$3',[name,avatar,user.id]); return json({ok:true}); }
    if(action==='feedback') { const reportId=z.string().parse(body.reportId); const rating=z.enum(['love','partly','no']).parse(body.rating); const exists=await query('SELECT id FROM weekly_reports WHERE id=$1 AND pair_id=$2',[reportId,user.pair_id]); if(!exists.length) return json({error:'Rapport niet gevonden.'},403); await query('INSERT INTO report_feedback(report_id,user_id,rating) VALUES($1,$2,$3) ON CONFLICT(report_id,user_id) DO UPDATE SET rating=excluded.rating',[reportId,user.id,rating]); return json({ok:true}); }
    if(action==='subscribe') {
      const subscription=z.object({endpoint:z.url().refine(v=>{const u=new URL(v);return u.protocol==='https:' && ['fcm.googleapis.com','updates.push.services.mozilla.com','web.push.apple.com','wns.windows.com'].some(host=>u.hostname===host||u.hostname.endsWith(`.${host}`));}),keys:z.object({p256dh:z.string().min(20).max(200),auth:z.string().min(10).max(100)})}).parse(body.subscription);
      await query('INSERT INTO push_subscriptions(endpoint,user_id,subscription) VALUES($1,$2,$3::jsonb) ON CONFLICT(endpoint) DO UPDATE SET user_id=excluded.user_id,subscription=excluded.subscription',[subscription.endpoint,user.id,JSON.stringify(subscription)]); return json({ok:true});
    }
    if(action==='unsubscribe') { await query('DELETE FROM push_subscriptions WHERE user_id=$1',[user.id]); return json({ok:true}); }
    return json({error:'Onbekende actie.'},400);
  } catch(error) { if(error instanceof SetNotReadyError)return json({error:error.message},409); if(error instanceof z.ZodError) return json({error:'Controleer je invoer. Een wachtwoord heeft minimaal 10 tekens; controleer bij grenzen ook van/tot.'},400); if((error as {code?:string}).code==='23505') return json({error:'Dit e-mailadres bestaat al, of het duo is al compleet.'},409); console.error('App request failed:',error instanceof Error ? error.message : 'unknown'); return json({error:'Opslaan lukte niet. Probeer het opnieuw.'},500); }
}
