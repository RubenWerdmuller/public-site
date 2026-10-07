import { CHARACTERS, type CharacterId } from './characters';
import { createReport, insights, localDay, reveal, weekKey, type Answer } from './domain';
import { questions } from './questions';
import { completedSetCount, knownTravelContext, selectTravelSet, type Preference } from './preferences';
import type { dashboard } from './service';
import { revealWeekly, selectWeeklyQuestion, weeklyOccurrence, type WeeklyAssignment } from './weekly-question-domain';

export type PreviewState = { active: CharacterId; answers: Answer[]; saved: string[]; roebieCap: boolean; feedback: string | null; sets:string[][]; cursors:Record<CharacterId,number>; preferences:Preference[]; weeklyQuestions:WeeklyAssignment[]; weeklyAnswers:Answer[] };
export const previewQuestions = selectTravelSet(questions, [], [], knownTravelContext);
export function initialPreview(): PreviewState { return { active: CHARACTERS.oelie.id, answers: [], saved: [], roebieCap: true, feedback: null, sets:[previewQuestions.map(q=>q.id)],cursors:{oelie:0,roebie:0},preferences:structuredClone(knownTravelContext),weeklyQuestions:[{week:weekKey(),question:selectWeeklyQuestion(questions,[],[],knownTravelContext)!}],weeklyAnswers:[] }; }
export function previewWeeklyAnswer(state:PreviewState,week:string,choice:number):PreviewState {
  const assignment=state.weeklyQuestions.find(q=>q.week===week);if(!assignment||(choice!==0&&choice!==1))return state;
  const id=weeklyOccurrence(week,assignment.question.id);if(state.weeklyAnswers.some(a=>a.user_id===state.active&&a.question_id===id))return state;
  return {...state,weeklyAnswers:[...state.weeklyAnswers,{user_id:state.active,question_id:id,choice,snapshot:assignment.question,answered_at:new Date().toISOString(),mode:'weekly'}]};
}
export function previewNextWeek(state:PreviewState):PreviewState {
  const last=state.weeklyQuestions.at(-1)!;const day=new Date(`${last.week}T12:00:00Z`);day.setUTCDate(day.getUTCDate()+7);
  const question=selectWeeklyQuestion(questions,state.weeklyQuestions,state.weeklyAnswers,state.preferences);if(!question)return state;
  return {...state,weeklyQuestions:[...state.weeklyQuestions,{week:day.toISOString().slice(0,10),question}]};
}
export function previewNextSet(state:PreviewState):PreviewState {
  const cursor=state.cursors[state.active];const current=state.sets[cursor];
  if(current.some(id=>!state.answers.some(a=>a.user_id===state.active&&a.question_id===id)&&!state.saved.includes(id)))return state;
  const sets=[...state.sets];
  if(!sets[cursor+1]){const picked=selectTravelSet(questions,sets.flat(),state.answers,state.preferences);if(!picked.length)return state;sets.push(picked.map(q=>q.id));}
  return {...state,sets,cursors:{...state.cursors,[state.active]:cursor+1}};
}
export function previewAnswer(state: PreviewState, questionId: string, choice: number): PreviewState {
  const question = questions.find(q => q.id === questionId);
  if (!question || (!state.sets.flat().includes(questionId) && !state.saved.includes(questionId)) || (choice !== 0 && choice !== 1) || state.answers.some(a => a.user_id === state.active && a.question_id === questionId)) return state;
  const answers = [...state.answers, { user_id: state.active, question_id: questionId, choice, snapshot: question, answered_at: new Date().toISOString(), mode: state.saved.includes(questionId) ? 'later' : 'daily' }];
  const saved = state.saved.filter(id => !Object.keys(CHARACTERS).every(user => answers.some(a => a.user_id === user && a.question_id === id)));
  return { ...state, answers, saved };
}
export function previewWeek(state: PreviewState): PreviewState {
  // Explicit example data for exploring report layout; never merged into live data.
  const extra: Answer[] = questions.filter(q=>q.role).slice(4, 10).flatMap((q, i) => Object.values(CHARACTERS).map(person => person.id).map(user => ({ user_id: user, question_id: q.id, choice: user === CHARACTERS.roebie.id && i % 3 === 0 ? 1 : 0, snapshot: q, answered_at: new Date().toISOString(), mode: 'example' }))).filter(a => !state.answers.some(existing => existing.user_id === a.user_id && existing.question_id === a.question_id));
  return { ...state, answers: [...state.answers, ...extra] };
}
export function previewDashboard(state: PreviewState): Awaited<ReturnType<typeof dashboard>> {
  const members = Object.values(CHARACTERS).map(person => ({ id: person.id, name: person.name, avatar: person.id === CHARACTERS.roebie.id && !state.roebieCap ? CHARACTERS.roebie.withoutCapAvatar : person.avatar }));
  const active = members.find(m => m.id === state.active)!;
  const enrich = (q: typeof questions[number]) => ({ ...q, ...reveal(state.answers, state.active, q.id) });
  const paired = state.answers.filter(a => members.every(m => state.answers.some(b => b.user_id === m.id && b.question_id === a.question_id)));
  return {
    user: { ...active, email: '', pair_id: 'preview' }, members,preferences:state.preferences,
    weeklyQuestion:revealWeekly(state.weeklyQuestions.at(-1)!,state.weeklyAnswers,state.active),
    weeklyHistory:[...state.weeklyQuestions].reverse().map(q=>revealWeekly(q,state.weeklyAnswers,state.active)),
    questions: state.sets[state.cursors[state.active]].map(id=>questions.find(q=>q.id===id)!).map(enrich),
    set:{id:`preview:${state.cursors[state.active]}`,ordinal:state.cursors[state.active]+1},
    setTotals:members.map(m=>({userId:m.id,name:m.name,avatar:m.avatar,completed:completedSetCount(state.sets.map(questionIds=>({questionIds})),state.answers,m.id)})),
    setArchive:state.sets.map((ids,i)=>({id:`preview:${i}`,day:localDay(),ordinal:i+1,questions:ids.map(id=>enrich(questions.find(q=>q.id===id)!))})).reverse(),
    saved: state.saved.map(id => questions.find(q => q.id === id)!).filter(Boolean).map(enrich),
    history: [...new Set(state.answers.map(a => a.question_id))].map(id => enrich(questions.find(q => q.id === id)!)).reverse(),
    insights: insights(paired, members.map(m => m.id)),
    report: { id: 'preview', week: weekKey(), content: createReport(paired, members.map(m => m.id)) },
    invite: '', pushConfigured: false, day: localDay(),
  };
}
