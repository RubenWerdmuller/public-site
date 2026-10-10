import test from 'node:test';
import assert from 'node:assert/strict';
import {starterPlan,validatePlan,createProposals,planWarnings,learnPreferences,nextChoiceTask,choiceTasks,stageTasks,nextTravelQuestion,inferTravelFromChoices,preferenceRanking,type TripPlan} from '../lib/reiskantoor';

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
 p.weeks=4;
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


test("stages are discovered from the question flow, not initialized as a user's itinerary",()=>{
 const initial=inferTravelFromChoices([]);
 assert.equal(initial.plan,null);
 const onlyLength=inferTravelFromChoices([{taskId:stageTasks[0].id,choices:[0,1]}]);
 assert.equal(onlyLength.plan,null);
 assert.equal(onlyLength.completed,1);
});
test('a joint set of stage answers yields a complete trip whose weeks add up exactly',()=>{
 const ids=['stage-duration-v1','stage-outbound-v1','stage-return-v1','stage-bases-v1','stage-extra-v1','stage-direction-v1'];
 const completed=ids.map(taskId=>({taskId,choices:[0,1] as (0|1)[]}));
 const result=inferTravelFromChoices(completed);
 assert.ok(result.plan);
 assert.equal(result.plan.weeks,18);
 assert.equal(result.plan.stages.reduce((sum,stage)=>sum+stage.idealWeeks,0),18);
 assert.deepEqual(validatePlan(result.plan),[]);
 assert.equal(result.disagreements.length,6);
 assert.equal(result.routeIdeas.length,2);
});
test('stage questions are offered before preference experiments and not repeated',()=>{
 const first=nextTravelQuestion([]);
 assert.equal(first?.id,'stage-duration-v1');
 const allStages=stageTasks.map(q=>({taskId:q.id,choices:[0,0] as (0|1)[]}));
 const after=nextTravelQuestion(allStages);
 assert.ok(after);
 assert.ok(choiceTasks.some(task=>task.id===after?.id));
});
test('the scientific ranking is ordered, conveys uncertainty and is empty only in the UI before evidence',()=>{
 const answers=choiceTasks.slice(0,5).map(task=>({taskId:task.id,choice:0 as const}));
 const result=learnPreferences(answers);
 const ranks=preferenceRanking(result);
 assert.equal(ranks.length,6);
 for(let i=1;i<ranks.length;i++)assert.ok(ranks[i-1].weight>=ranks[i].weight);
 assert.ok(ranks.every(r=>r.uncertainty>0&&Number.isFinite(r.weight)));
});


