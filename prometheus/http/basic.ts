import { parseAddr } from "../../utils/address.ts";
import {
  CollectedMetric,
  Collector,
  createMetric,
  defaultRegistry,
  Registry,
} from "../mod.ts";

/**
 * Create a function that collects all metrics in the registry and returns a
 * HTTP Response object with the resulting metrics in the Prometheus HTTP
 * metrics format.
 *
 * This factory function takes a registry/collector from where the metrics
 * should be resolved from. If no registry/collector is provided then the
 * default registry is used.
 *
 * @example
 * ```typescript
 * // Create HTTP handler with the default registry
 * const handler = createHandler()
 * const response = await handler()
 * ```
 * @example
 * ```typescript
 * // Create HTTP handler with a specified registry
 * const registry = createRegistry()
 * const handler = createHandler(registry)
 * const response = await handler()
 * ```
 *
 * @param registry The registry/collector from where metrics should be collected.
 * @returns A function that when called collects and returns an HTTP Response
 * object from the collected metrics.
 */
export function createHandler(registry: Collector = defaultRegistry) {
  function getMetricLabelsAsString(labels: Record<string, string>) {
    const entries = Object.entries(labels);
    return entries.length === 0
      ? ""
      : `{${entries.map(([key, value]) => `${key}="${value}"`).join(",")}}`;
  }
  const textEncoder = new TextEncoder();
  return async () => {
    const groupedMetricsByName: Record<string, CollectedMetric[]> = {};
    for await (const collectedMetric of registry.collect()) {
      if (collectedMetric.desc.type === "histogram") {
        const histogramName = collectedMetric.desc.name.replace(
          /_(?:bucket|count|sum)$/,
          "",
        );
        void (groupedMetricsByName[histogramName] ??= []).push(collectedMetric);
      } else {
        void (groupedMetricsByName[collectedMetric.desc.name] ??= []).push(
          collectedMetric,
        );
      }
    }
    const data = textEncoder.encode(
      Object.entries(groupedMetricsByName).map(([name, metrics]) => {
        let part = "";
        part += "# HELP " + name + " " + metrics[0].desc.help + "\n";
        part += "# TYPE " + name + " " + metrics[0].desc.type + "\n";
        for (const { desc, metric } of metrics) {
          part += desc.name + getMetricLabelsAsString(metric.labels) + " " +
            metric.value + "\n";
        }
        return part;
      }).join("\n"),
    );
    return new Response(data, {
      status: 200,
      statusText: "OK",
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Length": String(data.byteLength),
      },
    });
  };
}

/** The options that can be provided to the serveHTTPHandler function. */
export interface ServeMetricsOptions {
  /** The address or port from where the server should listen for connections. */
  addr?: string | number;
  /** The path the server is going to serve the Prometheus metrics from. */
  path?: string;
  /** An abort signal that can be used to close the server. */
  signal?: AbortSignal;
  /** The registry/collector that holds the metrics that should be served. */
  registry?: Collector;
}

/**
 * Start an HTTP server that only serves Prometheus metrics.
 *
 * By default the HTTP server will start on 0.0.0.0:9100 with the serving path
 * `/metrics`. These defaults can be changed with the `addr` and `path`
 * properties of the options object. The `addr` property can either take a port
 * number or an address string with the patterns: `<IPv4>:<port>`,
 * `[<IPv6>]:<port>`, `<hostname>:<port>`, `<IPv4>`, `<IPv6>`, `<hostname>`.
 *
 * This function can also take a registry/collector from where the metrics
 * should be resolved from. If no registry/collector is provided then the
 * default registry is used.
 *
 * If you would like to stop the server you can pass in an AbortSignal. When
 * it eventially changes state to aborted the server will then be closed.
 *
 * @example
 * ```typescript
 * // Serve Prometheus metrics with defaults
 * serveMetrics()
 * ```
 * @example
 * ```typescript
 * // Serve Prometheus metrics with a specified registry
 * const registry = createRegistry()
 * serveMetrics({
 *   registry: registry,
 * })
 * ```
 * @example
 * ```typescript
 * // Serve Prometheus metrics on different port and path
 * serveMetrics({
 *   addr: `:9000`,
 *   path: `/my-metrics`,
 * })
 * ```
 * @example
 * ```typescript
 * // Serve Prometheus metrics with an abort signal
 * const abortController = new AbortController()
 * serveMetrics({
 *   signal: abortController.signal,
 * })
 * setTimeout(() => abortController.abort(), 5000)
 * ```
 *
 * @param param0 The options that will be used when creating the server.
 */
