import { isHierarchicalMetric, MetricValue } from "../common.ts";
import { Metric, type MetricOptions, MetricTemplate } from "./common.ts";

interface SummaryForm {
  counts: MetricValue[];
  count: MetricValue;
  sum: MetricValue;
  stateKey: string
}

interface Sample {
  timestamp: number
  value: number
}

interface SummaryState {
  samples: Sample[]
  dirty: boolean
}

export interface SummaryMetricOptions<Label extends string>
  extends MetricOptions<Label> {
  quantiles: number[];
  maxAge?: number
  maxSamples?: number
}

export class IllegalQualtileValueError extends Error {
  constructor(
    public readonly quantile: number,
    ...args: ConstructorParameters<typeof Error>
  ) {
    super(...args)
  }
}

export class IllegalMaxAgeError extends Error {}

export class SummaryMetricTemplate<Labels extends string>
  extends MetricTemplate<
    Labels,
    SummaryMetricOptions<Labels>,
    SummaryMetric<Labels>,
    SummaryMetricTemplate<Labels>
  > {
  private readonly basicMetric: SummaryMetric<Labels>;
  public readonly states: Record<string, SummaryState> = {}

  constructor(name: string, options: Readonly<SummaryMetricOptions<Labels>>) {
    super(name, "summary", SummaryMetric, options);
    if (options.quantiles.some(qualtile => qualtile > 1 || qualtile < 0)) {
      throw new IllegalQualtileValueError(options.quantiles.find(qualtile => qualtile > 1 || qualtile < 0)!)
    }
    if (typeof options.maxAge === 'number' && options.maxAge <= 0) {
      throw new IllegalMaxAgeError()
    }
    this.basicMetric = this.with();
  }

  observe(value: number) {
    return this.basicMetric.observe(value);
  }

  async *collect() {
    const now = Date.now()
    for (const metric of this.metrics) {
      if (!isHierarchicalMetric(metric)) continue
      const stateKey = Object.entries(metric.labels)
        .sort(([a],[b]) => a.localeCompare(b))
        .reduceRight((acc, [key, value]) => `${key}=${value}\n${acc}`, '')
      const state = this.states[stateKey]
      if (state === undefined || !state.dirty) continue
      const sortedSamples = state.samples.filter((sample, i) => {
        if (typeof this.options.maxSamples === 'number' && state.samples.length > this.options.maxSamples && state.samples.length - this.options.maxSamples > i) return false
        if (typeof this.options.maxAge === 'number' && now - sample.timestamp > this.options.maxAge) return false
        return true
      }).sort((a, b) => a.value - b.value)
      const low = sortedSamples[0], high = sortedSamples.at(-1)!
      const quantiles = Array.from({ length: this.options.quantiles.length }, () => 0)
      for (const sample of sortedSamples) {
        const q = (sample.value - low.value) / (high.value - low.value)
        for (let i = 0; i < this.options.quantiles.length; i++) {
          if (q <= this.options.quantiles[i]) {
            quantiles[i]++
          }
        }
      }
      for (let i = 0; i < this.options.quantiles.length; i++) {
        metric.values[i].value = quantiles[i] / sortedSamples.length
      }
      state.dirty = false
    }
    yield* super.collect()
  }
}
export class SummaryMetric<Labels extends string> extends Metric<
  Labels,
  SummaryMetricOptions<Labels>,
  SummaryMetric<Labels>,
  SummaryMetricTemplate<Labels>
> {
  private form: SummaryForm | undefined;
  private state: SummaryState | undefined

  constructor(
    template: SummaryMetricTemplate<Labels>,
    labelValues: { [K in Labels]: string },
  ) {
    super(template, labelValues);
  }

  observe(value: number) {
    if (this.form === undefined) this.form = this.getForm()
    if (this.state === undefined) {
      this.state = this.template.states[this.form.stateKey] ??=  { samples: [], dirty: false }
    }
    this.state.samples.push({
      timestamp: Date.now(),
      value,
    })
    this.state.dirty = true
  }

  private getForm(): SummaryForm {
    return this.form ??= (() => {
      const metricObject = this.getHierarchicalMetricValueObject(() => [
        ...Array.from(
          { length: this.template.options.quantiles.length },
          (_, index) => ({
            name: "",
            value: 0,
            labels: {
              le: String(this.template.options.quantiles[index]),
            },
          }),
        ),
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
        counts: metricObject.values.slice(0, this.template.options.quantiles.length),
        count: metricObject.values[this.template.options.quantiles.length + 1],
        sum: metricObject.values[this.template.options.quantiles.length + 2],
        stateKey: Object.entries(this.labelValues)
          .sort(([a],[b]) => a.localeCompare(b))
          .reduceRight((acc, [key, value]) => `${key}=${value}\n${acc}`, '')
      };
    })();
  }
}