import {inferScientificItinerary,nextScientificQuestion} from '../lib/itinerary-science';
const response=(taskId:string,a:0|1,b:0|1=a)=>({taskId,choices:[a,b] as (0|1)[]});
const essential=[
 response('stage-duration-v1',0,1),
 response('stage-outbound-v1',0,1),
 response('stage-return-v1',0,1),
 response('stage-bases-v1',0,1),
];
test('scientific plan requires jointly answered core stages',()=>{
 const incomplete=inferScientificItinerary(essential.slice(0,3));
 assert.equal(incomplete.plan,null);
 assert.ok(incomplete.evidence.unanswered.includes('stage-bases-v1'));
 const complete=inferScientificItinerary(essential);
 assert.ok(complete.plan);
 assert.equal(complete.plan.weeks,18);
 assert.equal(complete.plan.stages.reduce((sum,s)=>sum+s.idealWeeks,0),18);
 assert.deepEqual(validatePlan(complete.plan),[]);
 assert.ok(complete.plan.stages.filter(s=>s.kind==='stay').every(s=>s.idealWeeks>=2));
});
test('four stops of five days are constrained by the outbound leg, not added on top',()=>{
 const rows=[
  ...essential,
  response('stage-outbound-stops-v2',1),
  response('stage-return-stops-v2',1),
  response('stage-stop-days-v2',1),
  response('stage-stay-min-v2',0),
 ];
 const result=inferScientificItinerary(rows);
 assert.ok(result.plan);
 const outbound=result.legs.find(l=>l.stageId==='answer-out')!;
 const returning=result.legs.find(l=>l.stageId==='answer-return')!;
 assert.equal(outbound.requestedStops,4);
 assert.equal(outbound.stops.length,4);
 assert.ok(outbound.days>=4*5+5);
 assert.ok(returning.days>=3*5+4);
 assert.ok(outbound.unallocatedDays!==null&&outbound.unallocatedDays>=0);
 assert.equal(result.plan.stages.reduce((n,s)=>n+s.idealWeeks,0),result.plan.weeks);
});
test('if chosen stop durations and long stays cannot fit, no fake feasible plan is returned',()=>{
 const rows=[
  response('stage-duration-v1',0),response('stage-outbound-v1',1),
  response('stage-return-v1',1),response('stage-bases-v1',1),
  response('stage-stay-min-v2',1),response('stage-outbound-stops-v2',1),
  response('stage-return-stops-v2',1),response('stage-stop-days-v2',1),
 ];
 const result=inferScientificItinerary(rows);
 assert.equal(result.plan,null);
 assert.ok(result.conflicts.some(c=>c.includes('niet samen')));
 assert.deepEqual(result.alternatives,[]);
});
test('different departure seasons stay unresolved, monthly spending is not presented as a cost quote',()=>{
 const rows=[...essential,response('stage-departure-v2',0,1),response('stage-budget-v2',0,1)];
 const result=inferScientificItinerary(rows);
 assert.equal(result.plan?.departureMonth,0);
 assert.ok(result.plan?.maxBudget);
 assert.ok(result.warnings.some(w=>w.includes('geen actuele kosten')));
});
test('the optimiser creates distinct full-trip alternatives with exact budgets and minimum long stays',()=>{
 const rows=[...essential,response('stage-stay-min-v2',1),response('stage-buffer-v2',1),response('stage-extra-v1',1)];
 const result=inferScientificItinerary(rows);
 assert.ok(result.plan);
 const signatures=new Set(result.alternatives.map(a=>a.plan.weeks+':'+a.plan.stages.filter(s=>s.kind==='stay').length));
 assert.equal(signatures.size,result.alternatives.length);
 assert.ok(result.alternatives.length>=2);
 for(const option of result.alternatives){
  assert.equal(option.plan.stages.reduce((n,s)=>n+s.idealWeeks,0),option.plan.weeks);
  assert.ok(option.plan.stages.filter(s=>s.kind==='stay').every(s=>s.idealWeeks>=4));
  assert.deepEqual(validatePlan(option.plan),[]);
  assert.equal(option.verifiedDestination,false);
 }
});
test('the evidence-first questions prioritise missing long-stay and nested stop constraints',()=>{
 const next=nextScientificQuestion(essential);
 assert.equal(next?.id,'stage-stay-min-v2');
 const all=stageTasks.map(q=>response(q.id,0));
 const dce=nextScientificQuestion(all);
 assert.ok(dce&&scientificChoiceTasks.some(c=>c.id===dce.id));
 const finished=[...all,...scientificChoiceTasks.map(q=>response(q.id,0))];
 assert.equal(nextScientificQuestion(finished),null);
});
test('ideas are conditional on the couple actually answering a stay-style question together',()=>{
 const unknown=inferScientificItinerary(essential);
 assert.ok(unknown.ideas.some(x=>x.includes('Vergelijk')));
 const nature=inferScientificItinerary([...essential,response('stage-stay-focus-v2',0)]);
 const learning=inferScientificItinerary([...essential,response('stage-stay-focus-v2',1)]);
 assert.ok(nature.ideas.some(x=>x.includes('natuurplek')));
 assert.ok(learning.ideas.some(x=>x.includes('workshopgemeenschap')));
 assert.ok(!learning.ideas.some(x=>x.includes('natuurplek')));
});


