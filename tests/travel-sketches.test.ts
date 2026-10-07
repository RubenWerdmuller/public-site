import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {travelSketches,selectTravelSketch} from '../lib/travel-sketches';
import {questions} from '../lib/questions';
import {illustrationThemes,generatedBatch} from '../lib/ai-contracts';
import {batch} from './fixtures/ai-batch';

test('all 156 sketches are unique, local and reachable from the question bank',()=>{
 assert.equal(travelSketches.length,156);
 assert.equal(new Set(travelSketches.map(s=>s.id)).size,156);
 const used=new Set(questions.flatMap(q=>q.options.map((o,i)=>selectTravelSketch(o,q.id,i).id)));
 assert.equal(used.size,156);
 const imported=travelSketches.filter(s=>s.file);
 assert.equal(imported.length,100);
 for(const sketch of imported){
  assert.match(sketch.file!,/^\/sketches\/[a-z0-9-]+\.svg$/);
  const svg=readFileSync(`public${sketch.file}`,'utf8');
  assert.match(svg,/<svg\s/);
  assert.doesNotMatch(svg,/<(?:script|foreignObject|image|iframe|style)\b|\bon\w+\s*=|javascript:|<!ENTITY/i);
  assert.equal(sketch.license,'CC0-1.0');assert.ok(sketch.source?.includes('/b51da0371e992b5d03e768fd1f570e8e9500c617/'));
 }
});
test('AI question IDs select stable sketches without numeric precision loss',()=>{
 const option=questions[0].options[0];
 const selections=new Set(Array.from({length:20},(_,i)=>{
  const id=`ai_0000000000000000000000000000000${i.toString(16)}_0`;
  const sketch=selectTravelSketch(option,id,0);
  assert.equal(selectTravelSketch(option,id,0),sketch);return sketch.id;
 }));
 assert.ok(selections.size>1);
 assert.ok(selectTravelSketch(option,`q${'9'.repeat(400)}`,0));
});
test('generated questions support every illustration theme and reject unknown themes',()=>{
 for(const art of illustrationThemes){const proposal=batch();proposal.questions[0].options[0].art=art;assert.equal(generatedBatch.safeParse(proposal).success,true,art);}
 const proposal=batch();proposal.questions[0].options[0].art='unknown';assert.equal(generatedBatch.safeParse(proposal).success,false);
});
