import { StatsDClient } from "https://deno.land/x/statsd@0.5.0/mod.ts";
import {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  UnsupportedOperationError,
} from "./metrics.ts";

export * from "./metrics.ts";

export interface StatsDClientWrapper {
  createCounter(name: string, labels?: Record<string, string>): CounterMetric;
  createGauge(name: string, labels?: Record<string, string>): GaugeMetric;
  createTiming(name: string, labels?: Record<string, string>): HistogramMetric;
}

export function wrapStatsDClient(client: StatsDClient): StatsDClientWrapper {
  return {
    createCounter(name, labels = {}) {
      return createCounter(client, name, labels);
    },
    createGauge(name, labels = {}) {
      return createGauge(client, name, labels);
    },
    createTiming(name, labels = {}) {
      return createTiming(client, name, labels);
    },
  };
}

export function createCounter(
  client: StatsDClient,
  name: string,
  labels: Record<string, string> = {},
): CounterMetric {
  let self: CounterMetric;
  return self = {
    with(newLabels) {
      return createCounter(client, name, { ...labels, ...newLabels });
    },
    set() {
      throw new UnsupportedOperationError(
        "The set operation for counters are not supported by StatsD.",
      );
    },
    inc(value = 1) {
      client.count(name, value, { tags: labels });
      return self;
    },
  };
}

export function createGauge(
  client: StatsDClient,
  name: string,
  labels: Record<string, string> = {},
): GaugeMetric {
  let self: GaugeMetric;
  return self = {
    with(newLabels) {
      return createGauge(client, name, { ...labels, ...newLabels });
    },
    set(value) {
      client.gauge(name, value, { tags: labels });
      return self;
    },
    inc(value = 1) {
      client.adjustGauge(name, value, { tags: labels });
      return self;
    },
    dec(value = 1) {
      client.adjustGauge(name, -value, { tags: labels });
      return self;
    },
  };
}

export function createTiming(
  client: StatsDClient,
  name: string,
  labels: Record<string, string> = {},
): HistogramMetric {
  let self: HistogramMetric;
  return self = {
    with(newLabels) {
      return createTiming(client, name, { ...labels, ...newLabels });
    },
    observe(value) {
      client.timing(name, value, { tags: labels });
      return self;
    },
  };
}