import {predictChoiceProbability,evaluatePreferenceModel} from '../lib/reiskantoor';
import {verifyTripOffer,onlyVerifiedOffers,type VerifiedTripOffer} from '../lib/destination-research';
test('posterior predictive check requires data and uses an explicit chance baseline',()=>{
 const small=evaluatePreferenceModel(choiceTasks.slice(0,4).map(q=>({taskId:q.id,choice:0 as const})));
 assert.equal(small.looBrier,null);
 const answers=choiceTasks.slice(0,10).map(q=>({taskId:q.id,choice:0 as const}));
 const large=evaluatePreferenceModel(answers);
 assert.equal(large.observations,10);
 assert.ok(large.looBrier!==null&&large.looBrier>=0&&large.looBrier<=1);
 assert.equal(large.baselineBrier,.25);
 const p=predictChoiceProbability(learnPreferences(answers),choiceTasks[0]);
 assert.ok(p>0&&p<1);
});
test('unverified AI output cannot masquerade as bookable destination plan',()=>{
 const moment='2026-10-10T12:00:00Z';
 const source={sourceUrl:'https://example.org/itinerary-reference',checkedAt:moment,provider:'Test provider'};
 const base:VerifiedTripOffer={
  id:'scenario-a',name:'Synthetisch testscenario',createdByAi:true,sourceType:'connected_provider',
  places:[
   {id:'a',name:'Sample A',country:'NL',lat:52.09,lon:5.12,evidence:source},
   {id:'b',name:'Sample B',country:'BE',lat:50.85,lon:4.35,evidence:source},
  ],
  legs:[{fromId:'a',toId:'b',estimatedMinutes:140,travelMode:'car',evidence:source}],
  stays:[{placeId:'b',startDate:'2027-04-01',endDate:'2027-04-07',available:null,priceEuro:null,priceEvidence:null,availabilityEvidence:null}],
 };
 assert.equal(verifyTripOffer(base,moment).valid,true);
 assert.equal(verifyTripOffer(base,moment).isBookable,false);
 const outdated=structuredClone(base);
 outdated.legs[0].evidence.checkedAt='2025-01-01';
 assert.equal(verifyTripOffer(outdated,moment).valid,false);
 const broken=structuredClone(base);
 broken.legs[0].toId='a';
 assert.equal(onlyVerifiedOffers([broken],moment).length,0);
 const invented=structuredClone(base);
 invented.places[0].evidence.sourceUrl='not-a-url';
 assert.ok(verifyTripOffer(invented,moment).issues.some(issue=>issue.includes('https')));
});


test('one-base and two-base interpretations remain available when the travellers disagree',()=>{
 const result=inferScientificItinerary(essential);
 assert.ok(result.plan);
 const counts=new Set(result.alternatives.filter(a=>a.plan.weeks===18).map(a=>a.plan.stages.filter(s=>s.kind==='stay').length));
 assert.deepEqual([...counts].sort(),[1,2]);
 assert.ok(result.alternatives.some(a=>a.tradeoffs.some(x=>x.includes('aantal lange verblijven'))));
});


import {scientificChoiceTasks,studyQuality,studyTaskById} from '../lib/dce-design';
import {studyAnswers,studyModel,studyEvidence,studyRanking,studyValidation,
 nextStudyTask,archiveAttentionFromEvidence,legacyReportBrief} from '../lib/dce-science';
