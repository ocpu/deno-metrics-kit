import type { MetricDatum } from "https://deno.land/x/aws_api@v0.7.0/services/cloudwatch/structs.ts";
import { CounterMetric, GaugeMetric } from "./metrics.ts";

export interface CWCounterMetric extends CounterMetric {
  with(labels: Record<string, string>): CWCounterMetric;
  set(value: number, timestamp?: Date | number): CWCounterMetric;
  inc(step?: number, timestamp?: Date | number): CWCounterMetric;
  inc(timestamp?: Date): CWCounterMetric;
  readonly datum: MetricDatum;
}

export function createCounter(metricDatum: MetricDatum): CWCounterMetric {
  const datum: MetricDatum = {
    Value: 0,
    Unit: "Count",
    ...structuredClone(metricDatum),
  };
  let self: CWCounterMetric;
  return self = {
    datum,
    with(labels) {
      return createCounter({
        MetricName: datum.MetricName,
        Unit: datum.Unit,
        Dimensions: [
          ...(datum.Dimensions ?? []).filter((dim) => !(dim.Name in labels)),
          ...Object.entries(labels).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        ],
        Value: 0,
      });
    },
    set(value, ts = Date.now()) {
      datum.Value = value;
      datum.Timestamp = ts;
      return self;
    },
    inc(
      ...args: [step?: number, timestamp?: Date | number] | [timestamp?: Date]
    ) {
      if (args[0] instanceof Date) {
        return self.set(datum.Value! + 1, args[0]);
      } else if (typeof args[0] === "number") {
        return self.set(datum.Value! + args[0], args[1]);
      } else {
        return self.set(datum.Value! + 1);
      }
    },
  };
}

export interface CWGaugeMetric extends GaugeMetric {
  with(labels: Record<string, string>): CWGaugeMetric;
  set(value: number, timestamp?: Date | number): CWGaugeMetric;
  inc(step?: number, timestamp?: Date | number): CWGaugeMetric;
  inc(timestamp?: Date): CWGaugeMetric;
  dec(step?: number, timestamp?: Date | number): CWGaugeMetric;
  dec(timestamp?: Date): CWGaugeMetric;
  readonly datum: MetricDatum;
}

export function createGauge(metricDatum: MetricDatum): CWGaugeMetric {
  const datum: MetricDatum = {
    Value: 0,
    Unit: "Count",
    ...structuredClone(metricDatum),
  };
  let self: CWGaugeMetric;
  return self = {
    datum,
    with(labels) {
      return createGauge({
        MetricName: datum.MetricName,
        Unit: datum.Unit,
        Dimensions: [
          ...(datum.Dimensions ?? []).filter((dim) => !(dim.Name in labels)),
          ...Object.entries(labels).map(([key, value]) => ({
            Name: key,
            Value: value,
          })),
        ],
        Value: 0,
      });
    },
    set(value, ts = Date.now()) {
      datum.Value = value;
      datum.Timestamp = ts;
      return self;
    },
    inc(
      ...args: [step?: number, timestamp?: Date | number] | [timestamp?: Date]
    ) {
      if (args[0] instanceof Date) {
        return self.set(datum.Value! + 1, args[0]);
      } else if (typeof args[0] === "number") {
        return self.set(datum.Value! + args[0], args[1]);
      } else {
        return self.set(datum.Value! + 1);
      }
    },
    dec(
      ...args: [step?: number, timestamp?: Date | number] | [timestamp?: Date]
    ) {
      if (args[0] instanceof Date) {
        return self.set(datum.Value! - 1, args[0]);
      } else if (typeof args[0] === "number") {
        return self.set(datum.Value! - args[0], args[1]);
      } else {
        return self.set(datum.Value! - 1);
      }
    },
  };
}
