import test from 'node:test';
import assert from 'node:assert/strict';
import { gradeSpec, detectShape, CHECKS, GRADES } from '../public/spec.mjs';

test('eight checks exist, matching the article checklist', () => {
  assert.equal(CHECKS.length, 8);
  const ids = CHECKS.map((c) => c.id);
  assert.deepEqual(ids, ['actor', 'action', 'trigger', 'tools', 'done', 'failureModes', 'escalation', 'budget']);
});

test('a bare wish scores vibe', () => {
  const r = gradeSpec({ action: 'fix anything that breaks' });
  assert.equal(r.score, 1);
  assert.equal(r.grade, 'vibe');
  assert.equal(r.shape, 'unstructured');
  assert.equal(r.missing.length, 7);
});

test('a classic user story reaches story-grade but is not agent-ready', () => {
  const r = gradeSpec({
    actor: 'the maintainer',
    action: 'merge passing Dependabot PRs',
    outcome: 'deps land without review',
    acceptanceCriteria: ['CI green before merge'],
  });
  assert.equal(r.score, 3); // actor + action + done
  assert.equal(r.grade, 'story-grade');
  assert.equal(r.shape, 'user story');
});

test('use case shape requires main flow plus named exceptions', () => {
  const spec = {
    actor: 'on-call maintainer',
    trigger: 'weekdays 02:00',
    mainFlow: ['list PRs', 'rebase', 'merge green ones'],
    extensions: ['if CI red on main → skip the run'],
    done: 'summary issue filed',
  };
  assert.equal(detectShape(spec), 'use case');
  const r = gradeSpec(spec);
  assert.ok(r.checks.find((c) => c.id === 'failureModes').pass);
  assert.equal(r.score, 5);
  assert.equal(r.grade, 'workflow-grade');
});

test('action check accepts a numbered mainFlow in place of a single action', () => {
  const r = gradeSpec({ mainFlow: ['step one', 'step two'] });
  assert.ok(r.checks.find((c) => c.id === 'action').pass);
});

test('failureModes entries need both a when and a policy', () => {
  const incomplete = gradeSpec({ failureModes: [{ when: 'CI red' }] });
  assert.ok(!incomplete.checks.find((c) => c.id === 'failureModes').pass);
  const complete = gradeSpec({ failureModes: [{ when: 'CI red', policy: 'stop and report' }] });
  assert.ok(complete.checks.find((c) => c.id === 'failureModes').pass);
});

test('budget requires a real cap, not a placeholder', () => {
  assert.ok(gradeSpec({ budget: 'max 45 minutes' }).checks.find((c) => c.id === 'budget').pass);
  assert.ok(gradeSpec({ budget: { maxMinutes: 45 } }).checks.find((c) => c.id === 'budget').pass);
  assert.ok(!gradeSpec({ budget: { maxMinutes: 0 } }).checks.find((c) => c.id === 'budget').pass);
  assert.ok(!gradeSpec({}).checks.find((c) => c.id === 'budget').pass);
});

test('tools must be a non-empty allowlist', () => {
  assert.ok(!gradeSpec({ tools: [] }).checks.find((c) => c.id === 'tools').pass);
  assert.ok(!gradeSpec({ tools: 'everything' }).checks.find((c) => c.id === 'tools').pass);
  assert.ok(gradeSpec({ tools: ['read repo', 'merge deps PRs'] }).checks.find((c) => c.id === 'tools').pass);
});

test('a fully specified task grades agent-ready', () => {
  const r = gradeSpec({
    actor: 'maintainer',
    action: 'merge green deps PRs',
    outcome: 'deps land unattended',
    trigger: 'CI success event on a deps-labeled PR',
    tools: ['read repo', 'merge deps PRs'],
    done: 'PR merged and CI green 5 min later',
    failureModes: [{ when: 'merge conflict', policy: 'label blocked and stop' }],
    escalation: 'after 3 attempts → report in issues',
    budget: { maxMinutesPerPR: 10 },
  });
  assert.equal(r.score, 8);
  assert.equal(r.grade, 'agent-ready');
});

test('grade thresholds are ordered and cover 0..8', () => {
  for (let s = 0; s <= 8; s++) {
    assert.ok(GRADES.some((g) => s >= g.min), `score ${s} has a grade`);
  }
  const mins = GRADES.map((g) => g.min);
  assert.deepEqual([...mins].sort((a, b) => b - a), mins);
});