test('the new study is versioned and has no dominated alternatives',()=>{
 const q=studyQuality();
 assert.equal(q.count,48);
 assert.equal(q.holdout,6);
 assert.equal(q.dominated,0);
 assert.equal(q.rank,6);
 assert.equal(new Set(scientificChoiceTasks.map(t=>t.id)).size,48);
 assert.ok(q.frequency.every(n=>n>8));
 const first=studyTaskById('dce3-001');
 assert.equal(first?.id,'dce3-001');
 assert.deepEqual(studyQuality(),q);
});
test('holdouts are reserved at predeclared intervals independent from partner answers',()=>{
 const training=scientificChoiceTasks.filter(t=>t.studyRole==='estimate');
 const chosen=training.slice(0,7).map(t=>({taskId:t.id,choices:[0,1] as (0|1)[]}));
 const next=nextStudyTask(chosen);
 assert.equal(next?.studyRole,'holdout');
 const post=nextStudyTask([...chosen,{taskId:next!.id,choices:[1,0]}]);
 assert.equal(post?.studyRole,'estimate');
 const old=nextStudyTask([]);
 assert.equal(old?.studyRole,'estimate');
 const completed=scientificChoiceTasks.map(t=>({taskId:t.id,choices:[0,1] as (0|1)[]}));
 assert.equal(nextStudyTask(completed),null);
});
test('hidden holdout answers are not counted toward fitting the personal Bayesian model',()=>{
 const est=scientificChoiceTasks.filter(t=>t.studyRole==='estimate').slice(0,8).map(t=>({taskId:t.id,choice:0 as const}));
 const hold=scientificChoiceTasks.find(t=>t.studyRole==='holdout')!;
 const baseline=studyModel(est);
 const withHold=studyModel([...est,{taskId:hold.id,choice:1}]);
 assert.equal(studyAnswers([...est,{taskId:hold.id,choice:1}]).length,8);
 assert.deepEqual(withHold.means,baseline.means);
 assert.deepEqual(withHold.covariance,baseline.covariance);
 const model=studyRanking([...est,{taskId:hold.id,choice:1}]);
 assert.equal(model.length,6);
 assert.ok(model.every(x=>x.lower<x.upper));
});
test('genuinely separate holdout checks are absent until both fit and test choices exist',()=>{
 const estimated=scientificChoiceTasks.filter(t=>t.studyRole==='estimate').slice(0,8).map(t=>({taskId:t.id,choice:0 as const}));
 assert.equal(studyValidation(estimated).brier,null);
 const held=scientificChoiceTasks.find(t=>t.studyRole==='holdout')!;
 const report=studyValidation([...estimated,{taskId:held.id,choice:1}]);
 assert.equal(report.count,8);
 assert.equal(report.heldOut,1);
 assert.ok(report.brier!==null&&report.brier>=0&&report.brier<=1);
 assert.equal(report.chanceBrier,.25);
 assert.ok(report.label.includes('voorzichtig'));
});
test('legacy report topics guide what we explore, never become new observations',()=>{
 const oldQuestion={options:[
  {attributes:{nature:1,comfort:5,budget:1800}},
  {attributes:{nature:5,comfort:1,budget:1400}},
 ]};
 const archive=[
  {question_id:'old-q',user_id:'traveller-a',choice:0,snapshot:oldQuestion},
  {question_id:'old-q',user_id:'traveller-b',choice:1,snapshot:oldQuestion},
 ];
 const attention=archiveAttentionFromEvidence(archive,['traveller-a','traveller-b']);
 assert.ok(attention.some(t=>t.key==='nature'&&t.unresolved===1));
 const secret=archiveAttentionFromEvidence(archive.slice(0,1),['traveller-a','traveller-b']);
 assert.ok(secret.every(t=>t.observed===0));
 const starting=nextStudyTask([],attention);
 assert.ok(starting);
 assert.equal(studyEvidence([]).estimation,0);
 const retrospective=legacyReportBrief({dna:'Samen lekker op pad',discovery:'Meer natuur',fantasy:'Een langzaam avontuur',complete:8,same:4,match:50},'2026-10-05');
 assert.equal(retrospective.matched,4);
 assert.equal(retrospective.agreement,50);
 assert.equal(retrospective.hasData,true);
 assert.ok(retrospective.methodologicalCaveat.includes('niet'));
});
test('the new study keeps old and scientific answer IDs disjoint',()=>{
 assert.ok(scientificChoiceTasks.every(t=>!choiceTasks.some(q=>q.id===t.id)&&!stageTasks.some(q=>q.id===t.id)));
 const first=studyEvidence([{taskId:scientificChoiceTasks[0].id,choice:0}]);
 assert.equal(first.answered,1);
 assert.equal(first.coverage.length,6);
 assert.equal(first.version,'dce-v3.1');
});
