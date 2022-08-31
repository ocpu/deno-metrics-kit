import type {
  CounterMetric,
  GaugeMetric,
  HistogramMetric,
  SummaryMetric,
} from "./metrics.ts";

export * from "./metrics.ts";

export function createCounter(): CounterMetric {
  let self: CounterMetric;
  return self = {
    with: () => self,
    set: () => self,
    inc: () => self,
  };
}

export function createGauge(): GaugeMetric {
  let self: GaugeMetric;
  return self = {
    with: () => self,
    set: () => self,
    inc: () => self,
    dec: () => self,
  };
}

export function createHistogram(): HistogramMetric {
  let self: HistogramMetric;
  return self = {
    with: () => self,
    observe: () => self,
  };
}

export function createSummary(): SummaryMetric {
  let self: SummaryMetric;
  return self = {
    with: () => self,
    observe: () => self,
  };
}
