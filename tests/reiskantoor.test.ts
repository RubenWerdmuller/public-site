import test from 'node:test';
import assert from 'node:assert/strict';
import {starterPlan,validatePlan,createProposals,planWarnings,learnPreferences,nextChoiceTask,choiceTasks,type TripPlan} from '../lib/reiskantoor';

test('default itinerary is feasible and spans exactly the requested duration',()=>{
 const p=structuredClone(starterPlan);
 assert.deepEqual(validatePlan(p),[]);
 const proposals=createProposals(p);
 assert.equal(proposals.length,3);
 for(const proposal of proposals){
   assert.equal(proposal.weeks.reduce((a,b)=>a+b,0),p.weeks);
   proposal.weeks.forEach((weeks,i)=>{
     assert.ok(weeks>=p.stages[i].minWeeks&&weeks<=p.stages[i].maxWeeks);
   });
 }
});
test('locked legs stay unchanged across every suggested itinerary',()=>{
 const p=structuredClone(starterPlan);
 p.stages[0].locked=true;p.stages[0].idealWeeks=3;
 p.stages[2].locked=true;p.stages[2].idealWeeks=3;
 for(const proposal of createProposals(p)){
   assert.equal(proposal.weeks[0],3);
   assert.equal(proposal.weeks[2],3);
 }
});
test('infeasible constraints warn and do not invent itinerary recommendations',()=>{
 const p=structuredClone(starterPlan);
 p.weeks=6;
 assert.deepEqual(createProposals(p),[]);
 assert.ok(planWarnings(p).some(s=>s.includes('minimumduur')));
});
test('unquoted price estimates are not fabricated',()=>{
 const p=structuredClone(starterPlan);
 assert.equal(createProposals(p)[0].cost,null);
 p.stages=p.stages.map(s=>({...s,weeklyBudget:400}));
 for(const proposal of createProposals(p)){
   assert.equal(proposal.cost,p.weeks*400);
 }
});
test('reject duplicate IDs, invalid ranges and too many stages',()=>{
 const p=structuredClone(starterPlan);
 p.stages[1].id=p.stages[0].id;
 p.stages[0].minWeeks=5;p.stages[0].idealWeeks=3;
 assert.ok(validatePlan(p).length>=2);
 p.stages=Array(13).fill(null).map((_,i)=>({...starterPlan.stages[0],id:'s'+i}));
 assert.ok(validatePlan(p).length>0);
});
test('Bayesian regularized logistic posterior moves when same option is chosen repeatedly',()=>{
 const baseline=learnPreferences([]);
 const task=choiceTasks[0];
 const first=learnPreferences([{taskId:task.id,choice:0}]);
 assert.equal(baseline.count,0);
 assert.equal(first.count,1);
 // Picking A rather than B yields a positive linear utility difference.
 const delta=[(task.b.budget-task.a.budget)/250,(task.a.dwell-task.b.dwell)/3,(task.b.drive-task.a.drive)/6,(task.a.nature-task.b.nature)/4,(task.a.comfort-task.b.comfort)/4,(task.a.community-task.b.community)/4];
 assert.ok(delta.reduce((v,x,i)=>v+x*first.means[i],0)>0);
 assert.ok(first.uncertainty.every(v=>Number.isFinite(v)&&v>0));
});
test('adaptive selector never repeats completed choice tasks',()=>{
 const completed=[{taskId:choiceTasks[0].id,choices:[0,1] as (0|1)[]}];
 const next=nextChoiceTask(completed);
 assert.ok(next);
 assert.notEqual(next!.id,completed[0].taskId);
 assert.equal(nextChoiceTask(choiceTasks.map(t=>({taskId:t.id,choices:[0,1] as (0|1)[]}))),null);
});
test('budget pressure and a locked stop still preserve the full itinerary',()=>{
 const p:TripPlan=structuredClone(starterPlan);
 p.maxBudget=4500;p.stages[0].locked=true;p.stages[0].weeklyBudget=600;p.stages[1].weeklyBudget=250;p.stages[2].weeklyBudget=500;
 const proposals=createProposals(p);
 assert.deepEqual(proposals,[]);
 assert.ok(planWarnings(p).some(w=>w.includes('totaalbudget')));
 p.maxBudget=6500;
 for(const proposal of createProposals(p)){
   assert.equal(proposal.weeks[0],3);
   assert.equal(proposal.weeks.reduce((v,w)=>v+w,0),16);
   assert.ok(proposal.cost!==null&&proposal.cost<=6500);
 }
});
