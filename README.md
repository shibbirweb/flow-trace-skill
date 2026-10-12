# flow-trace

An Agent Skill for any AI coding agent (Claude Code, Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode and others) that turns "how does this request work?" into an interactive, animated, step-through page: one hop per file, the real code with the executing lines highlighted, a plain-language note, and cost or risk tags, with Back, Forward, Play, a scrubber, phase chips and keyboard navigation.

It is built for the questions engineers actually ask: where does the time go, which hop breaks, what runs inside the loop, and what does a teammate need to read to understand this flow.

![A trace page on step 4 of a sample checkout flow: lane diagram on the left with the current hop animated, code panel on the right with the executing lines highlighted, a loop tag, and two warning pills](docs/img/trace-desktop-light.png)

The same page follows the viewer's theme and stacks to one column on a phone. The data in these screenshots is a made-up checkout flow from `tests/build-smoke.js`, not a real codebase.

| Dark theme | Phone width |
|---|---|
| ![Dark theme](docs/img/trace-desktop-dark.png) | ![Phone width, stacked layout](docs/img/trace-phone-light.png) |

## What you get

- A lane diagram (browser, HTTP, services, queue, external, or whatever fits the stack) that animates each hop from the previous file to the current one
- A detail panel per step: layer, file, method and line, syntax-highlighted code with the executing lines marked, a note, and load pills; pills prefixed with `!` render in a warning color
- Phases for the user-visible stages of the flow, a clickable step list, light and dark themes, and a phone-width layout
- A validator that checks the page script, every node, lane, phase and highlighted line, leftover placeholders, and, with `--root`, that every referenced file exists on disk

## Install

The skill follows the open [Agent Skills](https://agentskills.io/) format, so it installs the same way in every agent that supports it. The repo root is the skill, so the folder name becomes the skill name. Which skills folder to use depends on your agent.

### Let your AI agent install it

The easiest way. Paste this into your agent:

```
Install the skill from https://github.com/shibbirweb/flow-trace-skill by following its INSTALL.md, then verify it.
```

The agent works out which skills folder it reads, asks whether you want the skill for this project only or for every project, installs it there and runs the checks. [INSTALL.md](INSTALL.md) has the full steps and the folder for each agent.

### Install by hand

Codex, Gemini CLI, Cursor, GitHub Copilot, OpenCode and most other agents read `.agents/skills/`:

```bash
git clone https://github.com/shibbirweb/flow-trace-skill .agents/skills/flow-trace      # this project
git clone https://github.com/shibbirweb/flow-trace-skill ~/.agents/skills/flow-trace    # every project
```

Claude Code reads `.claude/skills/`:

```bash
git clone https://github.com/shibbirweb/flow-trace-skill .claude/skills/flow-trace      # this project
git clone https://github.com/shibbirweb/flow-trace-skill ~/.claude/skills/flow-trace    # every project
```

Using Claude Code alongside Codex or Gemini CLI in one project? Install in `.agents/skills/` and link `.claude/skills/flow-trace` to it, as described in [INSTALL.md](INSTALL.md). For the Claude desktop app or claude.ai, upload the `.skill` file from the latest release. Most agents pick the skill up on the next session.

### Use it

Ask in plain words ("visualize how the checkout request flows through the code", "trace the nightly import file by file", "make a click-through of the login flow"), or invoke it by name where your agent supports that (for example `/flow-trace`).

The skill checks what your agent can do (run commands, publish a page, ask you a question) and adapts. An agent that cannot run commands hands you the exact commands to run instead.

## How it works

1. The skill pins the entry point and end state, then splits the flow into two to four phases.
2. It picks a lane set from `references/lane-presets.md`, or from a `flow-trace-presets.md` file in your repo if you keep one.
3. For every hop it reads the file and records the path, method and line, a 5 to 40 line snippet, the lines to highlight, a note, and load pills.
4. It fills `assets/trace-template.html`, runs `scripts/validate_trace.js`, and publishes the page through the agent's page or artifact tool when there is one, or saves it as a file.
5. The reply summarizes the phases and anything surprising found while reading the code.

## Project presets

Teams keep their own hop orders in a `flow-trace-presets.md` at the repo root or under `docs/`: which interceptor to show, which base job class every queue job extends, where the route table lives, which external systems sit on the last lane. The skill reads that file before the generic presets.

## Validate a page by hand

```bash
node scripts/validate_trace.js path/to/my-trace.html --root /path/to/repo
```

## Files

```
flow-trace/
├── SKILL.md                      instructions the agent follows
├── assets/trace-template.html    the page; only the data block is filled per trace
├── scripts/validate_trace.js     pre-publish checks
├── references/lane-presets.md    lane sets and hop orders for common stacks
└── evals/evals.json              example prompts and expectations for testing the skill
```

Rules for changing this repository, for people and agents alike, are in [AGENTS.md](AGENTS.md).

## License

MIT. See `LICENSE`.
