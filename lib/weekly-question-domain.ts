import type { Answer, Question } from './domain';
import { reveal } from './domain';
import { selectTravelSet, type Preference } from './preferences';
export type WeeklyAssignment={week:string;question:Question};
export function selectWeeklyQuestion(bank:Question[],previous:WeeklyAssignment[],answers:Answer[],context:Preference[]){
  // Only recent weekly occurrences suppress a main question. Daily answers never do.
  const recent=[...previous].sort((a,b)=>b.week.localeCompare(a.week)).slice(0,2);
  return selectTravelSet(bank.filter(q=>q.role==='core'),recent.map(a=>a.question.id),answers,context,1)[0]??null;
}
export function weeklyOccurrence(week:string,questionId:string){return `weekly:${week}:${questionId}`;}
export function revealWeekly(assignment:WeeklyAssignment,answers:Answer[],userId:string){return {...assignment,...reveal(answers,userId,weeklyOccurrence(assignment.week,assignment.question.id))};}
