import { Metric, type MetricOptions, MetricTemplate } from "./common.ts";

/** A set of options that are specific for a counter metric. */
// deno-lint-ignore no-empty-interface
export interface CounterMetricOptions<Label extends string>
  extends MetricOptions<Label> {}

/** A metric template for a counter based metric. */
export class CounterMetricTemplate<Labels extends string>
  extends MetricTemplate<
    Labels,
    CounterMetricOptions<Labels>,
    CounterMetric<Labels>,
    CounterMetricTemplate<Labels>
  > {
  private readonly basicMetric: CounterMetric<Labels>;
  constructor(name: string, options: Readonly<CounterMetricOptions<Labels>>) {
    super(name, "counter", CounterMetric, options);
    this.basicMetric = this.with();
  }

  /**
   * Set the current value of the counter metric.
   *
   * When the passed value is not greater that the current value, then this
   * function will throw an error. As a counter metric cannot be decremented.
   * It is fine to set the value to `0` as that does not count as decrementing.
   *
   * @throws {CounterDecrementationError} If the new value would decrement the
   * counter value.
   * @param value The new value of the counter.
   * @returns The current instance of the metric.
   */
  set(value: number) {
    return this.basicMetric.set(value);
  }

  /**
   * Set the value of the counter to `0`.
   *
   * @returns The current instance of the metric.
   */
  zero() {
    return this.basicMetric.zero();
  }

  /**
   * Increment this counter metric by a specified stepping value or by 1.
   *
   * This method will throw an error if the value of the step parameter is less
   * than 0.
   *
   * @throws {CounterIllegalStepError} When the increment step is less than 0.
   * @param step How much the counter should be incremented.
   * @returns The current instance of the metric.
   */
  inc(step = 1) {
    return this.basicMetric.inc(step);
  }
}

/** An error that is thrown when a counter would be decremented. */
export class CounterDecrementationError extends Error {
  [Symbol.toStringTag] = "CounterDecrementationError";
}
/** An error that is thrown when an illegal stepping value is detected. */
export class CounterIllegalStepError extends Error {
  [Symbol.toStringTag] = "CounterIllegalStepError";
}

/** A metric instance for a counter based metric. */
export class CounterMetric<Labels extends string> extends Metric<
  Labels,
  CounterMetricOptions<Labels>,
  CounterMetric<Labels>,
  CounterMetricTemplate<Labels>
> {
  /**
   * Set the current value of the counter metric.
   *
   * When the passed value is not greater that the current value, then this
   * function will throw an error. As a counter metric cannot be decremented.
   * It is fine to set the value to `0` as that does not count as decrementing.
   *
   * @throws {CounterDecrementationError} If the new value would decrement the
   * counter value.
   * @param value The new value of the counter.
   * @returns The current instance of the metric.
   */
  set(value: number) {
    const metric = this.getMetricValueObject()!;
    if (value !== 0 && value < metric.value) {
      throw new CounterDecrementationError(
        "A counter metric cannot be decremented",
      );
    }
    metric.value = value;
    return this;
  }

  /**
   * Set the value of the counter to `0`.
   *
   * @returns The current instance of the metric.
   */
  zero() {
    return this.set(0);
  }

  /**
   * Increment this counter metric by a specified stepping value or by 1.
   *
   * This method will throw an error if the value of the step parameter is less
   * than 0.
   *
   * @throws {CounterIllegalStepError} When the increment step is less than 0.
   * @param step How much the counter should be incremented.
   * @returns The current instance of the metric.
   */
  inc(step = 1) {
    if (step < 0) {
      throw new CounterIllegalStepError("Illegal step value: " + step);
    }
    return this.set(this.getMetricValueObject()!.value + step);
  }
}
