---
name: flow-trace
description: Build an interactive, animated, step-through visualization of how a request, feature, job or process moves through a codebase file by file, with the real code and method at every hop, as a single HTML page with forward/back/play controls (published through the agent's page or artifact tool when it has one, otherwise saved as a file). Use this whenever the user asks to visualize, trace, walk through, animate, or diagram how something works end to end in code (a request, an API call, a button click, a queue job, a scheduler command, a webhook, a login flow, an import), asks "how does X flow" or "what happens when", wants a sequence or flow diagram they can click through, or wants to show teammates the path a request takes. Reach for it even when the user does not say "diagram" or "page" but wants to see the code path across files rather than a prose explanation.
license: MIT
compatibility: Requires Node 18 or newer to validate the page. Works with any agent that supports Agent Skills.
---

# Flow trace

Produce a page where a reader steps through one flow hop by hop. Each step names the layer, file, method and line, shows the actual code with the executing lines highlighted, explains in plain words what happens, and tags the cost or risk of the hop. A lane diagram animates the hop from the previous file to the current one. The reader moves with Back and Forward buttons, Play, a scrubber, phase chips, a step list, and arrow keys.

The value is in the accuracy of the code and the honesty of the notes, not in the animation. People use these pages to understand load, find the hop that breaks, and brief teammates. A paraphrased snippet or an invented line number destroys that trust, so every step is quoted from the repo as it is today.

## Fit this skill to your environment

This skill works in any agent that supports Agent Skills. It names what it needs, never a specific tool, so check what you have once at the start and follow the matching column. Mention a missing capability to the person only when it changes what they get.

| The skill needs | When you have it | When you do not |
|---|---|---|
| Shell commands (`node`, `grep`) | Run the validator yourself and search the code with grep. | Give the person the validator command and ask for the output. Never say a page was validated when you did not run it. |
| Node 18 or newer | Confirm with `node --version`. | Check the page by hand against the quality bar below, and say clearly in your reply that it was not validated. |
| Reading files in the repository | Read the code directly. | Ask the person to share the files. Do not write snippets or line numbers from memory. |
| Asking a question and waiting for the answer | Ask one short question when two readings of the flow would produce different pages. | Take the most likely reading and state the assumption at the top of your reply. |
| A scratch or temp folder | Fill the template there. | Use `docs/trace/<slug>.html` in the repository and say so. |
| A tool that publishes or hosts an HTML page (an artifact, canvas or share tool) | Publish the page with a one-sentence description, and the icon "diagram" if the tool asks for one. | Save the HTML file and give its path. |
| A browser or preview pane | Open the page and check that it renders. | Tell the person to open the file in any browser. It works offline. |

`<skill dir>` in the commands below is the folder that holds this `SKILL.md`, wherever your agent installed it (for example `.agents/skills/flow-trace` or `.claude/skills/flow-trace`). Resolve it once and use the full path.

## Workflow

### 1. Pin the flow

Identify the entry point and the end state before reading anything. Entry points are a UI action, a route, a scheduled command, a queued job, a webhook, or a cron. The end state is the response the user sees, the rows written, or the external call made.

If the request names a feature that has more than one path (for example "the import" when there is a button path and a nightly path), trace all paths the user plausibly means and split them into phases rather than picking one silently. If two readings would produce materially different pages, ask one short question first.

Decide the phases now. A phase is a user-visible stage (Import, Compare, Replace; Send code, Verify, Refresh). Two to four phases is the usual range. Each phase starts at the trigger and ends at the response or the terminal side effect, so the diagram closes the loop visually.

### 2. Pick lanes and nodes

Read `references/lane-presets.md` for lane sets and the typical hop order for common stacks. Check first whether the project keeps its own presets (a `flow-trace-presets.md` file, or a flow-trace section in its agent instructions file such as AGENTS.md, CLAUDE.md or GEMINI.md, or in its README); a project file wins. Lanes are columns ordered in call direction. Nodes are files or external systems, never methods: one file node appears in as many steps as it has methods on the path.

### 3. Collect the real code for every hop

For each hop read the file (grep, sed, cat), then capture:

- the repo-relative file path, taken from `ls` or `grep -l` output rather than typed from memory, and the method name with the current line number from grep (line numbers drift, so take them in the same session you publish)
- a snippet of 5 to 40 lines. Trim long methods to the lines that matter and mark the cut with a short `// ...` comment that says what was skipped
- the 1-based snippet lines to highlight: the lines that execute on this hop, not the whole method
- a note of one to three sentences: what this hop does, then the one thing a reviewer would want to know (a query per row, a sync external call, a missing null check, a transaction boundary, a cache that is bypassed)
- load pills: short facts such as `1 UPDATE`, `3 queries per district`, `external HTTP, serial`, `worker held for the loop`. Prefix a pill with `!` when it is costly or risky so it renders in the warning color

Where measurements exist (row timestamps, queue dashboards, APM spans, earlier audits in the repo), put the number in the note or a pill. A measured "283 rows in 150 s" is worth more than any adjective.

Hops that repeat inside a loop get `loop: 'per replaced record'` (or similar) so the reader sees which cost multiplies.

Include the plumbing hops the first time they appear in a trace (HTTP interceptor, route middleware group, request validation, base job class) because they are where auth, timeouts and queue settings live. Skip them on later phases of the same page unless something differs.

### 4. Fill the template

Copy `assets/trace-template.html` to a working folder (a scratch or temp folder) as `<slug>-trace.html`. Replace:

- `__TITLE__` (twice): a two to four word name such as "Checkout Request Trace"
- `__INTRO__`: one sentence saying what flow this is and the date the code was read
- the `/* __DATA__ ... */` comment and the four empty arrays: `LANES`, `NODES`, `PHASES`, `STEPS`

Step shape:

```js
{ phase: 'cancel', node: 'orderrepo', from: 'orderctrl', loop: 'main loop, per order',
  title: 'Cancel every order in the batch',
  file: 'app/Repositories/OrderRepository.php',
  method: 'cancelByBatchId()  ·  line 212',
  lang: 'php',                       // 'php' or 'js' (use 'js' for TS, Vue, React)
  hit: [3, 4, 5, 6, 7],
  code: `public function cancelByBatchId($batchId)
{
    $this->model::query()
        ->where('batch_id', $batchId)
        ->update([
            'cancelled_at' => now(),
        ]);
}`,
  note: 'No status filter: orders already shipped in this batch get a cancelled_at too.',
  loads: ['1 UPDATE', '!rewrites shipped rows'] }
```

`from` is the node of the previous hop; the diagram draws the edge from it. Omit `from` only on the first step of a phase. Code goes in a template literal, so escape backticks as `` \` `` and `${` as `\${`. Keep notes free of em-dashes.

### 5. Validate, then publish

Run the validator with the repo root so file paths are checked on disk. It parses the script, checks every node, lane, phase and hit line, and catches leftover placeholders:

```bash
node <skill dir>/scripts/validate_trace.js <path>/<slug>-trace.html --root <repo root>
```

Fix every FAIL line. Then deliver the page:

- When the agent has a tool that publishes or hosts an HTML page (for example an artifact, canvas or share tool), follow any setup that tool asks for, then publish the file with a one-sentence description; if the tool asks for an icon, use "diagram". Republish to the same place when the user asks for changes.
- Otherwise save the file where the user can open it (for example `docs/trace/<slug>.html` in the repo) and open it in a browser preview if one exists. The page is self-contained and works from a local file.

### 6. Report

Reply with the link or path, then a short summary: phases and step count, what each phase covers in one line, and anything you confirmed or corrected while reading the code (a missing guard, a loop that multiplies cost, a claim from an earlier discussion that turned out wrong). Those findings are often the most useful part of the exercise, so do not bury them.

## Quality bar

- Every snippet is copied from the file, not reconstructed from memory. Re-grep a method when unsure.
- Every step has a `from` except phase starts, so the diagram never shows a node lighting up with no edge.
- Node labels stay under 26 characters or they overflow the box; use the class name without namespace.
- One idea per note. Facts, measurements and hazards; no praise for the code and no speculation presented as fact.
- Hot pills (`!`) are for real cost or risk: synchronous external calls inside a request, N+1 queries, unindexed scans, missing null or ownership checks, data rewritten without a filter, workers held for minutes, queues blocked.
- 15 to 45 steps is the useful range. Fewer and the reader loses the file-to-file thread; more and Play takes too long. Merge trivial pass-through hops (a one-line service method that only forwards) into the step before or after and mention them in the note.

## Files in this skill

- `assets/trace-template.html`: the page. Everything below the data block is finished: diagram geometry, edge animation, keyboard handling, syntax highlighting for PHP-style and JS-style code, light and dark themes, phone layout.
- `scripts/validate_trace.js`: run before every publish; pass `--root` to check file paths.
- `references/lane-presets.md`: lane sets and hop orders for SPA-plus-API, server-rendered, background-work and service-to-service flows, plus rules of thumb for choosing lanes.
