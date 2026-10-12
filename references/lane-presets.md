# Lane presets and hop orders

Lanes are the diagram columns, left to right in call direction. Pick the preset closest to the stack, drop any lane the flow never touches, and rename labels to what the team calls each layer. Colors are assigned by column position, so lane ids can be anything short.

Before using a preset, look for a project-specific one: a file named `flow-trace-presets.md` anywhere in the repo, or a "flow-trace" section in the project's agent instructions file (AGENTS.md, CLAUDE.md, GEMINI.md or similar) or README. Teams keep their own hop orders there (which interceptor to show, which base job class every queue job extends, where the route table lives). When one exists it wins over this file.

## Browser SPA calling a backend API (Vue, React, Angular, Svelte with Laravel, Rails, Django, Express, Nest, Spring)

```js
var LANES = [
  { id: 'ui', label: 'Browser · UI' },
  { id: 'http', label: 'HTTP · routes' },
  { id: 'app', label: 'Services · repos' },
  { id: 'queue', label: 'Queue · jobs' },
  { id: 'ext', label: 'External · DB' },
];
```

Typical hop order for a user action:

1. The component or page method that handles the click: the confirm dialog, the payload build, the loading flag
2. The API client call (a service module, a store action, an RTK Query or React Query endpoint, a composable)
3. The HTTP interceptor or fetch wrapper that attaches auth headers and handles 401, worth a step the first time only
4. The route definition with the middleware group around it (auth guard, scopes, throttle)
5. Request validation (FormRequest, DTO, zod or Joi schema, serializer)
6. The controller or handler method
7. Each service and repository method that does real work, one step per method
8. Anything dispatched to a queue: show the dispatch call, then the worker-side entry point (the job's handle, the consumer)
9. External calls on the last lane: database writes, mail, SMS, payment, third-party APIs, object storage
10. The response shape (resource, serializer, DTO) and the client-side `.then()` that consumes it

## Server-side rendered app (Rails, Django, Laravel Blade, Phoenix)

```js
var LANES = [
  { id: 'browser', label: 'Browser' },
  { id: 'http', label: 'Router · middleware' },
  { id: 'app', label: 'Controllers · services' },
  { id: 'model', label: 'Models · queries' },
  { id: 'ext', label: 'DB · external' },
];
```

Hop order: form or link -> router -> middleware chain -> controller action -> service objects or form objects -> model methods and queries -> template render -> response. Callbacks, observers and signals deserve their own steps because they are the hops people forget.

## Background work (scheduler, cron, queue consumer, webhook)

```js
var LANES = [
  { id: 'trigger', label: 'Trigger' },
  { id: 'entry', label: 'Command · handler' },
  { id: 'app', label: 'Services · repos' },
  { id: 'queue', label: 'Jobs · events' },
  { id: 'ext', label: 'External · DB' },
];
```

Hop order: the schedule line or webhook route -> the command or handler -> the selection query (what rows get picked up) -> the fan-out (one job per row, chunked expander, batch) -> the per-row work -> external sends -> status writes. Use `loop:` on every step inside the per-row section and put the per-iteration cost on it. Load pills on these steps should state the measured total when one is known (log timestamps, queue dashboard, row `created_at` spreads).

## Two services talking to each other (frontend -> service A -> service B)

```js
var LANES = [
  { id: 'ui', label: 'Browser' },
  { id: 'a', label: 'Service A · HTTP' },
  { id: 'a2', label: 'Service A · logic' },
  { id: 'b', label: 'Service B · HTTP' },
  { id: 'ext', label: 'DB · cache · external' },
];
```

Show the outbound HTTP client in service A as its own step (timeouts, retries, auth forwarding live there), and the inbound auth check in service B as another. When data is owned by one side and mirrored on the other, add a step saying whether the mirror is told about the write; that is usually the question people have.

## Lane rules of thumb

- Two to six lanes. Fewer than four makes the picture flat; more than six makes labels unreadable at phone width.
- A node is a file or an external system, never a method. Methods go in the step, so one file appears in many steps.
- When a flow bounces between two lanes repeatedly (controller -> repo -> controller -> repo), keep the steps and let `from` alternate; the diagram draws the hop each time.
- Put the response hop back to the trigger as the last step of a phase so the loop closes visually.
- Take every file path from `ls` or `grep -l` output, not from memory. Extensions (`.ts` vs `.tsx`, `.js` vs `.vue`) are the usual mistake, and the validator's `--root` check catches it.
