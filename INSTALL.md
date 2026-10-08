# Installing flow-trace

These instructions are written so that an AI coding agent (Claude Code, Codex, Cursor, Copilot, Gemini CLI, Aider, or similar) can carry them out when a person says "install this skill" and pastes this repository's link. A person can follow them too.

The skill is the repository itself: `SKILL.md` at the root with `assets/`, `scripts/` and `references/` beside it. Installing means placing a copy of this folder where the harness looks for skills, under the folder name `flow-trace`.

## 1. Decide where it goes

Ask which scope the person wants if it is not obvious. Default to the project scope when you are inside a repository.

| Harness | Project scope (shared through the repo) | User scope (every project) |
|---|---|---|
| Claude Code | `.claude/skills/flow-trace/` at the repo root | `~/.claude/skills/flow-trace/` |
| Claude desktop app or claude.ai | not applicable | upload the `.skill` file from the latest GitHub release under Settings, Capabilities, Skills |
| Any harness that supports the Agent Skills format (a folder with `SKILL.md` carrying `name` and `description` frontmatter) | its documented skills directory, folder named `flow-trace` | its documented user skills directory |
| A harness with no skills directory | clone anywhere, for example `tools/flow-trace/`, then add the one-line rule from step 4 to the harness's instructions file (`AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`, `GEMINI.md`, or equivalent) | same, in the user-level instructions file |

The installed folder must be named `flow-trace` (the `name` in the frontmatter). Do not nest it as `flow-trace/flow-trace-skill/`.

## 2. Copy the files

With git available:

```bash
git clone --depth 1 https://github.com/shibbirweb/flow-trace-skill <target>/flow-trace
rm -rf <target>/flow-trace/.git
```

Without git:

```bash
curl -L https://github.com/shibbirweb/flow-trace-skill/archive/refs/heads/main.zip -o flow-trace.zip
unzip -q flow-trace.zip
mv flow-trace-skill-main <target>/flow-trace
rm flow-trace.zip
```

Replace `<target>` with the directory from step 1, for example `.claude/skills`. If the person wants to keep the skill updatable, keep the `.git` folder and skip the `rm -rf` line.

If the target folder already exists, stop and ask whether to replace it; do not merge two versions.

## 3. Verify

Run these from the repository root (or wherever `<target>` lives) and report the results:

```bash
test -f <target>/flow-trace/SKILL.md && head -3 <target>/flow-trace/SKILL.md
node <target>/flow-trace/tests/build-smoke.js
node <target>/flow-trace/scripts/validate_trace.js <target>/flow-trace/tests/out/smoke-trace.html
```

Expected: the first command prints `---` and `name: flow-trace`; the validator prints a line starting with `OK`. Node 18 or newer is required for the validator; the skill's page itself needs nothing installed.

Claude Code lists project and user skills at the start of a session. After installing, tell the person to start a new session (or run `/skills` where available) and confirm `flow-trace` appears. Do not try to hot-load it.

## 4. Hook it up where there is no skills directory

Add this rule to the harness's instructions file, with the real path:

```
When asked to visualize, trace, or diagram how a request, job, or feature flows through the code file by file, read tools/flow-trace/SKILL.md and follow it exactly; the template is tools/flow-trace/assets/trace-template.html and the validator is tools/flow-trace/scripts/validate_trace.js.
```

## 5. Tell the person how to use it

Once installed, plain requests trigger it:

- "visualize how the checkout request flows through the code"
- "trace the nightly import job file by file with the code"
- "make a click-through walkthrough of the login flow for the team"

The output is a single self-contained HTML page (published as an Artifact in Claude Code, otherwise saved as a file) with Back, Forward, Play, a scrubber and phase chips, and the real code highlighted at every hop.

## Optional: project presets

If the project has conventions worth encoding (which interceptor to show, the base job class, where routes live), create `flow-trace-presets.md` at the repo root or under `docs/`. The skill reads it before its generic presets. The format is described in `references/lane-presets.md`.

## Updating

With the `.git` folder kept: `git -C <target>/flow-trace pull`. Otherwise repeat step 2 after removing the old folder.

## Uninstalling

Delete `<target>/flow-trace` and remove any rule added in step 4.
