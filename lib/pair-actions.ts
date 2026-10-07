import {randomBytes} from 'node:crypto';
import {transaction, type Query} from './db';
import type {User} from './auth';
import type {Question} from './domain';

export class PairActionError extends Error { constructor(message:string,readonly status=409){super(message);} }
export async function lockMembership(read:Query,pairId:string,userId:string){
  const rows=await read('SELECT pair_id FROM memberships WHERE user_id=$1 AND pair_id=$2 FOR UPDATE',[userId,pairId]);
  if(!rows.length)throw new PairActionError('Je reisboekje is gewijzigd. Open de app opnieuw.');
}
export async function joinPair(user:User,code:string){
  return transaction(async read=>{
    await lockMembership(read,user.pair_id,user.id);
    const [invite]=await read<{pair_id:string}&Record<string,unknown>>('SELECT pair_id FROM invites WHERE code=$1 AND used_at IS NULL AND expires_at>now()',[code]);
    if(!invite||invite.pair_id===user.pair_id)throw new PairActionError('Deze uitnodiging is verlopen of al gebruikt.');
    await read('SELECT id FROM travel_pairs WHERE id=ANY($1::text[]) ORDER BY id FOR UPDATE',[[user.pair_id,invite.pair_id]]);
    const members=await read('SELECT user_id FROM memberships WHERE pair_id=$1',[user.pair_id]);
    const answered=await read('SELECT user_id FROM answers WHERE user_id=$1 UNION ALL SELECT user_id FROM weekly_question_answers WHERE user_id=$1 LIMIT 1',[user.id]);
    if(members.length>1||answered.length)throw new PairActionError('Koppelen kan alleen voor je eerste antwoord en als je nog geen partner hebt.');
    const claimed=await read('UPDATE invites SET used_at=now() WHERE code=$1 AND used_at IS NULL AND expires_at>now() RETURNING code',[code]);
    if(!claimed.length)throw new PairActionError('Deze uitnodiging is verlopen of al gebruikt.');
    const target=await read<{slot:number}&Record<string,unknown>>('SELECT slot FROM memberships WHERE pair_id=$1',[invite.pair_id]);
    if(target.length!==1||target[0].slot!==1)throw new PairActionError('Deze uitnodiging is niet meer beschikbaar.');
    await read('UPDATE memberships SET pair_id=$1,slot=2 WHERE user_id=$2',[invite.pair_id,user.id]);
    await read('DELETE FROM set_progress WHERE user_id=$1',[user.id]);
    await read('UPDATE invites SET used_at=now() WHERE pair_id=$1 AND used_at IS NULL',[user.pair_id]);
  });
}
export async function recordQuestion(user:User,qid:string,input:{action:'save'}|{action:'answer';choice:number;mode:'daily'|'later'}){
  return transaction(async read=>{
    await lockMembership(read,user.pair_id,user.id);
    await read('SELECT id FROM travel_pairs WHERE id=$1 FOR UPDATE',[user.pair_id]);
    const [question]=await read<{content:Question}&Record<string,unknown>>('SELECT q.content FROM questions q WHERE q.id=$1 AND (EXISTS(SELECT 1 FROM question_sets s WHERE s.pair_id=$2 AND s.question_ids @> jsonb_build_array(q.id)) OR EXISTS(SELECT 1 FROM daily_assignments d WHERE d.question_id=q.id AND d.pair_id=$2) OR EXISTS(SELECT 1 FROM saved_questions s WHERE s.question_id=q.id AND s.pair_id=$2))',[qid,user.pair_id]);
    if(!question)throw new PairActionError('Deze vraag hoort niet bij jullie stapel.',403);
    if(input.action==='save'){
      await read('INSERT INTO saved_questions(user_id,pair_id,question_id) SELECT $1,$2,$3 WHERE (SELECT count(*) FROM answers WHERE pair_id=$2 AND question_id=$3)<2 ON CONFLICT DO NOTHING',[user.id,user.pair_id,qid]);
    }else{
      await read('INSERT INTO answers(user_id,pair_id,question_id,choice,snapshot,mode,information_value) VALUES($1,$2,$3,$4,$5::jsonb,$6,$7) ON CONFLICT DO NOTHING',[user.id,user.pair_id,qid,input.choice,JSON.stringify(question.content),input.mode,question.content.informationValue]);
    }
    // Serialize the shared card cleanup, including concurrent saves and final answers.
    await read('DELETE FROM saved_questions WHERE pair_id=$1 AND question_id=$2 AND (SELECT count(*) FROM answers WHERE pair_id=$1 AND question_id=$2)=2',[user.pair_id,qid]);
  });
}

export async function activeInvite(user:User):Promise<string|null>{
  return transaction(async read=>{
    await lockMembership(read,user.pair_id,user.id);
    await read('SELECT id FROM travel_pairs WHERE id=$1 FOR UPDATE',[user.pair_id]);
    const members=await read('SELECT user_id FROM memberships WHERE pair_id=$1',[user.pair_id]);
    if(members.length!==1)return null;
    const [existing]=await read<{code:string}&Record<string,unknown>>('SELECT code FROM invites WHERE pair_id=$1 AND used_at IS NULL AND expires_at>now() ORDER BY expires_at DESC LIMIT 1',[user.pair_id]);
    if(existing)return existing.code;
    const code=randomBytes(9).toString('hex');
    await read("INSERT INTO invites(code,pair_id,expires_at) VALUES($1,$2,now()+interval '7 days')",[code,user.pair_id]);
    return code;
  });
}
