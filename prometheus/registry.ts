import type { CollectedMetric, Collector } from "./common.ts";

/**
 * A registry is used to hold a number of metrics and also other collectors.
 * It is then able to return all of the collected metrics from the registered
 * metrics and collectors when requested.
 * 
 * It is itself a collector so a registry can register other registries.
 */
export interface Registry extends Collector {
  register(collector: Collector): void;
}

/**
 * Create a new metric registry.
 * 
 * A registry is used to hold a number of metrics and also other collectors.
 * It is then able to return all of the collected metrics from the registered
 * metrics and collectors when requested.
 * 
 * @returns A new metric registry.
 */
export function createRegistry(): Registry {
  const collectors: Collector[] = [];
  return {
    register(collector) {
      collectors.push(collector);
    },
    async *collect(): AsyncIterable<CollectedMetric> {
      for (const collector of collectors) {
        yield* collector.collect()
      }
    },
  };
}

/** The default registry. */
export const defaultRegistry = createRegistry();
