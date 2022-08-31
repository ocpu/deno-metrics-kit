import {
  type CollectedMetric,
  type Collector,
  type HierarchicalMetricValue,
  isHierarchicalMetric,
  type MetricType,
  type MetricValue,
} from "../common.ts";

/** A generic set of options that can be provided to a metric. */
export interface MetricOptions<Label extends string> {
  /** A string that describes the metric. */
  help?: string;
  /** A set of labels that are used to differentiate between different cardinals of this metric. */
  labels?: readonly Label[] | { [K in Label]: string | undefined };
}

/** A generic basic template for a specific metric. */
export abstract class MetricTemplate<
  Labels extends string,
  Options extends MetricOptions<Labels>,
  TMetric extends Metric<Labels, Options, TMetric, TTemplate>,
  TTemplate extends MetricTemplate<Labels, Options, TMetric, TTemplate>,
> implements Collector {
  /** The string that describes the metric. */
  public readonly help: string | undefined;
  private readonly baseLabelValues: { [K in Labels]: string };
  public readonly metrics: (MetricValue | HierarchicalMetricValue)[] = [];

  constructor(
    /** The fully qualified name for the metric. */
    public readonly name: string,
    /** The type of the metric. */
    public readonly type: MetricType,
    private readonly metricCtor: {
      new (vec: TTemplate, labelValues: { [K in Labels]: string }): TMetric;
    },
    /** The options specific for this metric. */
    public readonly options: Readonly<Options>,
  ) {
    this.help = options.help;
    if (Array.isArray(options.labels)) {
      this.baseLabelValues = Object.fromEntries(
        options.labels.map((name) => [name, undefined]),
      );
    } else if (typeof options.labels === "object" && options.labels !== null) {
      this.baseLabelValues = options.labels as { [K in Labels]: string };
    } else {
      this.baseLabelValues = {} as { [K in Labels]: string };
    }
  }

  /** Create a metric instance with no extra labels. */
  with(): TMetric;
  /**
   * Create a metric instance with the specified label set to a specific value.
   *
   * @param label The label name.
   * @param value The label value.
   */
  with(label: Labels, value: string): TMetric;
  /**
   * Create a metric instance with a group of labels set to their specific
   * values.
   *
   * @param labels The label record from where the labels and label values are
   * taken from.
   */
  with(labels: { [L in Labels]?: string }): TMetric;
  with(
    ...args: [label: Labels, value: string] | [{ [L in Labels]?: string }] | []
  ): TMetric {
    if (args.length === 0) {
      return new this.metricCtor(this as unknown as TTemplate, {
        ...this.baseLabelValues,
      });
    }
    if (args.length === 1) {
      for (const label of Object.keys(args[0])) {
        if (!(label in this.baseLabelValues)) {
          throw new Error("Invalid label " + label);
        }
      }
      return new this.metricCtor(this as unknown as TTemplate, {
        ...this.baseLabelValues,
        ...args[0],
      });
    } else {
      if (!(args[0] in this.baseLabelValues)) {
        throw new Error("Invalid label " + args[0]);
      }
      return new this.metricCtor(this as unknown as TTemplate, {
        ...this.baseLabelValues,
        [args[0]]: args[1],
      });
    }
  }

  async *collect(): AsyncIterable<CollectedMetric> {
    for (const metric of this.metrics) {
      if (isHierarchicalMetric(metric)) {
        for (const subMetric of metric.values) {
          yield {
            desc: {
              type: this.type,
              help: this.help ?? "",
              name: subMetric.name !== '' ? this.name + "_" + subMetric.name : this.name,
            },
            metric: {
              labels: { ...metric.labels, ...subMetric.labels },
              value: subMetric.value,
            },
          };
        }
      } else {
        yield {
          desc: {
            type: this.type,
            help: this.help ?? "",
            name: this.name,
          },
          metric: metric,
        };
      }
    }
  }
}

/** A generic basic instance for a specific metric. */
export abstract class Metric<
  Labels extends string,
  Options extends MetricOptions<Labels>,
  TMetric extends Metric<Labels, Options, TMetric, TTemplate>,
  TTemplate extends MetricTemplate<Labels, Options, TMetric, TTemplate>,
> {
  private metricObject: MetricValue | undefined;
  private hierarchicalMetricObject: HierarchicalMetricValue | undefined;
  constructor(
    protected readonly template: TTemplate,
    public readonly labelValues: { [K in Labels]: string },
  ) {
  }

  /** Create a new metric instance with no extra labels. */
  with(): TMetric;
  /**
   * Create a new metric instance with the specified label set to a specific
   * value.
   *
   * @param label The label name.
   * @param value The label value.
   */
  with(label: Labels, value: string): TMetric;
  /**
   * Create a new metric instance with a group of labels set to their specific
   * values.
   *
   * @param labels The label record from where the labels and label values are
   * taken from.
   */
  with(labels: { [L in Labels]?: string }): TMetric;
  with(
    ...args: [label: Labels, value: string] | [{ [L in Labels]?: string }] | []
  ): TMetric {
    //@ts-expect-error As the all encompassing function for all types of args is not exposed this will receive a type error
    return this.template.with(...args);
  }

  protected getMetricValueObject(): MetricValue | undefined {
    if (this.hierarchicalMetricObject !== undefined) return undefined;
    return this.metricObject ??= (() => {
      if (
        Object.values(this.labelValues).some((value) =>
          typeof value !== "string"
        )
      ) {
        const unsetLabels = Object.entries(this.labelValues).filter((
          [, value],
        ) => typeof value !== "string").map(([key]) => key);
        throw new Error(
          `Unset labels on metric ${this.template.name}: ` + unsetLabels.join(", "),
        );
      }
      const m = this.template.metrics.find((it) =>
        Object.keys(it.labels).every((label) =>
          it.labels[label as keyof typeof it.labels] ===
            this.labelValues[label as keyof typeof this.labelValues]
        )
      );
      if (m !== undefined) return m as MetricValue;
      const res = { value: 0, labels: this.labelValues };
      this.template.metrics.push(res);
      return res as MetricValue;
    })();
  }

  protected getHierarchicalMetricValueObject(
    getSubMetrics: () => HierarchicalMetricValue["values"],
  ): HierarchicalMetricValue | undefined {
    if (this.metricObject !== undefined) return undefined;
    return this.hierarchicalMetricObject ??= (() => {
      if (
        Object.values(this.labelValues).some((value) =>
          typeof value !== "string"
        )
      ) {
        const unsetLabels = Object.entries(this.labelValues).filter((
          [, value],
        ) => typeof value !== "string").map(([key]) => key);
        throw new Error(
          `Unset labels on metric ${this.template.name}: ` + unsetLabels.join(", "),
        );
      }
      const m = this.template.metrics.find((it) =>
        Object.keys(it.labels).every((label) =>
          it.labels[label as keyof typeof it.labels] ===
            this.labelValues[label as keyof typeof this.labelValues]
        )
      );
      if (m !== undefined) return m as HierarchicalMetricValue;
      const res = { labels: this.labelValues, values: getSubMetrics() };
      this.template.metrics.push(res);
      return res as HierarchicalMetricValue;
    })();
  }
}
