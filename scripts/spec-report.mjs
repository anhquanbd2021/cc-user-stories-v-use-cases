// CLI: grade the four bundled example specs side by side.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { gradeSpec, CHECKS } from '../public/spec.mjs';

const EXAMPLES = fileURLToPath(new URL('../examples', import.meta.url));
const names = ['vague-wish', 'user-story', 'use-case', 'agent-ready'];
const results = names.map((n) => ({
  name: n,
  spec: JSON.parse(readFileSync(join(EXAMPLES, `${n}.json`), 'utf8')),
}));
for (const r of results) r.result = gradeSpec(r.spec);

console.log('AGENT SPEC GRADER — the same job, written four ways\n');
const col = 16;
const pad = (s) => String(s).padEnd(col);
console.log('check'.padEnd(18) + results.map((r) => pad(r.name)).join(''));
for (const c of CHECKS) {
  const row = c.label.padEnd(18) + results
    .map((r) => pad(r.result.checks.find((x) => x.id === c.id).pass ? 'PASS' : 'fail'))
    .join('');
  console.log(row);
}
console.log('-'.repeat(18 + col * results.length));
console.log('score'.padEnd(18) + results.map((r) => pad(`${r.result.score}/${r.result.total}`)).join(''));
console.log('grade'.padEnd(18) + results.map((r) => pad(r.result.gradeLabel)).join(''));
console.log('shape'.padEnd(18) + results.map((r) => pad(r.result.shape)).join(''));

console.log('\nWhat the gap buys you:');
for (const r of results) {
  const missing = r.result.missing.length ? r.result.missing.join(', ') : 'nothing';
  console.log(`  ${r.name}: missing → ${missing}`);
}
