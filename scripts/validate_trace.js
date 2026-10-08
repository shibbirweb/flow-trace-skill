#!/usr/bin/env node
/*
 * Validate a filled flow-trace page before publishing.
 *
 * Usage: node validate_trace.js path/to/trace.html [--root /path/to/repo]
 *
 * Checks:
 *  - the page script parses (same check the browser would do)
 *  - __TITLE__, __INTRO__ and the __DATA__ comment were replaced
 *  - every step.node / step.from / step.phase refers to a defined node or phase
 *  - every node.lane refers to a defined lane, and there are 2 to 6 lanes
 *  - hit line numbers fall inside the code snippet
 *  - snippets stay between 1 and 45 lines (longer ones stop being readable in the panel)
 *  - no em-dash characters anywhere
 *  - with --root: every step.file that looks like a repo path exists under that root
 * Exit code 1 on any failure, with one line per problem.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const rootIdx = args.indexOf('--root');
const root = rootIdx >= 0 ? args[rootIdx + 1] : null;
if (!file) {
  console.error('usage: validate_trace.js <trace.html> [--root <repo dir>]');
  process.exit(2);
}
const html = fs.readFileSync(file, 'utf8');
const problems = [];

['__TITLE__', '__INTRO__', '__DATA__'].forEach((marker) => {
  if (html.includes(marker)) {
    problems.push('placeholder still present: ' + marker);
  }
});
if (html.includes(String.fromCharCode(8212))) {
  problems.push('em-dash character found; replace it with a comma, colon or period');
}

const scriptMatch = /<script>([\s\S]*?)<\/script>/.exec(html);
if (!scriptMatch) {
  problems.push('no <script> block found');
  report();
}
const script = scriptMatch[1];

const dataStart = script.indexOf('var LANES = ');
const dataEnd = script.indexOf('/* ---------- diagram geometry');
if (dataStart < 0 || dataEnd < 0) {
  problems.push('could not locate the data block (var LANES ... diagram geometry comment)');
  report();
}
const sandbox = {};
try {
  vm.runInNewContext(script.slice(dataStart, dataEnd) + '\nthis.LANES = LANES; this.NODES = NODES; this.PHASES = PHASES; this.STEPS = STEPS;', sandbox, { filename: file });
} catch (e) {
  problems.push('data block does not parse: ' + e.message);
  report();
}
try {
  new vm.Script(script, { filename: file });
} catch (e) {
  problems.push('page script does not parse: ' + e.message);
}

const { LANES, NODES, PHASES, STEPS } = sandbox;
if (!Array.isArray(LANES) || LANES.length < 2 || LANES.length > 6) {
  problems.push('LANES must have 2 to 6 entries (has ' + (LANES ? LANES.length : 0) + ')');
}
const laneIds = new Set((LANES || []).map((l) => l.id));
const nodeIds = new Set((NODES || []).map((n) => n.id));
const phaseIds = new Set((PHASES || []).map((p) => p.id));

(NODES || []).forEach((n) => {
  if (!laneIds.has(n.lane)) {
    problems.push('node "' + n.id + '" uses unknown lane "' + n.lane + '"');
  }
  if (!n.label || n.label.length > 26) {
    problems.push('node "' + n.id + '" label missing or longer than 26 chars (it will overflow the box)');
  }
});
if (!STEPS || STEPS.length === 0) {
  problems.push('STEPS is empty');
}
const looksLikePath = (f) => typeof f === 'string' && /^[\w@.-]+(\/[\w@.-]+)+\.\w{1,5}$/.test(f.trim());
(STEPS || []).forEach((s, i) => {
  const tag = 'step ' + (i + 1) + ' (' + (s.title || 'untitled') + ')';
  ['phase', 'node', 'title', 'file', 'method', 'lang', 'code', 'note'].forEach((k) => {
    if (s[k] === undefined || s[k] === '') {
      problems.push(tag + ': missing "' + k + '"');
    }
  });
  if (!phaseIds.has(s.phase)) {
    problems.push(tag + ': unknown phase "' + s.phase + '"');
  }
  if (!nodeIds.has(s.node)) {
    problems.push(tag + ': unknown node "' + s.node + '"');
  }
  if (s.from && !nodeIds.has(s.from)) {
    problems.push(tag + ': unknown from-node "' + s.from + '"');
  }
  if (s.lang && !['php', 'js'].includes(s.lang)) {
    problems.push(tag + ': lang must be "php" or "js" (use "js" for TypeScript, Vue, React, and "php" for other $-variable languages)');
  }
  const lineCount = typeof s.code === 'string' ? s.code.split('\n').length : 0;
  if (lineCount < 1 || lineCount > 45) {
    problems.push(tag + ': code snippet has ' + lineCount + ' lines; keep it between 1 and 45');
  }
  (s.hit || []).forEach((h) => {
    if (h < 1 || h > lineCount) {
      problems.push(tag + ': hit line ' + h + ' is outside the ' + lineCount + '-line snippet');
    }
  });
  if (i > 0 && !s.from && STEPS[i - 1].phase === s.phase && STEPS[i - 1].node !== s.node) {
    problems.push(tag + ': no "from" but the previous step is on a different node; add from: "' + STEPS[i - 1].node + '" so the hop is drawn');
  }
  if (root && looksLikePath(s.file) && !fs.existsSync(path.join(root, s.file.trim()))) {
    problems.push(tag + ': file "' + s.file + '" does not exist under ' + root + ' (take paths from ls or grep output)');
  }
});
(PHASES || []).forEach((p) => {
  if (!(STEPS || []).some((s) => s.phase === p.id)) {
    problems.push('phase "' + p.id + '" has no steps');
  }
});

report();

function report() {
  if (problems.length) {
    problems.forEach((p) => console.error('FAIL  ' + p));
    process.exit(1);
  }
  console.log('OK  ' + (STEPS ? STEPS.length : 0) + ' steps, ' + (NODES ? NODES.length : 0) + ' nodes, ' + (LANES ? LANES.length : 0) + ' lanes, ' + (PHASES ? PHASES.length : 0) + ' phases' + (root ? ', file paths checked under ' + root : ''));
  process.exit(0);
}
