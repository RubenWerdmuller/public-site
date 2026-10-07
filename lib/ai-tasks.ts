import { randomUUID } from 'node:crypto';
import { query, type Query } from './db';
import type { User } from './auth';
import type { Question } from './domain';
import { isAiAdmin, nextAmsterdamWeek, validateBatch, type TaskKind, type TaskView } from './ai-contracts';

type Task = TaskView & { pair_id: string; created_by: string; receipt: string } & Record<string, unknown>;
export async function listTasks(user: User) {
  return query<TaskView & Record<string, unknown>>('SELECT id,kind,instruction,status,scheduled_at,created_at,result,pr_url,repeat_weekly FROM ai_tasks WHERE pair_id=$1 ORDER BY created_at DESC LIMIT 50', [user.pair_id]);
}
export async function enqueueTask(user: User, input: { kind: TaskKind; instruction: string; scheduledAt: string; repeatWeekly?: boolean }) {
  await query('INSERT INTO ai_tasks(id,pair_id,created_by,kind,instruction,scheduled_at,repeat_weekly) VALUES($1,$2,$3,$4,$5,$6,$7)', [randomUUID(), user.pair_id, user.id, input.kind, input.instruction, input.scheduledAt, input.kind === 'questions' && !!input.repeatWeekly]);
}
export async function changeTask(user: User, id: string, action: 'cancel' | 'retry') {
  return query('UPDATE ai_tasks SET status=$1,receipt=NULL,claimed_at=NULL,result=NULL WHERE id=$2 AND pair_id=$3 AND status=ANY($4::text[]) RETURNING id', [action === 'cancel' ? 'cancelled' : 'queued', id, user.pair_id, action === 'cancel' ? ['queued', 'failed'] : ['failed']]);
}
export async function availableBank(pairId: string, read: Query = query) {
  return (await read<{ content: Question } & Record<string, unknown>>(`SELECT q.content FROM questions q WHERE
    (NOT EXISTS(SELECT 1 FROM ai_question_ownership o WHERE o.question_id=q.id) OR EXISTS(SELECT 1 FROM ai_question_ownership o WHERE o.question_id=q.id AND o.pair_id=$1))
    AND NOT EXISTS(SELECT 1 FROM ai_question_retirements r WHERE r.question_id=q.id AND r.pair_id=$1) ORDER BY q.id`, [pairId])).map(r => r.content);
}
export async function claimTask(kind: TaskKind) {
  const emails = (process.env.AI_ADMIN_EMAILS ?? '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean);
  const rows = await query<Task>(`UPDATE ai_tasks SET status='running',receipt=$1,claimed_at=now(),result=NULL WHERE id=(
    SELECT t.id FROM ai_tasks t JOIN users u ON u.id=t.created_by JOIN memberships m ON m.user_id=u.id AND m.pair_id=t.pair_id
    WHERE t.status='queued' AND t.kind=$2 AND t.scheduled_at<=now() AND lower(u.email)=ANY($3::text[])
    ORDER BY t.scheduled_at,t.created_at FOR UPDATE OF t SKIP LOCKED LIMIT 1) RETURNING ai_tasks.*`, [randomUUID(), kind, emails]);
  const task = rows[0];
  if (!task) return null;
  if (kind === 'system') return { id: task.id, receipt: task.receipt, instruction: task.instruction };
  const bank = await availableBank(task.pair_id);
  // Only shared explicit values and jointly completed answers leave this boundary. No names, emails, individual estimates or notes.
  const preferences = await query(`SELECT p.attribute_key,p.kind,p.value,p.confidence,p.boundary FROM travel_preferences p JOIN preference_subjects s ON s.id=p.subject_id WHERE s.pair_id=$1 AND s.kind='couple' AND p.source='explicitly_stated' LIMIT 100`, [task.pair_id]);
  const completed = await query(`SELECT a.snapshot->>'theme' AS theme,count(*)::int AS answer_count FROM answers a WHERE a.pair_id=$1
    AND (SELECT count(*) FROM memberships WHERE pair_id=$1)=2
    AND (SELECT count(DISTINCT b.user_id) FROM answers b JOIN memberships m ON m.user_id=b.user_id AND m.pair_id=b.pair_id WHERE b.pair_id=a.pair_id AND b.question_id=a.question_id)=2
    GROUP BY a.snapshot->>'theme' ORDER BY count(*) DESC LIMIT 30`, [task.pair_id]);
  const sharedScores = await query(`SELECT e.key AS attribute,avg((e.value #>> '{}')::real)::real AS average,count(*)::int AS observations
    FROM answers a JOIN memberships m ON m.user_id=a.user_id AND m.pair_id=a.pair_id
    CROSS JOIN LATERAL jsonb_each(a.snapshot->'options'->a.choice->'attributes') e
    WHERE a.pair_id=$1 AND jsonb_typeof(e.value)='number' AND (SELECT count(*) FROM memberships WHERE pair_id=$1)=2
    AND (SELECT count(DISTINCT b.user_id) FROM answers b JOIN memberships n ON n.user_id=b.user_id AND n.pair_id=b.pair_id WHERE b.pair_id=a.pair_id AND b.question_id=a.question_id)=2
    GROUP BY e.key LIMIT 40`, [task.pair_id]);
  return { id: task.id, receipt: task.receipt, instruction: task.instruction, context: { questions: bank.slice(-150), preferences, completedThemes: completed, sharedScores } };
}
export async function publishQuestions(id: string, receipt: string, raw: unknown) {
  const [task] = await query<Task>("SELECT * FROM ai_tasks WHERE id=$1 AND receipt=$2 AND status='running' AND kind='questions'", [id, receipt]);
  if (!task) return false;
  const validated = validateBatch(raw, id, await availableBank(task.pair_id));
  const questions = validated.questions.map(q => ({ id: q.content.id, content: q.content, source_id: q.sourceQuestionId }));
  const options = validated.questions.flatMap(q => q.content.options.map((content, choice) => ({ question_id: q.content.id, choice, content })));
  const attrs = options.flatMap(o => Object.entries(o.content.attributes).map(([key, value]) => ({ question_id: o.question_id, choice: o.choice, key, value, value_id: `${key}:${JSON.stringify(value)}`, value_type: typeof value })));
  // All rows and the publication state commit together. Existing questions and answer snapshots are never updated.
  const rows = await query(`WITH guard AS (
    SELECT * FROM ai_tasks WHERE id=$1 AND receipt=$2 AND status='running' AND kind='questions' FOR UPDATE
  ), new_questions AS (
    INSERT INTO questions SELECT x.id,x.content FROM jsonb_to_recordset($3::jsonb) AS x(id text,content jsonb) CROSS JOIN guard ON CONFLICT DO NOTHING RETURNING id
  ), ownership AS (
    INSERT INTO ai_question_ownership SELECT x.id,g.pair_id,g.id FROM jsonb_to_recordset($3::jsonb) AS x(id text) CROSS JOIN guard g JOIN new_questions n ON n.id=x.id ON CONFLICT DO NOTHING
  ), retirements AS (
    INSERT INTO ai_question_retirements SELECT g.pair_id,x.source_id,g.id FROM jsonb_to_recordset($3::jsonb) AS x(source_id text) CROSS JOIN guard g WHERE x.source_id IS NOT NULL ON CONFLICT DO NOTHING
  ), new_options AS (
    INSERT INTO question_options SELECT x.question_id,x.choice,x.content FROM jsonb_to_recordset($4::jsonb) AS x(question_id text,choice integer,content jsonb) JOIN new_questions n ON n.id=x.question_id
  ), new_attrs AS (
    INSERT INTO attributes SELECT DISTINCT x.key,x.value_type FROM jsonb_to_recordset($5::jsonb) AS x(key text,value_type text) CROSS JOIN guard ON CONFLICT DO NOTHING RETURNING key
  ), new_values AS (
    INSERT INTO attribute_values SELECT DISTINCT x.value_id,x.key,x.value FROM jsonb_to_recordset($5::jsonb) AS x(value_id text,key text,value jsonb) CROSS JOIN guard ON CONFLICT DO NOTHING RETURNING id
  ), option_attrs AS (
    INSERT INTO question_option_attributes SELECT x.question_id,x.choice,x.key,x.value_id FROM jsonb_to_recordset($5::jsonb) AS x(question_id text,choice integer,key text,value_id text) JOIN new_questions n ON n.id=x.question_id
  ) UPDATE ai_tasks SET status='published',result=$6,finished_at=now() WHERE id IN(SELECT id FROM guard) RETURNING id`, [id, receipt, JSON.stringify(questions), JSON.stringify(options), JSON.stringify(attrs), `${validated.questions.length} vragen gepubliceerd. ${validated.summary}`]);
  return rows.length > 0;
}
export async function finishTask(id: string, receipt: string, status: 'failed' | 'review' | 'published', result: string, prUrl?: string) {
  return query(`UPDATE ai_tasks SET status=$3,result=$4,pr_url=coalesce($5,pr_url),finished_at=now() WHERE id=$1 AND receipt=$2 AND
    (status='running' AND $3 IN('failed','review') OR status='review' AND $3 IN('failed','published')) RETURNING id`, [id, receipt, status, result, prUrl ?? null]);
}
export async function pipelineReviews() { return query("SELECT id,receipt,pr_url FROM ai_tasks WHERE status='review' AND kind='system' LIMIT 20"); }
export async function pipelineTick() {
  await query("UPDATE ai_tasks SET status='failed',result='Uitvoering onderbroken. Controleer het resultaat en probeer opnieuw.',finished_at=now() WHERE status='running' AND claimed_at<now()-interval '2 hours'");
  const recurring = await query<Task>("SELECT * FROM ai_tasks t WHERE t.repeat_weekly AND t.status='published' AND NOT EXISTS(SELECT 1 FROM ai_tasks child WHERE child.parent_task_id=t.id) LIMIT 50");
  for (const task of recurring) {
    let next = nextAmsterdamWeek(new Date(task.scheduled_at).toISOString());
    while (new Date(next).getTime() < Date.now()) next = nextAmsterdamWeek(next);
    await query("INSERT INTO ai_tasks(id,pair_id,created_by,kind,instruction,scheduled_at,repeat_weekly,parent_task_id) VALUES($1,$2,$3,'questions',$4,$5,true,$6) ON CONFLICT(parent_task_id) DO NOTHING", [randomUUID(), task.pair_id, task.created_by, task.instruction, next, task.id]);
  }
}
export { isAiAdmin };
