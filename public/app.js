import { gradeSpec } from './spec.mjs';

const $ = (sel) => document.querySelector(sel);
const EXAMPLES = [
  ['vague-wish', 'A one-line wish'],
  ['user-story', 'A user story'],
  ['use-case', 'A use case'],
  ['agent-ready', 'An agent-ready spec'],
];

const specs = {};
for (const [key] of EXAMPLES) {
  specs[key] = await (await fetch(`/examples/${key}.json`)).json();
}

function resultHtml(spec) {
  const r = gradeSpec(spec);
  const items = r.checks.map((c) => `
    <li class="${c.pass ? 'pass' : 'fail'}">
      <span class="q">${c.pass ? '✓' : '✗'} ${c.label}</span> — ${c.question}
      ${c.pass ? '' : `<div class="hint">${c.hint}</div>`}
    </li>`).join('');
  return `
    <div class="verdict">
      <span class="grade ${r.grade}">${r.gradeLabel}</span>
      <span class="score">${r.score}/${r.total}</span>
      <span class="shape">shape: ${r.shape}</span>
      <div class="grade-note">${r.gradeNote}</div>
    </div>
    <ul class="checks">${items}</ul>`;
}

const tabs = $('#example-tabs');
EXAMPLES.forEach(([key, label], i) => {
  const r = gradeSpec(specs[key]);
  const b = document.createElement('button');
  b.innerHTML = `${label}<span class="score-chip">${r.score}/${r.total}</span>`;
  if (i === 0) b.className = 'active';
  b.addEventListener('click', () => {
    tabs.querySelectorAll('button').forEach((x) => x.classList.remove('active'));
    b.classList.add('active');
    show(key);
  });
  tabs.append(b);
});

function show(key) {
  $('#example-detail').innerHTML = `
    <div class="spec-view">${escapeHtml(JSON.stringify(specs[key], null, 2))}</div>
    <div>${resultHtml(specs[key])}</div>`;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

$('#grade-btn').addEventListener('click', () => {
  $('#custom-error').textContent = '';
  $('#custom-result').innerHTML = '';
  let spec;
  try {
    spec = JSON.parse($('#custom-spec').value);
  } catch (e) {
    $('#custom-error').textContent = `Not valid JSON: ${e.message}`;
    return;
  }
  if (typeof spec !== 'object' || spec === null || Array.isArray(spec)) {
    $('#custom-error').textContent = 'Spec must be a JSON object.';
    return;
  }
  $('#custom-result').innerHTML = resultHtml(spec);
});

show('vague-wish');
