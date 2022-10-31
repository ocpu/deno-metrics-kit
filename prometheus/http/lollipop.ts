import { Collector, defaultRegistry } from "../mod.ts";
import {
  createHandler as createBasicHandler,
  createMetricCollector as createBasicMetricCollector,
  CreateMetricCollectorOptions,
} from "./basic.ts";
import {
  ApplicationMiddleware,
  RouteHandler,
} from "https://raw.githubusercontent.com/ocpu/lollipop/0.0.0/mod.ts";

export function createHandler(
  { registry = defaultRegistry, path = "/metrics" }: {
    registry?: Collector;
    path?: string;
  } = {},
): ApplicationMiddleware {
  const handler = createBasicHandler(registry);
  return async (ctx) => {
    if (ctx.request.method !== "GET" || ctx.request.url.pathname !== path) {
      return ctx.next();
    }
    const res = await handler();
    res.headers.forEach((value, key) =>
      ctx.response.headers.append(key, value)
    );
    ctx.response.status = res.status;
    ctx.response.body = res.body;
  };
}

export function createRouterHandler(
  registry: Collector = defaultRegistry,
): RouteHandler {
  const handler = createBasicHandler(registry);
  return async (ctx) => {
    const res = await handler();
    res.headers.forEach((value, key) =>
      ctx.response.headers.append(key, value)
    );
    ctx.response.status = res.status;
    ctx.response.body = res.body;
  };
}

export function createMetricCollector(
  options: CreateMetricCollectorOptions = {},
): ApplicationMiddleware {
  const collector = createBasicMetricCollector(options);
  return async (ctx) => {
    const reporter = collector.createReporter();
    await ctx.next();
    reporter.report({
      request: {
        method: ctx.request.original.method,
        path: ctx.request.url.pathname,
      },
      response: ctx.response,
    });
  };
}
