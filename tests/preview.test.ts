import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AVATARS, CHARACTERS, portrait } from '../lib/characters';
import { initialPreview, previewAnswer, previewDashboard, previewWeek } from '../lib/demo';

test('canonical characters resolve to blond, bald and capped portraits', () => {
  assert.equal(portrait(CHARACTERS.oelie.avatar).hairColor, '#d6b961');
  assert.equal(portrait(CHARACTERS.roebie.avatar).cap, true);
  assert.equal(portrait(CHARACTERS.roebie.withoutCapAvatar).hair, 'bald');
  assert.equal(portrait(CHARACTERS.roebie.withoutCapAvatar).cap, false);
  assert.equal(new Set(AVATARS.map(a => a.id)).size, 12);
});
test('preview starts without answers and never mutates prior state', () => {
  const original = initialPreview();
  const next = previewAnswer(original, 'q001', 0);
  assert.equal(original.answers.length, 0);
  assert.equal(next.answers.length, 1);
  assert.equal(previewDashboard(next).history[0].own, 0);
});
test('same UI privacy rule applies in the two-person test flow', () => {
  let state = previewAnswer(initialPreview(), 'q001', 0);
  state = { ...state, active: 'roebie' };
  assert.equal(previewDashboard(state).questions[0].partner, null);
  assert.equal(previewDashboard(state).insights.match, null);
  state = previewAnswer(state, 'q001', 1);
  assert.equal(previewDashboard(state).questions[0].partner, 0);
  assert.equal(previewDashboard(state).questions[0].same, false);
});
test('preview also keeps an answer immutable and rejects invalid input', () => {
  const state = previewAnswer(initialPreview(), 'q001', 0);
  assert.equal(previewAnswer(state, 'q001', 1), state);
  assert.equal(previewAnswer(state, 'q060', 2), state);
  assert.equal(previewAnswer(state, 'missing', 0), state);
});
test('saved preview card stays until both answer, then disappears', () => {
  let state = { ...initialPreview(), saved: ['q001'] };
  state = previewAnswer(state, 'q001', 0);
  assert.equal(state.answers[0].mode, 'later');
  assert.deepEqual(state.saved, ['q001']);
  state = previewAnswer({ ...state, active: 'roebie' }, 'q001', 0);
  assert.deepEqual(state.saved, []);
});
test('example week populates a report without overwriting test choices', () => {
  const original = previewAnswer(initialPreview(), 'q001', 1);
  const filled = previewWeek(original);
  assert.equal(filled.answers[0].choice, 1);
  assert.equal(original.answers.length, 1);
  assert.equal(previewDashboard(filled).report.content.provisional, false);
  assert.deepEqual(previewWeek(filled).answers, filled.answers);
});
test('reset removes answers, saved cards, feedback and restores canonical portraits', () => {
  const reset = previewDashboard(initialPreview());
  assert.equal(reset.history.length, 0);
  assert.equal(reset.saved.length, 0);
  assert.equal(reset.members[1].avatar, CHARACTERS.roebie.avatar);
});
