import { Collector, defaultRegistry } from "../mod.ts";
import {
  createHandler as createBasicHandler,
  createMetricCollector as createBasicMetricCollector,
  CreateMetricCollectorOptions,
} from "./basic.ts";
import {
  Middleware,
  RouterMiddleware,
} from "https://deno.land/x/oak@v10.6.0/mod.ts";

export function createHandler(
  { registry = defaultRegistry, path = "/metrics" }: {
    registry?: Collector;
    path?: string;
  } = {},
): Middleware {
  const handler = createBasicHandler(registry);
  return async (ctx, next) => {
    if (ctx.request.method !== "GET" || ctx.request.url.pathname !== path) {
      return next();
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
): RouterMiddleware<string> {
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
): Middleware {
  const collector = createBasicMetricCollector(options)
  return async (ctx, next) => {
    const reporter = collector.createReporter()
    await next();
    reporter.report({
      request: {
        method: ctx.request.method,
        path: ctx.request.url.pathname,
      },
      response: {
        status: ctx.response.status,
      }
    })
  };
}
