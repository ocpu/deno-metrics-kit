import {
  CounterMetric as PrometheusCounterMetric,
  CounterMetricTemplate as PrometheusCounterMetricTemplate,
} from "./prometheus/metrics/counter.ts";
import {
  GaugeMetric as PrometheusGaugeMetric,
  GaugeMetricTemplate as PrometheusGaugeMetricTemplate,
} from "./prometheus/metrics/gauge.ts";
import {
  HistogramMetric as PrometheusHistogramMetric,
  HistogramMetricTemplate as PrometheusHistogramMetricTemplate,
} from "./prometheus/metrics/histogram.ts";
import {
  SummaryMetric as PrometheusSummaryMetric,
  SummaryMetricTemplate as PrometheusSummaryMetricTemplate,
} from "./prometheus/metrics/summary.ts";
import {
  createCounter as createCounterMetric,
  createGauge as createGaugeMetric,
  createHistogram as createHistogramMetric,
  createSummary as createSummaryMetric,
} from "./prometheus/metrics.ts";
import type {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
} from "./metrics.ts";

export * from "./metrics.ts";

export function createCounter(
  counterMetricOrCreateOptions:
    | PrometheusCounterMetric<string>
    | PrometheusCounterMetricTemplate<string>
    | Parameters<typeof createCounterMetric>[0],
): CounterMetric {
  const counterMetric =
    counterMetricOrCreateOptions instanceof PrometheusCounterMetric ||
      counterMetricOrCreateOptions instanceof PrometheusCounterMetricTemplate
      ? counterMetricOrCreateOptions
      : createCounterMetric(counterMetricOrCreateOptions);
  let self: CounterMetric;
  return self = {
    with(labels) {
      return createCounter(counterMetric.with(labels));
    },
    set(value) {
      counterMetric.set(value);
      return self;
    },
    inc(value) {
      counterMetric.inc(value);
      return self;
    },
  };
}

export function createGauge(
  gaugeMetricOrCreateOptions:
    | PrometheusGaugeMetric<string>
    | PrometheusGaugeMetricTemplate<string>
    | Parameters<typeof createGaugeMetric>[0],
): GaugeMetric {
  const gaugeMetric =
    gaugeMetricOrCreateOptions instanceof PrometheusGaugeMetric ||
      gaugeMetricOrCreateOptions instanceof PrometheusGaugeMetricTemplate
      ? gaugeMetricOrCreateOptions
      : createGaugeMetric(gaugeMetricOrCreateOptions);
  let self: GaugeMetric;
  return self = {
    with(labels) {
      return createGauge(gaugeMetric.with(labels));
    },
    set(value) {
      gaugeMetric.set(value);
      return self;
    },
    inc(value) {
      gaugeMetric.inc(value);
      return self;
    },
    dec(value) {
      gaugeMetric.dec(value);
      return self;
    },
  };
}

export function createHistogram(
  histogramMetricOrCreateOptions:
    | PrometheusHistogramMetric<string>
    | PrometheusHistogramMetricTemplate<string>
    | Parameters<typeof createHistogramMetric>[0],
): HistogramMetric {
  const histogramMetric =
    histogramMetricOrCreateOptions instanceof PrometheusHistogramMetric ||
      histogramMetricOrCreateOptions instanceof
        PrometheusHistogramMetricTemplate
      ? histogramMetricOrCreateOptions
      : createHistogramMetric(histogramMetricOrCreateOptions);
  let self: HistogramMetric;
  return self = {
    with(labels) {
      return createHistogram(histogramMetric.with(labels));
    },
    observe(value) {
      histogramMetric.observe(value);
      return self;
    },
  };
}

export function createSummary(
  summaryMetricOrCreateOptions:
    | PrometheusSummaryMetric<string>
    | PrometheusSummaryMetricTemplate<string>
    | Parameters<typeof createSummaryMetric>[0],
): SummaryMetric {
  const summaryMetric =
    summaryMetricOrCreateOptions instanceof PrometheusSummaryMetric ||
      summaryMetricOrCreateOptions instanceof PrometheusSummaryMetricTemplate
      ? summaryMetricOrCreateOptions
      : createSummaryMetric(summaryMetricOrCreateOptions);
  let self: SummaryMetric;
  return self = {
    with(labels) {
      return createSummary(summaryMetric.with(labels));
    },
    observe(value) {
      summaryMetric.observe(value);
      return self;
    },
  };
}
