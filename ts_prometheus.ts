import {
  Counter,
  Dec,
  Gauge,
  Histogram,
  Summary,
  Inc,
  Observe,
  Set,
} from "https://deno.land/x/ts_prometheus@v0.3.0/mod.ts";
import { Value } from "https://deno.land/x/ts_prometheus@v0.3.0/metric.ts";
import type { CounterMetric, GaugeMetric, HistogramMetric, SummaryMetric } from "./metrics.ts";

export * from "./metrics.ts";

export function createCounter(
  counterMetricOrCounterConfig: Counter | Parameters<typeof Counter.with>[0],
  labels: Record<string, string> = {},
): CounterMetric {
  const counterMetric = counterMetricOrCounterConfig instanceof Counter
    ? counterMetricOrCounterConfig
    : Counter.with(counterMetricOrCounterConfig)
  let instance: Inc & Value;
  let self: CounterMetric;
  return self = {
    with(newLabels) {
      return createCounter(counterMetric, { ...labels, ...newLabels });
    },
    set(value) {
      if (instance === undefined) instance = counterMetric.labels(labels);
      instance.inc(value - (instance.value() ?? 0));
      return self;
    },
    inc(value) {
      if (instance === undefined) instance = counterMetric.labels(labels);
      if (value === undefined) instance.inc();
      else instance.inc(value);
      return self;
    },
  };
}

export function createGauge(
  gaugeMetricOrGaugeConfig: Gauge | Parameters<typeof Gauge.with>[0],
  labels: Record<string, string> = {},
): GaugeMetric {
  const gaugeMetric = gaugeMetricOrGaugeConfig instanceof Gauge
    ? gaugeMetricOrGaugeConfig
    : Gauge.with(gaugeMetricOrGaugeConfig)
  let instance: Inc & Dec & Set & Value;
  let self: GaugeMetric;
  return self = {
    with(newLabels) {
      return createGauge(gaugeMetric, { ...labels, ...newLabels });
    },
    set(value) {
      if (instance === undefined) instance = gaugeMetric.labels(labels);
      instance.set(value);
      return self;
    },
    inc(value) {
      if (instance === undefined) instance = gaugeMetric.labels(labels);
      if (value === undefined) instance.inc();
      else instance.inc(value);
      return self;
    },
    dec(value) {
      if (instance === undefined) instance = gaugeMetric.labels(labels);
      if (value === undefined) instance.dec();
      else instance.dec(value);
      return self;
    },
  };
}

export function createHistogram(
  histogramMetricOrHistogramConfig: Histogram | Parameters<typeof Histogram.with>[0],
  labels: Record<string, string> = {},
): HistogramMetric {
  const histogramMetric = histogramMetricOrHistogramConfig instanceof Histogram
    ? histogramMetricOrHistogramConfig
    : Histogram.with(histogramMetricOrHistogramConfig)
  let instance: Observe;
  let self: HistogramMetric;
  return self = {
    with(newLabels) {
      return createHistogram(histogramMetric, { ...labels, ...newLabels });
    },
    observe(value) {
      if (instance === undefined) instance = histogramMetric.labels(labels);
      instance.observe(value);
      return self;
    },
  };
}

export function createSummary(
  summaryMetricOrSummaryConfig: Summary | Parameters<typeof Summary.with>[0],
  labels: Record<string, string> = {},
): SummaryMetric {
  const summaryMetric = summaryMetricOrSummaryConfig instanceof Summary
    ? summaryMetricOrSummaryConfig
    : Summary.with(summaryMetricOrSummaryConfig)
  let instance: Observe;
  let self: SummaryMetric;
  return self = {
    with(newLabels) {
      return createSummary(summaryMetric, { ...labels, ...newLabels });
    },
    observe(value) {
      if (instance === undefined) instance = summaryMetric.labels(labels);
      instance.observe(value);
      return self;
    },
  };
}
