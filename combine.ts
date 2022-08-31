import { CounterMetric, GaugeMetric, HistogramMetric } from "./metrics.ts";

export function combineCounters(...counters: CounterMetric[]): CounterMetric {
	let self: CounterMetric
	return self = {
		with(labels) {
			return combineCounters(...counters.map(it => it.with(labels)))
		},
		set(value) {
			counters.forEach(it => it.set(value))
			return self
		},
		inc(value) {
			counters.forEach(it => it.inc(value))
			return self
		},
	}
}

export function combineGauges(...gauges: GaugeMetric[]): GaugeMetric {
	let self: GaugeMetric
	return self = {
		with(labels) {
			return combineGauges(...gauges.map(it => it.with(labels)))
		},
		set(value) {
			gauges.forEach(it => it.set(value))
			return self
		},
		inc(value) {
			gauges.forEach(it => it.inc(value))
			return self
		},
		dec(value) {
			gauges.forEach(it => it.dec(value))
			return self
		},
	}
}

export function combineHistograms(...histograms: HistogramMetric[]): HistogramMetric {
	let self: HistogramMetric
	return self = {
		with(labels) {
			return combineHistograms(...histograms.map(it => it.with(labels)))
		},
		observe(value) {
			histograms.forEach(it => it.observe(value))
			return self
		},
	}
}
