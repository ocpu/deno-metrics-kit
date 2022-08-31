# HTTP handlers for Prometheus metrics

Each of the sections in this document describes ways to expose an HTTP handler and/or start an HTTP server with some of the frameworks tkat exist for Deno.

- [HTTP handlers for Prometheus metrics](#http-handlers-for-prometheus-metrics)
	- [Deno Basic](#deno-basic)
		- [Basic Serve](#basic-serve)
		- [Basic Handler](#basic-handler)
	- [oak](#oak)
		- [Application Middleware](#application-middleware)
		- [Router Handler](#router-handler)
		- [Metric Colletion Middleware](#metric-colletion-middleware)
	- [`router`](#router)
	- [`sift`](#sift)
	- [`lollipop`](#lollipop)
		- [Metric Colletion Middleware](#metric-colletion-middleware-1)

## Deno Basic

Here in this section is how to do things without any frameworks.

### Basic Serve

There is a function that can start server that only serves a single endpoint. It is by default at address `:9100` at path `/metrics`. This can be changed by the first options parameter.

The function can take an `AbortSignal` if you want to be able to stop the server at some point.

```typescript
import { serveMetrics } from "https://deno.land/x/metrics_kit/prometheus/http/basic.ts";

serveMetrics();
```

### Basic Handler

This is how you can integrate with a std server. 

```typescript
import { createHandler } from "https://deno.land/x/metrics_kit/prometheus/http/basic.ts";
import { serve } from "https://deno.land/std@0.114.0/http/server.ts";

const handler = createHandler();
serve((req) => {
  const url = new URL(req.url);
  if (req.method === "GET" && url.pathname === "/metrics") {
    return handler();
  }
  return new Response(undefined, { status: 404 });
});
```

## oak



### Application Middleware

```typescript
import { createHandler } from "https://deno.land/x/metrics_kit/prometheus/http/oak.ts";
import { Application } from "https://deno.land/x/oak/mod.ts";

const app = new Application();
app.use(createHandler());

await app.listen({ port: 8080 });
```

### Router Handler

```typescript
import { createRouterHandler } from "https://deno.land/x/metrics_kit/prometheus/http/oak.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const router = new Router();
router.get("/metrics", createRouterHandler());

const app = new Application();
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });
```

### Metric Colletion Middleware

```typescript
import { createMetricCollector } from "https://deno.land/x/metrics_kit/prometheus/http/oak.ts";
import { Application, Router } from "https://deno.land/x/oak/mod.ts";

const router = new Router();
router.get("/", (ctx) => {
  ctx.response.body = "Hello world!";
});

const app = new Application();
app.use(createMetricCollector());
app.use(router.routes());
app.use(router.allowedMethods());

await app.listen({ port: 8080 });
```

## `router`

```typescript
import { createHTTPHandler } from "https://deno.land/x/metrics_kit/prometheus/http/basic.ts";
import { router } from "https://crux.land/router@0.0.5";

const handler = router({
  "GET@/metrics": createHTTPHandler(),
});

console.log("Listening on http://localhost:8080");
await serve(handler);
```

## `sift`

```typescript
import { createHTTPHandler } from "https://deno.land/x/metrics_kit/prometheus/http/basic.ts";
import { serve } from "https://deno.land/x/sift@0.4.0/mod.ts";

serve({
  "/metrics": createHTTPHandler()
});
```

## `lollipop`

```typescript
import { createRouterHandler } from "https://deno.land/x/metrics_kit/prometheus/http/oak.ts";
import { createApp, createRouter } from "https://raw.githubusercontent.com/ocpu/lollipop/master/mod.ts";

const router = createRouter();
router.route("GET /metrics", createRouterHandler());

const app = createApp();
app.use(router);

await app.listen(`:8080`);
```

### Metric Colletion Middleware

```typescript
import { createMetricCollector, createRouterHandler } from "https://deno.land/x/metrics_kit/prometheus/http/lollipop.ts";
import { createApp, createRouter } from "https://raw.githubusercontent.com/ocpu/lollipop/master/mod.ts";

const router = new Router();
router.routes({
	"GET /": (ctx) => ctx.response.text("Hello world!"),
	"GET /metrics": createRouterHandler(),
});

const app = new Application();
app.use(createMetricCollector());
app.use(router);

await app.listen({ port: 8080 });
```

### Metric Colletion Middleware with Metrics Handler Middleware

```typescript
import { createMetricCollector, createHandler } from "https://deno.land/x/metrics_kit/prometheus/http/lollipop.ts";
import { serve } from "https://raw.githubusercontent.com/ocpu/lollipop/master/mod.ts";

serve([createMetricCollector(), createHandler()], {
	"GET /": (ctx) => ctx.response.text("Hello world!"),
});
```
