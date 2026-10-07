import { CHARACTERS, type CharacterId } from './characters';
import { createReport, insights, localDay, questionSelector, reveal, weekKey, type Answer } from './domain';
import { questions } from './questions';
import type { dashboard } from './service';

export type PreviewState = { active: CharacterId; answers: Answer[]; saved: string[]; roebieCap: boolean; feedback: string | null };
export const previewQuestions = questionSelector(questions, [], [], 4);
export function initialPreview(): PreviewState { return { active: CHARACTERS.oelie.id, answers: [], saved: [], roebieCap: true, feedback: null }; }
export function previewAnswer(state: PreviewState, questionId: string, choice: number): PreviewState {
  const question = questions.find(q => q.id === questionId);
  if (!question || (choice !== 0 && choice !== 1) || state.answers.some(a => a.user_id === state.active && a.question_id === questionId)) return state;
  const answers = [...state.answers, { user_id: state.active, question_id: questionId, choice, snapshot: question, answered_at: new Date().toISOString(), mode: state.saved.includes(questionId) ? 'later' : 'daily' }];
  const saved = state.saved.filter(id => !Object.keys(CHARACTERS).every(user => answers.some(a => a.user_id === user && a.question_id === id)));
  return { ...state, answers, saved };
}
export function previewWeek(state: PreviewState): PreviewState {
  // Explicit example data for exploring report layout; never merged into live data.
  const extra: Answer[] = questions.slice(5, 11).flatMap((q, i) => Object.values(CHARACTERS).map(person => person.id).map(user => ({ user_id: user, question_id: q.id, choice: user === CHARACTERS.roebie.id && i % 3 === 0 ? 1 : 0, snapshot: q, answered_at: new Date().toISOString(), mode: 'daily' }))).filter(a => !state.answers.some(existing => existing.user_id === a.user_id && existing.question_id === a.question_id));
  return { ...state, answers: [...state.answers, ...extra] };
}
export function previewDashboard(state: PreviewState): Awaited<ReturnType<typeof dashboard>> {
  const members = Object.values(CHARACTERS).map(person => ({ id: person.id, name: person.name, avatar: person.id === CHARACTERS.roebie.id && !state.roebieCap ? CHARACTERS.roebie.withoutCapAvatar : person.avatar }));
  const active = members.find(m => m.id === state.active)!;
  const enrich = (q: typeof questions[number]) => ({ ...q, ...reveal(state.answers, state.active, q.id) });
  const paired = state.answers.filter(a => members.every(m => state.answers.some(b => b.user_id === m.id && b.question_id === a.question_id)));
  return {
    user: { ...active, email: '', pair_id: 'preview' }, members,
    questions: previewQuestions.map(enrich),
    saved: state.saved.map(id => questions.find(q => q.id === id)!).filter(Boolean).map(enrich),
    history: [...new Set(state.answers.map(a => a.question_id))].map(id => enrich(questions.find(q => q.id === id)!)).reverse(),
    insights: insights(paired, members.map(m => m.id)),
    report: { id: 'preview', week: weekKey(), content: createReport(paired, members.map(m => m.id)) },
    invite: '', pushConfigured: false, day: localDay(),
  };
}
