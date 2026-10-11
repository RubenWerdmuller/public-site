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
