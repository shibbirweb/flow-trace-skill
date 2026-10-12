# AGENTS.md

This repository is an Agent Skill called `flow-trace`, in the open Agent Skills format that Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and many other agents load. It builds interactive, step-through visualizations of how a request, job or feature moves through a codebase file by file, with the real code at every hop.

- Asked to **install this skill** into a project or a machine: follow `INSTALL.md` step by step. It starts by working out which agent you are and asking whether to install for this project or for every project. Report the verification output.
- Asked to **use** the skill (visualize, trace, walk through, or diagram a code flow): read `SKILL.md` and follow it. Its "Fit this skill to your environment" section says what to do when you lack a capability such as running commands or publishing a page.
- Asked to **change** this repository: follow the rules below.

Nothing in this repository needs to be built or installed to work; the validator and tests run on Node 18 or newer.

## What this is

The repo root is the skill itself: `SKILL.md` at the top, with `assets/`, `scripts/`, `references/` and `evals/` beside it, so cloning it into an agent's skills folder (for example `.agents/skills/` or `.claude/skills/`) installs it. Everything here is published under the MIT license and read by people outside any one company, using many different agents.

## Rules

- Keep the skill generic. No company names, product names, internal hostnames, ticket ids, database names, customer data, or code quoted from private repositories anywhere in this repo. Project-specific lane sets belong in a `flow-trace-presets.md` inside the project that uses the skill, never here.
- Keep the skill agent agnostic. `SKILL.md` names capabilities (run a shell command, publish a page, ask a question), never one agent's tool names, and every capability has a fallback in its "Fit this skill to your environment" table. A specific agent or tool may appear only as an example.
- Never use the em-dash character in any file. Use a comma, colon or period.
- `assets/trace-template.html` is the page every trace is built from. Only the data block (`LANES`, `NODES`, `PHASES`, `STEPS`) is meant to be replaced per trace; everything below the `diagram geometry` comment is runtime. After editing the template, run the smoke test below and open `tests/out/smoke-trace.html` in a browser to check light and dark themes and a phone width.
- `scripts/validate_trace.js` must keep passing on the smoke page and failing on the unfilled template. Add a check there whenever a real trace shipped with a defect the script could have caught.
- Keep `SKILL.md` under 500 lines and its frontmatter valid for the Agent Skills specification (`name` matching the folder name, `description` under 1024 characters). Explain the why behind each instruction rather than adding capitalized MUSTs.
- JavaScript: semicolons, trailing commas in multi-line literals, no external dependencies (the validator and tests run on bare Node 18 or newer).
- `INSTALL.md` is written for an AI agent to execute from a pasted link. When the layout, folder name, verification commands or the skills folders an agent reads change, update it, `README.md` and `llms.txt` in the same change.
- `CLAUDE.md` only imports this file, so Claude Code reads the same rules. Put rules here, not there.

## Commands

```bash
node tests/build-smoke.js                                   # fills the template with sample data into tests/out/
node scripts/validate_trace.js tests/out/smoke-trace.html   # must print OK
node scripts/validate_trace.js assets/trace-template.html   # must FAIL on the placeholders
tests/screenshots.sh                                        # regenerates docs/img/trace-desktop-*.png with headless Chrome
```

The README screenshots come from the sample checkout flow in `tests/build-smoke.js`, never from a real codebase. Regenerate them after any visual change to the template; the phone capture is taken by hand in a browser with device emulation at 375px wide.

## Releasing

Tag versions as `vX.Y.Z`. A release is the repo at that tag; a `.skill` file (a zip of the folder) can be attached to the GitHub release for people who install through the Claude desktop app or claude.ai.
