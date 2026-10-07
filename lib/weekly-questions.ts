import { query } from './db';
import { weekKey, type Answer, type Question } from './domain';
import { loadPreferences } from './sets';
import { revealWeekly, selectWeeklyQuestion, weeklyOccurrence } from './weekly-question-domain';
export async function ensureWeeklyQuestion(pairId:string,week=weekKey()){
  type Row={week:string;snapshot:Question}&Record<string,unknown>;
  let existing=await query<Row>('SELECT week,snapshot FROM weekly_question_assignments WHERE pair_id=$1 AND week=$2',[pairId,week]);
  if(!existing[0]){
    const bank=(await query<{content:Question}&Record<string,unknown>>('SELECT content FROM questions ORDER BY id')).map(r=>r.content);
    const previous=await query<Row>('SELECT week,snapshot FROM weekly_question_assignments WHERE pair_id=$1 AND week<$2 ORDER BY week DESC LIMIT 2',[pairId,week]);
    const context=await loadPreferences(pairId);
    const question=selectWeeklyQuestion(bank,previous.map(r=>({week:r.week,question:r.snapshot})),[],context);
    if(!question)return null;
    await query('INSERT INTO weekly_question_assignments(pair_id,week,question_id,snapshot) VALUES($1,$2,$3,$4::jsonb) ON CONFLICT DO NOTHING',[pairId,week,question.id,JSON.stringify(question)]);
    existing=await query<Row>('SELECT week,snapshot FROM weekly_question_assignments WHERE pair_id=$1 AND week=$2',[pairId,week]);
  }
  return {week:existing[0].week,question:existing[0].snapshot};
}
export async function weeklyQuestionDashboard(pairId:string,userId:string){
  const current=await ensureWeeklyQuestion(pairId);
  const rows=await query<{week:string;snapshot:Question}&Record<string,unknown>>('SELECT week,snapshot FROM weekly_question_assignments WHERE pair_id=$1 ORDER BY week DESC',[pairId]);
  const answers=(await query<{user_id:string;week:string;question_id:string;choice:number;snapshot:Question;answered_at:string}&Record<string,unknown>>('SELECT a.*,w.question_id,w.snapshot FROM weekly_question_answers a JOIN weekly_question_assignments w ON w.pair_id=a.pair_id AND w.week=a.week WHERE a.pair_id=$1',[pairId])).map(a=>({user_id:a.user_id,question_id:weeklyOccurrence(a.week,a.question_id),choice:a.choice,snapshot:a.snapshot,answered_at:a.answered_at,mode:'weekly'} satisfies Answer));
  const history=rows.map(r=>revealWeekly({week:r.week,question:r.snapshot},answers,userId));
  return {weeklyQuestion:current?revealWeekly(current,answers,userId):null,weeklyHistory:history};
}
export async function answerWeeklyQuestion(pairId:string,userId:string,week:string,choice:number){
  await query('INSERT INTO weekly_question_answers(pair_id,week,user_id,choice) SELECT pair_id,week,$3,$4 FROM weekly_question_assignments WHERE pair_id=$1 AND week=$2 ON CONFLICT DO NOTHING',[pairId,week,userId,choice]);
  return (await query('SELECT week FROM weekly_question_assignments WHERE pair_id=$1 AND week=$2',[pairId,week])).length>0;
}
