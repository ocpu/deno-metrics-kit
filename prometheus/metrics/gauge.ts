import { Metric, type MetricOptions, MetricTemplate } from "./common.ts";

/** A set of options that are specific for a gauge metric. */
// deno-lint-ignore no-empty-interface
export interface GaugeMetricOptions<Label extends string>
  extends MetricOptions<Label> {}

/** A metric template for a gauge based metric. */
export class GaugeMetricTemplate<Labels extends string> extends MetricTemplate<
  Labels,
  GaugeMetricOptions<Labels>,
  GaugeMetric<Labels>,
  GaugeMetricTemplate<Labels>
> {
  private readonly basicMetric: GaugeMetric<Labels>;
  constructor(name: string, options: Readonly<GaugeMetricOptions<Labels>>) {
    super(name, "gauge", GaugeMetric, options);
    this.basicMetric = this.with();
  }

  /**
   * Set the current value of the gauge metric.
   *
   * @param value The new value of the counter.
   * @returns The current instance of the metric.
   */
  set(value: number) {
    return this.basicMetric.set(value);
  }

  /**
   * Increment this counter metric by a specified stepping value or by 1.
   *
   * This method will throw an error if the value of the step parameter is less
   * than 0.
   *
   * @throws {GaugeIllegalStepError} When the increment step is less than 0.
   * @param step How much the counter should be incremented.
   * @returns The current instance of the metric.
   */
  inc(step = 1) {
    return this.basicMetric.inc(step);
  }

  /**
   * Decrement this counter metric by a specified stepping value or by 1.
   *
   * This method will throw an error if the value of the step parameter is less
   * than 0.
   *
   * @throws {GaugeIllegalStepError} When the decrement step is less than 0.
   * @param step How much the counter should be incremented.
   * @returns The current instance of the metric.
   */
  dec(step = 1) {
    return this.basicMetric.dec(step);
  }
}

/** An error that is thrown when an illegal stepping value is detected. */
export class GaugeIllegalStepError extends Error {
  [Symbol.toStringTag] = "GaugeIllegalStepError";
}

/** A metric instance for a gauge based metric. */
export class GaugeMetric<Labels extends string> extends Metric<
  Labels,
  GaugeMetricOptions<Labels>,
  GaugeMetric<Labels>,
  GaugeMetricTemplate<Labels>
> {
  /**
   * Set the current value of the gauge metric.
   *
   * @param value The new value of the counter.
   * @returns The current instance of the metric.
   */
  set(value: number) {
    this.getMetricValueObject()!.value = value;
    return this;
  }

  /**
   * Increment this counter metric by a specified stepping value or by 1.
   *
   * This method will throw an error if the value of the step parameter is less
   * than 0.
   *
   * @throws {GaugeIllegalStepError} When the increment step is less than 0.
   * @param step How much the counter should be incremented.
   * @returns The current instance of the metric.
   */
  inc(step = 1) {
    if (step < 0) {
      throw new GaugeIllegalStepError("Illegal step value: " + step);
    }
    this.getMetricValueObject()!.value += step;
    return this;
  }

  /**
   * Decrement this counter metric by a specified stepping value or by 1.
   *
   * This method will throw an error if the value of the step parameter is less
   * than 0.
   *
   * @throws {GaugeIllegalStepError} When the decrement step is less than 0.
   * @param step How much the counter should be incremented.
   * @returns The current instance of the metric.
   */
  dec(step = 1) {
    if (step < 0) {
      throw new GaugeIllegalStepError("Illegal step value: " + step);
    }
    this.getMetricValueObject()!.value -= step;
    return this;
  }
}