export function serveMetrics(
  { addr = `:9100`, path = `/metrics`, signal, registry = defaultRegistry }:
    ServeMetricsOptions = {},
) {
  const hostname = typeof addr === "string"
    ? parseAddr(addr)?.hostname
    : undefined;
  const port = typeof addr === "string" ? parseAddr(addr)?.port : String(addr);
  const options: Deno.ListenOptions = {
    hostname: hostname === undefined || hostname === "" ? "0.0.0.0" : hostname,
    port: port === undefined || !isFinite(parseInt(port))
      ? 9100
      : parseInt(port),
  }
  void async function () {
    const handler = createHandler(registry);
    if ('serve' in Deno) {
      // @ts-ignore Does not exist before 1.25
      Deno.serve({ ...options, signal }, req => {
        const url = new URL(req.url);
        if (req.method === "GET" && url.pathname === path) {
          return handler();
        } else {
          return new Response(undefined, { status: 404 });
        }
      })
    } else {
      const server = Deno.listen(options);
      if (signal?.aborted ?? false) return;
      if (signal !== undefined) {
        signal.addEventListener("abort", () => server.close());
      }
      for await (const conn of server) {
        const httpConn = Deno.serveHttp(conn);
        for await (const req of httpConn) {
          const url = new URL(req.request.url);
          if (req.request.method === "GET" && url.pathname === path) {
            req.respondWith(handler());
          } else {
            req.respondWith(new Response(undefined, { status: 404 }));
          }
        }
      }
    }
  }();
}

export interface CreateMetricCollectorOptions {
  registry?: Registry;
  http_server_requests_seconds?: false | {
    durations?: number[];
    labels?: Record<string, string>;
  };
}

export type ReportRequest = { method: string; path: string };
export type ReportResponse = { status: number };
export type Report = {
  request: ReportRequest;
  response: ReportResponse;
};

export interface MetricsReporter {
  report(ctx: Report): void;
  report(request: Request, response: Response): void;
}

export function createMetricCollector(
  { registry = defaultRegistry, ...options }: CreateMetricCollectorOptions = {},
) {
  const http_server_requests_seconds =
    options.http_server_requests_seconds === false ? undefined : createMetric({
      type: "histogram",
      name: "http_request_duration_seconds",
      help: "request duration histogram",
      labels: {
        "method": undefined,
        "path": undefined,
        ...(isDefined(options.http_server_requests_seconds) &&
            isDefined(options.http_server_requests_seconds.labels)
          ? options.http_server_requests_seconds.labels
          : {}),
      },
      buckets: isDefined(options.http_server_requests_seconds) &&
          isDefined(options.http_server_requests_seconds.durations)
        ? options.http_server_requests_seconds.durations
        : [.5, 1, 2, 3, 5],
      registry,
    });
  return {
    createReporter(): MetricsReporter {
      const start = Date.now();
      return {
        report(...args: [Report] | [Request, Response]) {
          const end = Date.now();
          const ctx = args.length === 1 ? args[0] : {
            request: {
              method: args[0].method,
              path: new URL(args[0].url).pathname,
            },
            response: {
              status: args[1].status,
            },
          } as Report;
          http_server_requests_seconds?.with?.({
            method: ctx.request.method,
            path: ctx.request.path,
          })?.observe?.((end - start) / 1000);
        },
      };
    },
  };
}

function isDefined<T>(value: T | undefined): value is T {
  return typeof value === "object" && value !== null;
}
