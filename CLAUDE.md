# CLAUDE.md

Guidance for Claude Code when working inside this repository.

## What this is

`flow-trace` is a public Claude Code skill. The repo root is the skill itself: `SKILL.md` at the top, with `assets/`, `scripts/`, `references/` and `evals/` beside it, so `git clone` into a `.claude/skills/` folder installs it. Everything here is published under the MIT license and read by people outside any one company.

## Rules

- Keep the skill generic. No company names, product names, internal hostnames, ticket ids, database names, customer data, or code quoted from private repositories anywhere in this repo. Project-specific lane sets belong in a `flow-trace-presets.md` inside the project that uses the skill, never here.
- Never use the em-dash character in any file. Use a comma, colon or period.
- `assets/trace-template.html` is the page every trace is built from. Only the data block (`LANES`, `NODES`, `PHASES`, `STEPS`) is meant to be replaced per trace; everything below the `diagram geometry` comment is runtime. After editing the template, run the smoke test below and open `tests/out/smoke-trace.html` in a browser to check light and dark themes and a phone width.
- `scripts/validate_trace.js` must keep passing on the smoke page and failing on the unfilled template. Add a check there whenever a real trace shipped with a defect the script could have caught.
- Keep `SKILL.md` under 500 lines. Explain the why behind each instruction rather than adding capitalized MUSTs.
- JavaScript: semicolons, trailing commas in multi-line literals, no external dependencies (the validator and tests run on bare Node 18 or newer).
- `INSTALL.md` is written for an AI agent to execute from a pasted link. When the layout, folder name, verification commands or harness locations change, update it and `AGENTS.md` and `llms.txt` in the same change.

## Commands

```bash
node tests/build-smoke.js                                   # fills the template with sample data into tests/out/
node scripts/validate_trace.js tests/out/smoke-trace.html   # must print OK
node scripts/validate_trace.js assets/trace-template.html   # must FAIL on the placeholders
tests/screenshots.sh                                        # regenerates docs/img/trace-desktop-*.png with headless Chrome
```

The README screenshots come from the sample checkout flow in `tests/build-smoke.js`, never from a real codebase. Regenerate them after any visual change to the template; the phone capture is taken by hand in a browser with device emulation at 375px wide.

## Releasing

Tag versions as `vX.Y.Z`. A release is the repo at that tag; a `.skill` file (a zip of the folder) can be attached to the GitHub release for people who install through the Claude app.
