import test from 'node:test';
import assert from 'node:assert/strict';
import { fromAmsterdamDateTime, isAiAdmin, nextAmsterdamWeek, questionId, taskInput, validateBatch } from '../lib/ai-contracts';
import { questions } from '../lib/questions';
import { permittedFile, inspectText } from '../scripts/ai-code-guard.mjs';
import { generate } from '../scripts/ai-questions';
import { batch } from './fixtures/ai-batch';
import { selectTravelSet } from '../lib/preferences';

const id = '9f763994-eed8-4059-b2d9-dd221414ca5b';
test('Amsterdam scheduling handles DST and rejects nonexistent wall times', () => {
  assert.equal(fromAmsterdamDateTime('2026-10-07T12:00'), '2026-10-07T10:00:00.000Z');
  assert.equal(fromAmsterdamDateTime('2026-03-29T02:30'), null);
  assert.equal(fromAmsterdamDateTime('2026-10-25T02:30'), '2026-10-25T00:30:00.000Z');
  assert.equal(nextAmsterdamWeek('2026-10-18T10:00:00Z'), '2026-10-25T11:00:00.000Z');
});
test('administrator access is disabled by default and uses exact email matches', () => {
  assert.equal(isAiAdmin('owner@example.com', ''), false);
  assert.equal(isAiAdmin('OWNER@example.com', ' other@example.com, owner@example.com '), true);
  assert.equal(isAiAdmin('notowner@example.com', 'owner@example.com'), false);
});
test('system requests require an explicit acknowledgement of public processing', () => {
  const request = { kind: 'system', instruction: 'Maak de uitleg duidelijker.', scheduledAt: new Date().toISOString() };
  assert.equal(taskInput.safeParse(request).success, false);
  assert.equal(taskInput.safeParse({ ...request, acknowledgePublic: true }).success, true);
});
test('question revisions get immutable IDs and validate ownership targets and properties', () => {
  const result = validateBatch(batch(), id, questions);
  assert.equal(result.questions[0].content.id, `ai_${id.replaceAll('-', '')}_0`);
  assert.equal(questionId.safeParse(result.questions[0].content.id).success, true);
  assert.equal(selectTravelSet(result.questions.map(q => q.content), [], [], [])[0]?.id, result.questions[0].content.id);
  assert.throws(() => validateBatch(batch('Nieuw?', 'q999'), id, questions));
  assert.throws(() => validateBatch(batch(questions[0].title), id, questions));
  assert.doesNotThrow(() => validateBatch(batch(questions[0].title, questions[0].id), id, questions));
  const invalid = batch(); invalid.questions[0].options[0].attributes[0].value = -1;
  assert.throws(() => validateBatch(invalid, id, questions));
});
test('code proposals cannot change auth, schema, workflows or the pipeline', () => {
  for (const file of ['lib/auth.ts', 'lib/pair-actions.ts', 'lib/db.ts', 'lib/schema.ts', 'lib/ai-tasks.ts', '.github/workflows/ai-pipeline.yml', 'scripts/ai-code-guard.mjs', 'app/api/app/route.ts', 'app/api/jobs/route.ts', 'app/api/ai/worker/route.ts', 'components/ai-desk.tsx', '.env.local']) assert.equal(permittedFile(file), false, file);
  assert.equal(permittedFile('components/travel-app.tsx'), true);
  assert.equal(inspectText('const normal = 1;'), true);
  assert.equal(inspectText('postgresql://user:password@database.example/db'), false);
});
test('Responses API requests structured data, disables storage and rejects incomplete output', async () => {
  let body: Record<string, unknown> = {};
  const transport = (async (_url: unknown, init: RequestInit) => {
    body = JSON.parse(String(init.body));
    return Response.json({ status: 'completed', output: [{ content: [{ type: 'output_text', text: JSON.stringify(batch()) }] }] });
  }) as typeof fetch;
  const output = await generate('Maak nieuwe vragen', { questions: [] }, 'test-key', 'test-model', transport);
  assert.equal(output.questions.length, 1);
  assert.equal(body.store, false);
  assert.equal((body.text as { format: { type: string } }).format.type, 'json_schema');
  await assert.rejects(generate('Maak nieuwe vragen', { questions: [] }, 'test-key', 'test-model', (async () => Response.json({ status: 'incomplete', output: [] })) as typeof fetch));
});
