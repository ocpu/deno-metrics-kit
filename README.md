# Metrics Kit

This module provides a standard set of metric types by types such as counter, gauge, histogram, and summary. They are then implemented by a varying amount of connectors.

It currently supports connectors for the following formats and modules:
- [Prometheus](#prometheus-connectors)<!---->
  - [Module implementation](prometheus)
  - [`ts_prometheus` Denox module](https://deno.land/x/ts_prometheus)
- [StatsD](#statsd-connectors)
  - [`statsd` Denox module](https://deno.land/x/statsd)
- [Expvar](#expvar-connectors)
  - [Module implementation](expvar)
- [Cloudwatch](#cloudwatch-connectors)
  - [Module implementation](expvar)
- [Discard](#discard-connectors) (connector only as all operations are noop)

## Prometheus connectors

- [Builtin Prometheus](#builtin-prometheus)<!---->
- [`ts_prometheus` module](#ts_prometheus-module)

### Builtin Prometheus
```typescript
// Creating directly from the connector
import { createCounter, createGauge, createHistogram } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/prometheus.ts";

const serverConnectionsMetric = createCounter({
  namespace: "server",
  name: "connections",
  help: "The amount of connections made to the server with a specific connection type",
  labels: ["type"],
});

const nodeMemoryFreeBytesMetric = createGauge({
  namespace: "node",
  name: "memory_free_bytes",
  help: "The amount of free memory left on the node",
});

const httpServerResuestsSecondsMetric = createHistogram({
  namespace: "http_server",
  name: "requests_seconds",
  buckets: [.1, .2, .3, .5, 1, 2, 3, 5],
  labels: ["method", "path", "status"],
});
```
```typescript
// Wrapping constructs from the module
import { createMetric } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/prometheus/mod.ts";
import { createCounter, createGauge, createHistogram } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/prometheus.ts";

const serverConnectionsMetric = createCounter(createMetric({
  type: "counter",
  namespace: "server",
  name: "connections",
  help: "The amount of connections made to the server with a specific connection type",
  labels: ["type"],
}))

const nodeMemoryFreeBytesMetric = createGauge(createMetric({
  type: "gauge",
  namespace: "node",
  name: "memory_free_bytes",
  help: "The amount of free memory left on the node",
}))

const httpServerResuestsSecondsMetric = createHistogram(createMetric({
  type: "histogram",
  namespace: "http_server",
  name: "requests_seconds",
  buckets: [.1, .2, .3, .5, 1, 2, 3, 5],
  labels: ["method", "path", "status"],
}))
```

### `ts_prometheus` module
```typescript
// Creating directly from the connector
import { createCounter, createGauge, createHistogram } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/ts_prometheus.ts";

const serverConnectionsMetric = createCounter({
  name: "server_connections",
  help: "The amount of connections made to the server with a specific connection type",
  labels: ["type"],
});

const nodeMemoryFreeBytesMetric = createGauge({
  name: "node_memory_free_bytes",
  help: "The amount of free memory left on the node",
});

const httpServerResuestsSecondsMetric = createHistogram({
  name: "http_server_requests_seconds",
  buckets: [.1, .2, .3, .5, 1, 2, 3, 5],
  labels: ["method", "path", "status"],
});
```

```typescript
// Wrapping constructs from the module
import { Counter, Gauge, Histogram } from "https://deno.land/x/ts_prometheus/mod.ts";
import { createCounter, createGauge, createHistogram } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/ts_prometheus.ts";

const serverConnectionsMetric = createCounter(Counter.with({
  name: "server_connections",
  help: "The amount of connections made to the server with a specific connection type",
  labels: ["type"],
}));

const nodeMemoryFreeBytesMetric = createGauge(Gauge.with({
  name: "node_memory_free_bytes",
  help: "The amount of free memory left on the node",
}));

const httpServerResuestsSecondsMetric = createHistogram(Histogram.with({
  name: "http_server_requests_seconds",
  buckets: [.1, .2, .3, .5, 1, 2, 3, 5],
  labels: ["method", "path", "status"],
}));
```

## StatsD connectors

- [`statsd` module](#statsd-module)<!---->

### `statsd` module

```typescript
// Creating directly from the connector
import { createCounter, createGauge, createTiming } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/statsd.ts";

const serverConnectionsMetric = createCounter(
  theStatsDClient,
  "server_connections",
);

const nodeMemoryFreeBytesMetric = createGauge(
  theStatsDClient,
  "node_memory_free_bytes",
);

const httpServerResuestsSecondsMetric = createTiming(
  theStatsDClient,
  "http_server_requests_seconds",
);
```

```typescript
// Wrapping the client
import { wrapStatsDClient } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/statsd.ts";

const wrappedClient = wrapStatsDClient(theStatsDClient);

const serverConnectionsMetric = wrappedClient.createCounter(
  "server_connections",
);

const nodeMemoryFreeBytesMetric = wrappedClient.createGauge(
  "node_memory_free_bytes",
);

const httpServerResuestsSecondsMetric = wrappedClient.createTiming(
  "http_server_requests_seconds",
);
```

## Expvar connectors

- [Builtin Expvar](#builtin-expvar)<!---->

### Builtin Expvar

```typescript
// Creating directly from the connector
import { createCounter, createGauge } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/expvar.ts";

const serverConnectionsMetric = createCounter(
  "server_connections",
);

const nodeMemoryFreeBytesMetric = createGauge(
  "node_memory_free_bytes",
);
```

```typescript
// Wrapping constructs from the module
import { createCounter, createGauge } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/expvar.ts";
import * as expvar from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/expvar/mod.ts";

const serverConnectionsMetric = createCounter(expvar.createFloat(
  "server_connections",
));

const nodeMemoryFreeBytesMetric = createGauge(expvar.createFloat(
  "node_memory_free_bytes",
));
```

## Cloudwatch connectors

- [Builtin Discard](#builtin-cloudwatch)<!---->

### Builtin Cloudwatch

```typescript
// Creating directly from the connector
import { createCounter, createGauge } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/cloudwatch.ts";

const serverConnectionsMetric = createCounter({
  MetricName: 'server_connections'
});

const nodeMemoryFreeBytesMetric = createGauge({
  MetricName: 'node_memory_free_bytes'
});
```

## Discard connectors

- [Builtin Discard](#builtin-discard)<!---->

### Builtin Discard

```typescript
// Creating directly from the connector
import { createCounter, createGauge, createHistogram } from "https://raw.githubusercontent.com/ocpu/deno-metrics-kit/main/discard.ts";

const serverConnectionsMetric = createCounter();

const nodeMemoryFreeBytesMetric = createGauge();

const httpServerResuestsSecondsMetric = createHistogram();
```

