// Agent Spec Grader — shared engine (browser, CLI, tests).
// Scores a task spec for an autonomous agent against eight checks:
// the three requirement basics (actor, action, done) plus the five fields
// an agent cannot guess (trigger, tools, failureModes, escalation, budget).

export const CHECKS = [
  {
    id: 'actor',
    label: 'actor',
    question: 'Who is this for — a named stakeholder or authority?',
    pass: (s) => nonEmpty(s.actor),
    hint: 'Add "actor": e.g. "the repo maintainer". Agents inherit the actor\'s authority; without one they guess whose rules apply.',
  },
  {
    id: 'action',
    label: 'action',
    question: 'What does it do — a stated action or numbered main flow?',
    pass: (s) => nonEmpty(s.action) || (Array.isArray(s.mainFlow) && s.mainFlow.length > 0),
    hint: 'Add "action" (one sentence) or "mainFlow" (numbered steps).',
  },
  {
    id: 'trigger',
    label: 'trigger',
    question: 'When does it start — a named event or schedule?',
    pass: (s) => nonEmpty(s.trigger),
    hint: 'Add "trigger": e.g. "when a PR labeled deps passes CI" or "weekdays 02:00". "As needed" lets the agent decide what "needed" means.',
  },
  {
    id: 'tools',
    label: 'tool scope',
    question: 'Which tools may it use — an explicit allowlist?',
    pass: (s) => Array.isArray(s.tools) && s.tools.length > 0,
    hint: 'Add "tools": ["read repo", "comment on PRs", "merge deps PRs"]. Everything unlisted is denied by default.',
  },
  {
    id: 'done',
    label: 'done condition',
    question: 'How does it verify done — a checkable condition?',
    pass: (s) =>
      nonEmpty(s.done) ||
      (Array.isArray(s.acceptanceCriteria) && s.acceptanceCriteria.length > 0),
    hint: 'Add "done" or "acceptanceCriteria" the agent can check itself: "PR merged and CI green 5 min later" — not "handled".',
  },
  {
    id: 'failureModes',
    label: 'failure modes',
    question: 'What can go wrong — named exceptions, each with a policy?',
    pass: (s) =>
      (Array.isArray(s.failureModes) && s.failureModes.length > 0 &&
        s.failureModes.every((f) => nonEmpty(f.when) && nonEmpty(f.policy))) ||
      (Array.isArray(s.extensions) && s.extensions.length > 0),
    hint: 'Add "failureModes": [{"when": "CI red on main before start", "policy": "stop and report"}]. Extensions are the part that makes it a spec.',
  },
  {
    id: 'escalation',
    label: 'escalation',
    question: 'When does it stop and ask?',
    pass: (s) => nonEmpty(s.escalation),
    hint: 'Add "escalation": e.g. "after 3 failed attempts or any change touching auth → stop and report". Escalation is the difference between an agent that asks and one that improvises.',
  },
  {
    id: 'budget',
    label: 'budget',
    question: 'How much may it spend — a hard cap?',
    pass: (s) => {
      const b = s.budget;
      return nonEmpty(b) && (typeof b === 'string' || (typeof b === 'object' && Object.values(b).some((v) => Number.isFinite(v) && v > 0)));
    },
    hint: 'Add "budget": {"maxMinutes": 45, "maxFiles": 15} — caps convert a runaway agent into a bounded failure.',
  },
];

export const GRADES = [
  { min: 8, id: 'agent-ready', label: 'agent-ready', note: 'every question answered — safe to delegate' },
  { min: 5, id: 'workflow-grade', label: 'workflow-grade', note: 'multi-step shape; gaps remain in guardrails' },
  { min: 3, id: 'story-grade', label: 'story-grade', note: 'a delegable unit, but the agent still guesses' },
  { min: 0, id: 'vibe', label: 'vibe', note: 'a wish, not a spec — the model fills the blanks' },
];

function nonEmpty(v) {
  return typeof v === 'string' ? v.trim().length > 0 : v != null;
}

// What does this spec look like? story-shaped vs use-case-shaped vs unstructured.
export function detectShape(spec) {
  const storyish = nonEmpty(spec.actor) && nonEmpty(spec.action) && nonEmpty(spec.outcome);
  const usecaseish = Array.isArray(spec.mainFlow) && spec.mainFlow.length > 0 &&
    ((Array.isArray(spec.extensions) && spec.extensions.length > 0) ||
     (Array.isArray(spec.failureModes) && spec.failureModes.length > 0));
  if (usecaseish) return 'use case';
  if (storyish) return 'user story';
  return 'unstructured';
}

export function gradeSpec(spec) {
  const checks = CHECKS.map((c) => ({ id: c.id, label: c.label, question: c.question, pass: !!c.pass(spec), hint: c.hint }));
  const score = checks.filter((c) => c.pass).length;
  const grade = GRADES.find((g) => score >= g.min);
  return {
    score,
    total: CHECKS.length,
    grade: grade.id,
    gradeLabel: grade.label,
    gradeNote: grade.note,
    shape: detectShape(spec),
    checks,
    missing: checks.filter((c) => !c.pass).map((c) => c.id),
  };
}
