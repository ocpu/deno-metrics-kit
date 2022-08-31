import { createFloat, FloatVar } from "./expvar/mod.ts";
import type { CounterMetric, GaugeMetric } from "./metrics.ts";

export * from "./metrics.ts";

export function createCounter(vOrName: FloatVar | string): CounterMetric {
  const v = vOrName instanceof FloatVar ? vOrName : createFloat(vOrName);
  let self: CounterMetric;
  return self = {
    with: () => self,
    set(value) {
      v.set(value);
      return self;
    },
    inc(value) {
      v.set((v.value() ?? 0) + (value ?? 0));
      return self;
    },
  };
}

export function createGauge(vOrName: FloatVar | string): GaugeMetric {
  const v = vOrName instanceof FloatVar ? vOrName : createFloat(vOrName);
  let self: GaugeMetric;
  return self = {
    with: () => self,
    set(value) {
      v.set(value);
      return self;
    },
    inc(value = 1) {
      v.set((v.value() ?? 0) + value);
      return self;
    },
    dec(value = 1) {
      v.set((v.value() ?? 0) - value);
      return self;
    },
  };
}
