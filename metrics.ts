export interface CounterMetric {
	with(labels: Record<string, string>): CounterMetric
	set(value: number): CounterMetric
	inc(step?: number): CounterMetric
}

export interface GaugeMetric {
	with(labels: Record<string, string>): GaugeMetric
	set(value: number): GaugeMetric
	inc(step?: number): GaugeMetric
	dec(step?: number): GaugeMetric
}

export interface HistogramMetric {
	with(labels: Record<string, string>): HistogramMetric
	observe(value: number): HistogramMetric
}

export interface SummaryMetric {
	with(labels: Record<string, string>): SummaryMetric
	observe(value: number): SummaryMetric
}

export class UnsupportedOperationError extends Error {}
