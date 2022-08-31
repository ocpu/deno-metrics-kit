import type { CollectedMetric, Collector } from "./common.ts";
import { createCounter, createGauge } from "./metrics.ts";
import { createRegistry } from "./registry.ts";

export function createAsyncCollector(
  collector: () => AsyncIterable<CollectedMetric>,
): Collector {
  return { collect: collector };
}

export function createDenoCollector(): Collector {
  const metricsRegistry = createRegistry();

  const opsDispatched = createCounter({
    namespace: "deno",
    name: "ops_dispatched",
    help: "The amount of operations Deno has dispatched to the Rust side",
    registry: metricsRegistry,
  });
  const opsDispatchedSync = createCounter({
    namespace: "deno",
    name: "ops_dispatched_sync",
    help:
      "The amount of synchrounous operations Deno has dispatched to the Rust side",
    registry: metricsRegistry,
  });
  const opsDispatchedAsync = createCounter({
    namespace: "deno",
    name: "ops_dispatched_async",
    help:
      "The amount of asynchrounous operations Deno has dispatched to the Rust side",
    registry: metricsRegistry,
  });
  const opsDispatchedAsyncUnref = createCounter({
    namespace: "deno",
    name: "ops_dispatched_async_unref",
    registry: metricsRegistry,
  });
  const opsCompleted = createCounter({
    namespace: "deno",
    name: "ops_completed",
    help: "The amount of operations that has been completed",
    registry: metricsRegistry,
  });
  const opsCompletedSync = createCounter({
    namespace: "deno",
    name: "ops_completed_sync",
    help: "The amount of synchrounous operations that has been completed",
    registry: metricsRegistry,
  });
  const opsCompletedAsync = createCounter({
    namespace: "deno",
    name: "ops_completed_async",
    help: "The amount of asynchrounous operations that has been completed",
    registry: metricsRegistry,
  });
  const opsCompletedAsyncUnref = createCounter({
    namespace: "deno",
    name: "ops_completed_async_unref",
    registry: metricsRegistry,
  });
  const bytesSentControl = createCounter({
    namespace: "deno",
    name: "bytes_sent_control",
    registry: metricsRegistry,
  });
  const bytesSentData = createCounter({
    namespace: "deno",
    name: "bytes_sent_data",
    registry: metricsRegistry,
  });
  const bytesReceived = createCounter({
    namespace: "deno",
    name: "bytes_received",
    registry: metricsRegistry,
  });
  const memoryExternal = createGauge({
    namespace: "deno",
    subsystem: "memory",
    name: "external_bytes",
    registry: metricsRegistry,
  });
  const memoryHeapTotal = createGauge({
    namespace: "deno",
    subsystem: "memory",
    name: "heap_total_bytes",
    registry: metricsRegistry,
  });
  const memoryHeapUsed = createGauge({
    namespace: "deno",
    subsystem: "memory",
    name: "heap_used_bytes",
    registry: metricsRegistry,
  });
  const memoryRSS = createGauge({
    namespace: "deno",
    subsystem: "memory",
    name: "rss_bytes",
    registry: metricsRegistry,
  });

  return createAsyncCollector(async function* () {
    const memory = Deno.memoryUsage();
    memoryExternal.set(memory.external);
    memoryHeapTotal.set(memory.heapTotal);
    memoryHeapUsed.set(memory.heapUsed);
    memoryRSS.set(memory.rss);

    const metrics = Deno.metrics();
    opsDispatched.set(metrics.opsDispatched);
    opsDispatchedSync.set(metrics.opsDispatchedSync);
    opsDispatchedAsync.set(metrics.opsDispatchedAsync);
    opsDispatchedAsyncUnref.set(metrics.opsDispatchedAsyncUnref);
    opsCompleted.set(metrics.opsCompleted);
    opsCompletedSync.set(metrics.opsCompletedSync);
    opsCompletedAsync.set(metrics.opsCompletedAsync);
    opsCompletedAsyncUnref.set(metrics.opsCompletedAsyncUnref);
    bytesSentControl.set(metrics.bytesSentControl);
    bytesSentData.set(metrics.bytesSentData);
    bytesReceived.set(metrics.bytesReceived);

    yield* metricsRegistry.collect();
  });
}
