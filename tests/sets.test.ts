import { test } from 'node:test';
import assert from 'node:assert/strict';
import { questions } from '../lib/questions';
import { knownTravelContext, selectTravelSet, completedSetCount } from '../lib/preferences';
import { initialPreview, previewAnswer, previewDashboard, previewNextSet, previewQuestions } from '../lib/demo';

test('new sets cover a core, boundary, personal and playful question without flying',()=>{
  const picked=selectTravelSet(questions,[],[],knownTravelContext);
  assert.deepEqual(picked.map(q=>q.role),['core','boundary','personal','wildcard']);
  assert.ok(picked.every(q=>q.options.every(o=>o.attributes.transport!=='flight')));
  assert.equal(questions.filter(q=>q.role).length,64);
});
test('explicit context preserves uncertainties and does not invent Oelie’s wish',()=>{
  const duration=knownTravelContext.find(p=>p.attribute==='months')!;
  assert.equal(duration.kind,'open_question');assert.equal(duration.boundary?.hard,undefined);
  assert.equal(knownTravelContext.find(p=>p.attribute==='vegetarian')?.kind,'soft_constraint');
  assert.equal(knownTravelContext.find(p=>p.attribute==='sailing')?.subject,'roebie');
  assert.equal(knownTravelContext.find(p=>p.subject==='oelie')?.value,null);
});
test('hard numeric constraints filter while soft preferences retain contrasting questions',()=>{
  const hard={...knownTravelContext.find(p=>p.attribute==='temperature')!,kind:'hard_constraint' as const,boundary:{unit:'°C',hard:[20,30] as [number,number]}};
  const thermal=questions.filter(q=>q.role==='boundary'&&q.focus?.includes('temperature'));
  assert.ok(selectTravelSet(thermal,[],[],knownTravelContext).length>0);
  assert.equal(selectTravelSet(thermal,[],[],[hard]).length,0);
});
test('total sets are counted independently from complete answers, not saves',()=>{
  let state=initialPreview();const ids=state.sets[0];
  state={...state,saved:[ids[3]]};
  for(const id of ids.slice(0,3))state=previewAnswer(state,id,0);
  assert.equal(previewDashboard(state).setTotals[0].completed,0);
  state=previewAnswer(state,ids[3],0);
  const totals=previewDashboard(state).setTotals;
  assert.equal(totals[0].completed,1);assert.equal(totals[1].completed,0);
  assert.equal(completedSetCount([{questionIds:[]}],state.answers,state.active),0);
  assert.equal(completedSetCount([{questionIds:ids}],state.answers.map(a=>({...a,mode:'example'})),state.active),0);
});
test('a partner follows the same next set, with an independent cursor and no repeat',()=>{
  let state=initialPreview();for(const id of state.sets[0])state=previewAnswer(state,id,0);
  const original=state;state=previewNextSet(state);
  assert.equal(original.sets.length,1);assert.equal(state.sets.length,2);
  assert.ok(state.sets[1].every(id=>!state.sets[0].includes(id)));
  state={...state,active:'roebie'};
  assert.equal(previewDashboard(state).set?.ordinal,1);
  for(const id of state.sets[0])state=previewAnswer(state,id,1);
  state=previewNextSet(state);
  assert.equal(state.sets.length,2);assert.equal(state.cursors.roebie,1);
  assert.ok(previewDashboard(state).questions.every(q=>q.partner===null));
});
test('unfinished sets cannot advance, saved sets can but are not counted',()=>{
  const original=initialPreview();assert.equal(previewNextSet(original),original);
  const saved={...original,saved:[...original.sets[0]]};const next=previewNextSet(saved);
  assert.equal(next.sets.length,2);assert.equal(previewDashboard(next).setTotals[0].completed,0);
  assert.equal(previewAnswer(original,'q060',0),original);
});
test('all sixteen new sets are unique and exhaustion leaves state unchanged',()=>{
  let state=initialPreview();
  for(let i=0;i<16;i++){
    for(const id of state.sets[state.cursors.oelie])state=previewAnswer(state,id,0);
    if(i<15)state=previewNextSet(state);
  }
  assert.equal(new Set(state.sets.flat()).size,64);
  assert.equal(previewDashboard(state).setTotals[0].completed,16);
  assert.equal(previewNextSet(state),state);
  assert.deepEqual(previewQuestions.map(q=>q.id),initialPreview().sets[0]);
});
