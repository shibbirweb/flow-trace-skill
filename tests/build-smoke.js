#!/usr/bin/env node
/*
 * Fill the template with a small sample flow so the page and the validator can be exercised
 * without a real codebase. Output: tests/out/smoke-trace.html
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const template = fs.readFileSync(path.join(root, 'assets', 'trace-template.html'), 'utf8');

const data = `  var LANES = [
    { id: 'ui', label: 'Browser · UI' },
    { id: 'http', label: 'HTTP · routes' },
    { id: 'app', label: 'Services · repos' },
    { id: 'queue', label: 'Queue · jobs' },
    { id: 'ext', label: 'External · DB' },
  ];
  var NODES = [
    { id: 'page', lane: 'ui', label: 'checkout.vue' },
    { id: 'routes', lane: 'http', label: 'routes/api.php' },
    { id: 'ctrl', lane: 'http', label: 'OrderController' },
    { id: 'svc', lane: 'app', label: 'OrderService' },
    { id: 'repo', lane: 'app', label: 'OrderRepository' },
    { id: 'job', lane: 'queue', label: 'SendReceiptJob' },
    { id: 'db', lane: 'ext', label: 'MySQL' },
    { id: 'mail', lane: 'ext', label: 'Mail provider' },
  ];
  var PHASES = [
    { id: 'place', n: 'Phase 1', label: 'Place order' },
    { id: 'receipt', n: 'Phase 2', label: 'Send receipt' },
  ];
  var STEPS = [
    { phase: 'place', node: 'page', title: 'Shopper clicks Pay', file: 'src/pages/checkout.vue', method: 'onPay()', lang: 'js', hit: [2, 3],
      code: \`async onPay() {
  this.isPaying = true;
  await this.placeOrder({ cartId: this.cart.id, address: this.address });
  this.isPaying = false;
}\`,
      note: 'One POST carries the whole cart. The flag is reset before the promise settles, so the button re-enables while the server is still working.', loads: ['1 HTTP request'] },
    { phase: 'place', node: 'routes', from: 'page', title: 'Route and auth guard', file: 'routes/api.php', method: 'line 48', lang: 'php', hit: [2],
      code: \`Route::middleware(['auth:api', 'throttle:60,1'])->group(function () {
    Route::post('/orders', 'OrderController@store');
});\`,
      note: 'Token lookup and throttle run before the controller.', loads: ['2 auth queries'] },
    { phase: 'place', node: 'ctrl', from: 'routes', title: 'Validate and delegate', file: 'app/Http/Controllers/OrderController.php', method: 'store()  ·  line 31', lang: 'php', hit: [3, 4],
      code: \`public function store(StoreOrderRequest $request)
{
    $order = $this->orderService->place($request->validated());
    return new OrderResource($order);
}\`,
      note: 'No transaction here; the service opens one.', loads: [] },
    { phase: 'place', node: 'svc', from: 'ctrl', title: 'Price every line', file: 'app/Services/OrderService.php', method: 'place()  ·  line 40', lang: 'php', hit: [4, 5, 6], loop: 'per cart line',
      code: \`public function place(array $payload)
{
    return DB::transaction(function () use ($payload) {
        foreach ($payload['lines'] as $line) {
            $price = $this->pricing->quote($line['sku']);   // external HTTP per line
            $this->orderRepository->addLine($order, $line, $price);
        }
        SendReceiptJob::dispatch($order->id);
        return $order;
    });
}\`,
      note: 'The pricing call is a synchronous HTTP request inside the transaction, once per line.', loads: ['!external HTTP per line', '!transaction held during HTTP'] },
    { phase: 'place', node: 'repo', from: 'svc', title: 'Insert the line', file: 'app/Repositories/OrderRepository.php', method: 'addLine()  ·  line 88', lang: 'php', hit: [3], loop: 'per cart line',
      code: \`public function addLine(Order $order, array $line, $price)
{
    return $order->lines()->create(['sku' => $line['sku'], 'qty' => $line['qty'], 'price' => $price]);
}\`,
      note: 'One INSERT per line.', loads: ['1 INSERT per line'] },
    { phase: 'place', node: 'db', from: 'repo', title: 'Commit', file: 'MySQL · orders, order_lines', method: 'COMMIT', lang: 'php', hit: [1],
      code: \`COMMIT\`, note: 'Rows become visible; the receipt job is already on the queue.', loads: ['1 COMMIT'] },
    { phase: 'place', node: 'page', from: 'ctrl', title: 'Response rendered', file: 'src/pages/checkout.vue', method: '.then()', lang: 'js', hit: [1],
      code: \`this.$router.push({ name: 'order', params: { id: order.id } });\`, note: 'The shopper lands on the order page before the receipt is sent.', loads: [] },
    { phase: 'receipt', node: 'job', title: 'Worker picks up the job', file: 'app/Jobs/SendReceiptJob.php', method: 'handle()  ·  line 22', lang: 'php', hit: [3, 4],
      code: \`public function handle()
{
    $order = Order::findOrFail($this->orderId);
    Mail::to($order->email)->send(new ReceiptMail($order));
}\`,
      note: 'Refetches by id; the send is synchronous inside the worker.', loads: ['1 SELECT', 'external HTTP'] },
    { phase: 'receipt', node: 'mail', from: 'job', title: 'Mail provider API', file: 'vendor mail transport', method: 'POST /messages', lang: 'php', hit: [1],
      code: \`$this->client->post($this->endpoint, ['form_params' => $payload]);\`, note: 'Failures throw and the job retries per the queue config.', loads: ['external HTTP'] },
  ];

`;

const start = template.indexOf('  /* __DATA__');
const end = template.indexOf('  /* ---------- diagram geometry');
if (start < 0 || end < 0) {
  console.error('template markers not found');
  process.exit(1);
}
let page = template.slice(0, start) + data + template.slice(end);
page = page.replace(/__TITLE__/g, 'Checkout Smoke Trace').replace('__INTRO__', 'Sample flow used to exercise the template and validator.');

const outDir = path.join(root, 'tests', 'out');
fs.mkdirSync(outDir, { recursive: true });
const outFile = path.join(outDir, 'smoke-trace.html');
fs.writeFileSync(outFile, page);
console.log('wrote ' + path.relative(root, outFile));
