/** A string enum type of the supported metric types. */
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

/** A generic metric description with its fully qualified name, help string, and type */
export interface MetricDesc {
  /** The name of the collected metric. */
  readonly name: string
  /** The help string that describes the collected metric. */
  readonly help: string
  /** The type of the metric. */
  readonly type: MetricType
}

/** A generic metric value with its accosiated label values. */
export interface MetricValue {
  /** The record that holds the metric labels and their accossiated values. */
  readonly labels: Record<string, string>
  /** The metric numeric value. */
  value: number
}

/** An intermediate representation of a metric that contains multiple values and descriptions. */
export interface HierarchicalMetricValue {
  readonly labels: Record<string, string>
  readonly values: (MetricValue & { name: string })[]
}

/** A generic description of a collected metric with an accosiation of a description and value. */
export interface CollectedMetric {
  /** The description of this collected metric. */
  readonly desc: MetricDesc
  /** The actual values to this collected metric. */
  readonly metric: Readonly<MetricValue>
}

/** A generic representation of an object that can return a number of collected metrics. */
export interface Collector {
	collect(): AsyncIterable<CollectedMetric>
}

export function isHierarchicalMetric(metric: MetricValue | HierarchicalMetricValue): metric is HierarchicalMetricValue {
  return Array.isArray((metric as HierarchicalMetricValue).values)
}
