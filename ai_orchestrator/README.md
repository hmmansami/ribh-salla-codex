# AI Orchestrator

`ai_orchestrator/runner.py` turns one high-level goal into an iterative build loop:

1. Generate implementation slices from the goal.
2. Implement one slice at a time via model-generated file changes.
3. Run checks after each slice attempt.
4. Ask a reviewer pass for acceptance/regression checks.
5. Retry failing slices up to a configured limit.

Logs are written per run to `.ai_orchestrator/runs/<timestamp>/`.

## Requirements

- Python 3.10+
- `OPENAI_API_KEY` environment variable
- A git repository workspace

## Configure

Copy and edit the sample spec:

```bash
cp ai_orchestrator/spec.example.json ai_orchestrator/spec.json
```

Key fields in the spec:

- `goal`: single high-level product objective.
- `constraints`: hard constraints the system must respect.
- `acceptance_criteria`: quality gates used by planning and review.
- `check_commands`: commands run after each slice (lint/tests/e2e).
- `max_slices`: cap on generated breakdown size.
- `max_attempts_per_slice`: retries when checks/review fail.
- `context_files`: optional files to inject as extra context.

## Usage

Generate plan only:

```bash
python3 ai_orchestrator/runner.py plan --spec ai_orchestrator/spec.json
```

Run full pipeline:

```bash
python3 ai_orchestrator/runner.py run --spec ai_orchestrator/spec.json
```

Continue even if a slice fails all attempts:

```bash
python3 ai_orchestrator/runner.py run --spec ai_orchestrator/spec.json --continue-on-failure
```

## Notes

- The orchestrator writes full file contents for each changed file on each attempt. It does not apply partial diffs.
- Keep `check_commands` realistic for per-slice loops. Heavy end-to-end suites can be moved to later slices or nightly checks.
- Existing dirty git state is preserved; no reset/cleanup is done automatically.
