import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { gradeSpec } from '../public/spec.mjs';

const EXAMPLES = fileURLToPath(new URL('../examples', import.meta.url));
const load = (n) => JSON.parse(readFileSync(join(EXAMPLES, `${n}.json`), 'utf8'));

test('four bundled examples exist and parse', () => {
  const files = readdirSync(EXAMPLES).filter((f) => f.endsWith('.json'));
  assert.equal(files.length, 4);
  for (const f of files) assert.ok(load(f.replace('.json', '')));
});

test('the four examples grade exactly as the article claims (1/8 → 8/8)', () => {
  const expected = [
    ['vague-wish', 1, 'vibe', 'unstructured'],
    ['user-story', 3, 'story-grade', 'user story'],
    ['use-case', 5, 'workflow-grade', 'use case'],
    ['agent-ready', 8, 'agent-ready', 'use case'],
  ];
  for (const [name, score, grade, shape] of expected) {
    const r = gradeSpec(load(name));
    assert.equal(r.score, score, `${name} should score ${score}/8, got ${r.score}`);
    assert.equal(r.grade, grade, `${name} should grade ${grade}, got ${r.grade}`);
    assert.equal(r.shape, shape, `${name} should be ${shape}-shaped, got ${r.shape}`);
  }
});

test('scores strictly increase from wish to agent-ready', () => {
  const names = ['vague-wish', 'user-story', 'use-case', 'agent-ready'];
  const scores = names.map((n) => gradeSpec(load(n)).score);
  for (let i = 1; i < scores.length; i++) assert.ok(scores[i] > scores[i - 1]);
});
