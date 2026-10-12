# Installing flow-trace

These instructions are written so that any AI coding agent (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode, Aider, or similar) can carry them out when a person says "install this skill" and pastes this repository's link. A person can follow them too.

The skill is the repository itself, in the open Agent Skills format: `SKILL.md` at the root with `name` and `description` frontmatter, and `assets/`, `scripts/` and `references/` beside it. Installing means placing a copy of this folder, named `flow-trace`, in a folder your agent loads skills from.

## 0. Work out your environment

Before anything else, work out which agent you are and which folders you load skills from. Use the table in step 2. If your agent is not in it, or you are not sure, read your own documentation or ask the person. Do not guess: a skill placed in a folder your agent never reads installs without errors and never loads.

Also check whether the person uses more than one agent in this project (for example `.claude/`, `.cursor/`, `.gemini/` or `.github/copilot-instructions.md` at the repo root). Step 2 covers that case.

## 1. Ask where it goes

Before copying anything, ask the person one question and wait for the answer:

> Install flow-trace for this project only (committed with the repo, so teammates get it too), or for your user account (available in every project on this machine)?

Name the real folders for your agent from the table in step 2 when you ask. Skip the question only when the request already names the scope ("install it globally", "add it to this repo"), or when your agent has a single scope (the Claude desktop app and claude.ai). If you cannot ask, for example in a non-interactive run, use the project scope inside a repository and the user scope otherwise, and say which one you chose in your report.

## 2. Pick the folder

The folder depends on the agent. Use the first folder listed for yours.

| Agent | Project scope | User scope |
|---|---|---|
| Claude Code | `.claude/skills/flow-trace/` | `~/.claude/skills/flow-trace/` |
| Codex | `.agents/skills/flow-trace/` | `~/.agents/skills/flow-trace/` |
| Gemini CLI | `.agents/skills/flow-trace/` (or `.gemini/skills/`) | `~/.agents/skills/flow-trace/` (or `~/.gemini/skills/`) |
| Cursor | `.agents/skills/flow-trace/` (or `.cursor/skills/`) | `~/.agents/skills/flow-trace/` (or `~/.cursor/skills/`) |
| GitHub Copilot | `.agents/skills/flow-trace/` (or `.github/skills/`) | `~/.agents/skills/flow-trace/` (or `~/.copilot/skills/`) |
| OpenCode | `.agents/skills/flow-trace/` (or `.opencode/skills/`) | `~/.agents/skills/flow-trace/` (or `~/.config/opencode/skills/`) |
| Claude desktop app or claude.ai | not applicable | upload the `.skill` file from the latest GitHub release under Settings, Capabilities, Skills |
| Another agent that supports Agent Skills | its documented project skills folder; many read `.agents/skills/` | its documented user skills folder; many read `~/.agents/skills/` |
| An agent with no skills support | clone anywhere, for example `tools/flow-trace/`, then add the rule from step 5 to its instructions file (`AGENTS.md`, `.cursor/rules`, `.github/copilot-instructions.md`, `GEMINI.md`, or equivalent) | same, in the user-level instructions file |

`.agents/skills/` is the shared folder most agents read. Claude Code reads only `.claude/skills/`.

**More than one agent in the project.** When the agents include Claude Code and one that does not read `.claude/skills/` (Codex or Gemini CLI), install once in `.agents/skills/flow-trace/` and link the Claude Code folder to it, so there is one copy to update:

```bash
mkdir -p .claude/skills
ln -s ../../.agents/skills/flow-trace .claude/skills/flow-trace
```

Agents that read both folders (Cursor, GitHub Copilot, OpenCode) may then list the skill twice. That is harmless; tell the person if you see it. When every agent in the project reads `.claude/skills/`, a single copy there is enough.

The installed folder must be named `flow-trace` (the `name` in the frontmatter). Do not nest it as `flow-trace/flow-trace-skill/`.

## 3. Copy the files

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

Replace `<target>` with the skills folder from step 2, for example `.agents/skills` or `.claude/skills`. If the person wants to keep the skill updatable, keep the `.git` folder and skip the `rm -rf` line.

If the target folder already exists, stop and ask whether to replace it; do not merge two versions.

## 4. Verify

Run these from the repository root (or wherever `<target>` lives) and report the results:

```bash
test -f <target>/flow-trace/SKILL.md && head -2 <target>/flow-trace/SKILL.md
node <target>/flow-trace/tests/build-smoke.js
node <target>/flow-trace/scripts/validate_trace.js <target>/flow-trace/tests/out/smoke-trace.html
```

Expected: the first command prints `---` and `name: flow-trace`; the validator prints a line starting with `OK`. Node 18 or newer is required for the validator; the skill's page itself needs nothing installed.

If you cannot run shell commands, give the person these commands and ask them to run them and share the output.

Most agents load skills when a session starts. After installing, tell the person to start a new session and confirm `flow-trace` appears in the agent's skills list (for example `/skills` in Claude Code). Do not try to hot-load it.

## 5. Hook it up where there is no skills support

Add this rule to the agent's instructions file, with the real path:

```
When asked to visualize, trace, or diagram how a request, job, or feature flows through the code file by file, read tools/flow-trace/SKILL.md and follow it exactly; the template is tools/flow-trace/assets/trace-template.html and the validator is tools/flow-trace/scripts/validate_trace.js.
```

## 6. Tell the person how to use it

Once installed, plain requests trigger it:

- "visualize how the checkout request flows through the code"
- "trace the nightly import job file by file with the code"
- "make a click-through walkthrough of the login flow for the team"

The output is a single self-contained HTML page (published through the agent's page or artifact tool when it has one, otherwise saved as a file) with Back, Forward, Play, a scrubber and phase chips, and the real code highlighted at every hop.

## Optional: project presets

If the project has conventions worth encoding (which interceptor to show, the base job class, where routes live), create `flow-trace-presets.md` at the repo root or under `docs/`. The skill reads it before its generic presets. The format is described in `references/lane-presets.md`.

## Updating

With the `.git` folder kept: `git -C <target>/flow-trace pull`. Otherwise repeat step 3 after removing the old folder.

## Uninstalling

Delete `<target>/flow-trace`, any link made to it in step 2, and any rule added in step 5.
