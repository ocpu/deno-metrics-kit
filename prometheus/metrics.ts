import type { MetricType } from "./common.ts";
import { type MetricOptions, MetricTemplate } from "./metrics/common.ts";
import {
  type CounterMetricOptions,
  CounterMetricTemplate,
} from "./metrics/counter.ts";
import {
  type GaugeMetricOptions,
  GaugeMetricTemplate,
} from "./metrics/gauge.ts";
import {
  type HistogramMetricOptions,
  HistogramMetricTemplate,
} from "./metrics/histogram.ts";
import {
  type SummaryMetricOptions,
  SummaryMetricTemplate,
} from "./metrics/summary.ts";
import { defaultRegistry, type Registry } from "./registry.ts";

type CreateMetricTemplateOptions<
  Type extends MetricType,
  Labels extends string,
  Options extends MetricOptions<Labels>,
> = {
  /** The type of metric to create. */
  type: Type;
  /** The name of the metric. */
  name: string;
  /** A name that will be prepended before the name of the metric. */
  namespace?: string;
  /** A name that will be prepended before the name of the metric, but after the namespace. */
  subsystem?: string;
  /**
   * Where to register this metric. If not defined and no other registries has
   * been defined in the `registries` property it will default to the default
   * regitry. If explicitly set to `undefined` it will not be registered in the
   * default registry.
   */
  registry?: Registry;
  /** A list of registries where to register this metric. */
  registries?: Registry[];
} & Options;

type GetMetricOptions<Type extends MetricType, Labels extends string> =
  Type extends "counter" ? CounterMetricOptions<Labels>
    : Type extends "gauge" ? GaugeMetricOptions<Labels>
    : Type extends "histogram" ? HistogramMetricOptions<Labels>
    : Type extends "summary" ? SummaryMetricOptions<Labels>
    : MetricOptions<Labels>;

type GetMetricReturn<Type extends MetricType, Labels extends string> =
  Type extends "counter" ? CounterMetricTemplate<Labels>
    : Type extends "gauge" ? GaugeMetricTemplate<Labels>
    : Type extends "histogram" ? HistogramMetricTemplate<Labels>
    : Type extends "summary" ? SummaryMetricTemplate<Labels>
    : // deno-lint-ignore no-explicit-any
    MetricTemplate<Labels, MetricOptions<Labels>, any, any>;

export function createMetric<Type extends MetricType, Labels extends string>(
  args: CreateMetricTemplateOptions<
    Type,
    Labels,
    GetMetricOptions<Type, Labels>
  >,
): GetMetricReturn<Type, Labels>;
export function createMetric<Labels extends string>(
  { type, name, namespace, subsystem, ...options }:
    CreateMetricTemplateOptions<MetricType, Labels, MetricOptions<Labels>>,
  // deno-lint-ignore no-explicit-any
): MetricTemplate<Labels, MetricOptions<Labels>, any, any> {
  const fqName = [namespace, subsystem, name].filter(Boolean).join("_");
  if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(fqName)) {
    throw new Error(
      "The metric name does not conform to the naming guidelines /[a-zA-Z_:][a-zA-Z0-9_:]*/",
    );
  }
  const labelNames = Array.isArray(options.labels)
    ? options.labels
    : typeof options.labels === "object" && options.labels !== null
    ? Object.keys(options.labels)
    : [];
  for (const label of labelNames) {
    if (!/^[a-zA-Z_:][a-zA-Z0-9_:]*$/.test(label)) {
      throw new Error(
        `The label ${label} does not conform to the naming guidelines /[a-zA-Z_:][a-zA-Z0-9_:]*/`,
      );
    }
    if (/^__/.test(label)) {
      throw new Error(
        `The label ${label} cannot use prometheus reserved internal name structure /^__/`,
      );
    }
  }

  const { registries, registry, ...metricOptions } = options

  // deno-lint-ignore no-explicit-any
  let metric: MetricTemplate<Labels, MetricOptions<Labels>, any, any>;
  switch (type) {
    case "counter":
      metric = new CounterMetricTemplate<Labels>(fqName, metricOptions);
      break;
    case "gauge":
      metric = new GaugeMetricTemplate<Labels>(fqName, metricOptions);
      break;
    case "histogram":
      metric = new HistogramMetricTemplate<Labels>(
        fqName,
        metricOptions as HistogramMetricOptions<Labels>,
      );
      break;
    case "summary":
      metric = new SummaryMetricTemplate<Labels>(
        fqName,
        metricOptions as SummaryMetricOptions<Labels>,
      );
      break;
    default:
      throw new Error("Invalid metric type");
  }
  if (registry !== undefined) registry.register(metric);
  for (const reg of registries ?? []) if (reg !== registry) reg.register(reg);
  if (!('registry' in options && registry === undefined && registries === undefined)) {
    defaultRegistry.register(metric);
  }
  return metric;
}

export function createCounter<Labels extends string>(
  args: Omit<
    CreateMetricTemplateOptions<
      "counter",
      Labels,
      CounterMetricOptions<Labels>
    >,
    "type"
  >,
) {
  return createMetric({ ...args, type: "counter" });
}

export function createGauge<Labels extends string>(
  args: Omit<
    CreateMetricTemplateOptions<"gauge", Labels, GaugeMetricOptions<Labels>>,
    "type"
  >,
) {
  return createMetric({ ...args, type: "gauge" });
}

export function createHistogram<Labels extends string>(
  args: Omit<
    CreateMetricTemplateOptions<
      "histogram",
      Labels,
      HistogramMetricOptions<Labels>
    >,
    "type"
  >,
) {
  return createMetric({ ...args, type: "histogram" });
}

export function createSummary<Labels extends string>(
  args: Omit<
    CreateMetricTemplateOptions<
      "summary",
      Labels,
      SummaryMetricOptions<Labels>
    >,
    "type"
  >,
) {
  return createMetric({ ...args, type: "summary" });
}
