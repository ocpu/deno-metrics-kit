import type { MetricValue } from "../common.ts";
import { Metric, type MetricOptions, MetricTemplate } from "./common.ts";

interface HistogramForm {
  counts: MetricValue[];
  all?: MetricValue;
  count: MetricValue;
  sum: MetricValue;
}

export interface HistogramMetricOptions<Label extends string>
  extends MetricOptions<Label> {
  buckets: number[];
}

export class HistogramMetricTemplate<Labels extends string>
  extends MetricTemplate<
    Labels,
    HistogramMetricOptions<Labels>,
    HistogramMetric<Labels>,
    HistogramMetricTemplate<Labels>
  > {
  private readonly basicMetric: HistogramMetric<Labels>;

  constructor(name: string, options: Readonly<HistogramMetricOptions<Labels>>) {
    super(name, "histogram", HistogramMetric, options);
    this.basicMetric = this.with();
  }

  observe(value: number) {
    return this.basicMetric.observe(value);
  }
}
export class HistogramMetric<Labels extends string> extends Metric<
  Labels,
  HistogramMetricOptions<Labels>,
  HistogramMetric<Labels>,
  HistogramMetricTemplate<Labels>
> {
  private form: HistogramForm | undefined;

  constructor(
    vec: HistogramMetricTemplate<Labels>,
    labelValues: { [K in Labels]: string },
  ) {
    super(vec, labelValues);
  }

  observe(value: number) {
    const form = this.getForm();
    for (let i = 0; i < form.counts.length; i++) {
      if (value <= this.template.options.buckets[i]) {
        form.counts[i].value++;
      }
    }
    if (form.all !== undefined) form.all.value++;
    form.count.value++;
    form.sum.value = form.sum.value + value;
  }

  private getForm(): HistogramForm {
    return this.form ??= (() => {
      const metricObject = this.getHierarchicalMetricValueObject(() => [
        ...Array.from(
          { length: this.template.options.buckets.length },
          (_, index) => ({
            name: "bucket",
            value: 0,
            labels: {
              le: String(this.template.options.buckets[index]),
            },
          }),
        ),
        ...this.template.options.buckets.length === 0 ? [] : [{
          name: "bucket",
          value: 0,
          labels: {
            le: "+Inf",
          },
        }],
        {
          name: "count",
          value: 0,
          labels: {},
        },
        {
          name: "sum",
          value: 0,
          labels: {},
        },
      ])!;
      return {
        counts: metricObject.values.slice(0, this.template.options.buckets.length),
        all: this.template.options.buckets.length === 0
          ? undefined
          : metricObject.values[this.template.options.buckets.length],
        count: metricObject.values[this.template.options.buckets.length + 1],
        sum: metricObject.values[this.template.options.buckets.length + 2],
      };
    })();
  }
}
