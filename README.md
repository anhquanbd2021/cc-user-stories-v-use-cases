# Agent Spec Grader

A zero-dependency Node 20+ teaching lab for one question: **is the task you
are about to hand an autonomous agent a spec, or a vibe?**

Delegating to an always-on agent — a Hermes Agent reachable from Telegram, a
coding agent in CI, anything that acts while you sleep — fails when the
instruction has blanks the model has to fill. This lab scores a task spec
(JSON) against the **eight checks** that make an agent task delegable:

| # | check | field(s) it looks for |
|---|-------|-----------------------|
| 1 | actor | `actor` — whose authority |
| 2 | action | `action` or numbered `mainFlow` |
| 3 | trigger | `trigger` — named event or schedule |
| 4 | tool scope | `tools` — explicit allowlist |
| 5 | done condition | `done` or `acceptanceCriteria` |
| 6 | failure modes | `failureModes` or use-case `extensions` |
| 7 | escalation | `escalation` — stop-and-ask path |
| 8 | budget | `budget` — a hard cap |

Grades: **0–2 vibe** · **3–4 story-grade** · **5–7 workflow-grade** ·
**8 agent-ready**. It also detects the spec's shape — user story
(`actor`+`action`+`outcome`) vs use case (`mainFlow`+exceptions) vs
unstructured.

## Run it

```bash
npm start          # lab on http://localhost:3000 (PORT to override)
npm run report     # side-by-side CLI table of the four examples
npm test           # node --test "test/*.test.mjs"
npm run check      # tests + report (what render.yaml runs)
```

Open the lab and click through the four bundled examples — the same job
written as a one-line wish, a user story, a use case, and an agent-ready
spec — to watch it score **1/8, 3/8, 5/8, 8/8**. Then paste your own spec
JSON into the custom grader.

## Layout

- `public/spec.mjs` — the shared grading engine (browser, CLI, tests all
  import this one file)
- `app/server.js` — static server with a file allowlist, `/health`,
  `/version`, security headers
- `examples/` — the four graded fixture specs
- `scripts/spec-report.mjs` — CLI side-by-side report
- `test/` — `node --test` suites: rules, thresholds, examples, server smoke

## Honest limits

- This is **structural linting**. The grader verifies that each field exists
  and is plausibly shaped — it cannot judge whether your acceptance criteria
  are *correct*, whether the tool allowlist is tight enough, or whether the
  escalation path reaches a human who actually reads it.
- A spec can score 8/8 and still be a bad idea. Grading tells you the
  contract is written; it doesn't tell you the contract is wise.
- The shape detector is intentionally simple — it labels structure, not
  quality. A "user story" verdict means the fields look story-shaped, not
  that the story is good.
