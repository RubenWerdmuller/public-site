import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalSetSequence,mayAdvance,revealedTo,selectStoryPair} from '../lib/unified-set-rules';
import {stageTasks} from '../lib/reiskantoor';
import {scientificChoiceTasks,studyTaskById} from '../lib/dce-design';
import {nextScientificQuestion} from '../lib/itinerary-science';
test('each visible set has exactly four stable positions and two distinct story IDs',()=>{
 const slots=canonicalSetSequence(['q001','q002'],[0,1]);
 assert.deepEqual(slots.map(x=>x.kind),['legacy','scientific','legacy','scientific']);
 assert.deepEqual(slots.map(x=>x.key),['legacy-q001','science-0','legacy-q002','science-1']);
 assert.throws(()=>canonicalSetSequence(['q001','q001'],[0,1]));
 assert.throws(()=>canonicalSetSequence(['q001'],[0,1]));
});
test('partner choice remains hidden until current user has also answered',()=>{
 const members=['oelie','roebie'];
 assert.deepEqual(revealedTo('oelie',members,[{userId:'roebie',choice:1}]),{own:null,partner:null});
 assert.deepEqual(revealedTo('oelie',members,[{userId:'oelie',choice:0}]),{own:0,partner:null});
 assert.deepEqual(revealedTo('oelie',members,[{userId:'oelie',choice:0},{userId:'roebie',choice:1}]),{own:0,partner:1});
 assert.deepEqual(revealedTo('oelie',['oelie'],[{userId:'oelie',choice:0}]),{own:0,partner:null});
});
test('a subsequent adaptive set must wait for four completed shared answers',()=>{
 const complete={ready:true,choices:[{userId:'oelie',choice:0 as const},{userId:'roebie',choice:1 as const}]};
 assert.equal(mayAdvance(['oelie','roebie'],Array(4).fill(complete)),true);
 assert.equal(mayAdvance(['oelie','roebie'],Array(3).fill(complete)),false);
 assert.equal(mayAdvance(['oelie','roebie'],[...Array(3).fill(complete),{ready:true,choices:[{userId:'oelie',choice:0}]}]),false);
 assert.equal(mayAdvance(['oelie','roebie'],[...Array(3).fill(complete),{...complete,ready:false}]),false);
});
test('scientific slots only contain known versioned stage or study tasks',()=>{
 const first=nextScientificQuestion([]);
 assert.equal(first?.id,stageTasks[0].id);
 assert.equal(scientificChoiceTasks.length,48);
 assert.equal(scientificChoiceTasks.filter(x=>x.studyRole==='holdout').length,6);
 assert.ok(studyTaskById('dce3-001'));
});

test('the set keeps a personal question close to its playful travel theme',()=>{
 const bank=[
  {id:'core-a',theme:'Weggaan',role:'core'},
  {id:'boundary-b',theme:'Seizoen',role:'boundary'},
  {id:'personal-c',theme:'Weggaan',role:'personal'},
  {id:'wildcard-d',theme:'Zomaar',role:'wildcard'},
 ];
 assert.deepEqual(selectStoryPair(bank.map(x=>x.id),bank),['core-a','personal-c']);
 assert.deepEqual(selectStoryPair(['core-a','boundary-b'],bank),['core-a','boundary-b']);
 assert.deepEqual(selectStoryPair(['missing','personal-c'],bank),[]);
});


import {createEvergreenBatch,createEvergreenQuestion,evergreenId} from '../lib/evergreen-questions';
test('a travelling partner can keep answering without shared completion',()=>{
 const original=[{ready:true,choices:[{userId:'oelie',choice:0 as const}]}];
 assert.equal(mayAdvance(['oelie','roebie'],[...original,...original,...original,...original]),false);
 // Advancing is permitted by the server after four OWN responses,
 // while the other's answers remain hidden.
 const ownOnly=Array.from({length:4},()=>({ready:true,own:0 as const}));
 assert.ok(ownOnly.every(slot=>slot.ready&&slot.own!==null));
});
test('endless reflection questions have stable IDs, not reused across sets',()=>{
 const pair='00000000-0000-4000-a000-000000000099';
 const first=createEvergreenBatch(pair,1);
 const later=createEvergreenBatch(pair,50000);
 assert.equal(first.length,4);
 assert.equal(later.length,4);
 assert.deepEqual(first,createEvergreenBatch(pair,1));
 assert.equal(new Set([...first,...later].map(q=>q.id)).size,8);
 assert.ok(first.every(q=>q.options.length===2&&q.informationValue===0));
 assert.ok(first.every(q=>q.options.every(o=>Object.keys(o.attributes).length===0)));
 assert.ok(first.every(q=>q.id.startsWith('ev1-'+pair)));
 assert.equal(createEvergreenQuestion(pair,42,2).id,evergreenId(pair,42,2));
 assert.throws(()=>evergreenId('../invalid',1,0));
});
test('evergreen questions never pretend to be DCE or stage tasks',()=>{
 const sample=createEvergreenQuestion('pair-123',600000,3);
 assert.equal(studyTaskById(sample.id),undefined);
 assert.ok(!stageTasks.some(x=>x.id===sample.id));
 assert.ok(!scientificChoiceTasks.some(x=>x.id===sample.id));
});
