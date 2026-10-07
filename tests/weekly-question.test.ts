import {test} from 'node:test';
import assert from 'node:assert/strict';
import {questionLabel} from '../lib/question-labels';
import {questions} from '../lib/questions';
import {knownTravelContext} from '../lib/preferences';
import {initialPreview,previewAnswer,previewDashboard,previewNextWeek,previewWeeklyAnswer} from '../lib/demo';
import {selectWeeklyQuestion,weeklyOccurrence} from '../lib/weekly-question-domain';
test('question labels distinguish investigation intent and category without asserting a hard boundary',()=>{
  assert.equal(questionLabel(questions.find(q=>q.id==='q061')!,knownTravelContext),'Open vraag');
  assert.equal(questionLabel(questions.find(q=>q.id==='q062')!),'Grens verkennen');
  assert.equal(questionLabel(questions.find(q=>q.id==='q063')!),'Persoonlijke wens');
  assert.equal(questionLabel(questions.find(q=>q.id==='q064')!),'Speelse ontdekking');
  assert.equal(questionLabel(questions.find(q=>q.type==='conflict')!),'Samen afstemmen');
  assert.equal(questionLabel(questions[0]),'Voorkeur');
});
test('a main question is stable within a week and separate from daily answers and totals',()=>{
  let state=initialPreview();const weekly=previewDashboard(state).weeklyQuestion!;
  state=previewAnswer(state,weekly.question.id,0);
  assert.equal(previewDashboard(state).weeklyQuestion?.own,null);
  state=previewWeeklyAnswer(state,weekly.week,1);
  assert.equal(previewDashboard(state).weeklyQuestion?.own,1);
  assert.equal(previewDashboard(state).history[0].own,0);
  assert.equal(previewDashboard(state).setTotals[0].completed,0);
  assert.equal(previewWeeklyAnswer(state,weekly.week,0),state);
});
test('weekly privacy is scoped to the same occurrence for both people',()=>{
  let state=initialPreview();const week=state.weeklyQuestions[0].week;
  state=previewWeeklyAnswer(state,week,0);state={...state,active:'roebie'};
  assert.equal(previewDashboard(state).weeklyQuestion?.partner,null);
  state=previewWeeklyAnswer(state,week,1);
  assert.equal(previewDashboard(state).weeklyQuestion?.partner,0);
  assert.equal(previewDashboard(state).weeklyQuestion?.same,false);
  state=previewNextWeek(state);
  assert.equal(previewDashboard(state).weeklyQuestion?.own,null);
  assert.equal(previewDashboard(state).weeklyQuestion?.partner,null);
});
test('main questions can recur after recent weeks, with fresh answers and preserved history',()=>{
  let state=initialPreview();const first=state.weeklyQuestions[0];
  state=previewWeeklyAnswer(state,first.week,0);
  for(let i=0;i<3;i++)state=previewNextWeek(state);
  const again=state.weeklyQuestions.at(-1)!;
  assert.equal(again.question.id,first.question.id);
  assert.notEqual(weeklyOccurrence(again.week,again.question.id),weeklyOccurrence(first.week,first.question.id));
  assert.equal(previewDashboard(state).weeklyQuestion?.own,null);
  state=previewWeeklyAnswer(state,again.week,1);
  assert.equal(previewDashboard(state).weeklyQuestion?.own,1);
  assert.equal(previewDashboard(state).weeklyHistory.find(q=>q.week===first.week)?.own,0);
  assert.equal(selectWeeklyQuestion(questions,[],state.answers,knownTravelContext)?.role,'core');
});
test('invalid or unassigned weekly answers leave test state intact; reset clears all occurrences',()=>{
  const state=initialPreview();
  assert.equal(previewWeeklyAnswer(state,'2099-01-01',0),state);
  assert.equal(previewWeeklyAnswer(state,state.weeklyQuestions[0].week,3),state);
  assert.equal(initialPreview().weeklyQuestions.length,1);
  assert.equal(initialPreview().weeklyAnswers.length,0);
});
