import type { Question } from './domain';
import type { Preference } from './preferences';
export function questionLabel(question:Question,preferences:Preference[]=[]){
  if(question.type==='conflict')return 'Samen afstemmen';
  if(question.type==='personal-dream'||question.role==='personal')return 'Persoonlijke wens';
  if(question.type==='boundary'||question.type==='conditional'||question.role==='boundary')return 'Grens verkennen';
  if(question.type==='wildcard')return 'Speelse ontdekking';
  if(preferences.some(p=>p.kind==='open_question'&&question.focus?.includes(p.attribute)))return 'Open vraag';
  return 'Voorkeur';
}
