import { parseAddr } from "../utils/address.ts";

type JSONNull = null;
type JSONNumber = number;
type JSONBoolean = boolean;
type JSONString = string;
type JSONPrimitive = JSONNumber | JSONBoolean | JSONString | JSONNull;
type JSONArray = Array<
  JSONPrimitive | JSONArray | JSONObject | JSONValueConvertable
>;
interface JSONObject {
  [key: string]: JSONPrimitive | JSONArray | JSONObject | JSONValueConvertable;
}
type JSONValue = JSONPrimitive | JSONArray | JSONObject | JSONValueConvertable;
type JSONValueConvertable = { toJSON(): JSONValue };

// deno-lint-ignore no-empty-interface
export interface Var extends JSONValueConvertable {}
export class FloatVar implements Var {
  constructor(
    private _value: number | null = null,
  ) {}
  add(delta: number) {
    this._value = (this._value ?? 0) + delta;
  }
  set(value: number) {
    this._value = value;
  }
  value() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
}
export class IntVar implements Var {
  constructor(
    private _value: number | null = null,
  ) {}
  add(delta: number) {
    this._value = (this._value ?? 0) + delta | 0;
  }
  set(value: number) {
    this._value = value | 0;
  }
  value() {
    return this._value;
  }
  toJSON() {
    return (this._value ?? 0) | 0;
  }
}
export class StringVar implements Var {
  constructor(
    private _value: string | null = null,
  ) {}
  set(value: string) {
    this._value = value;
  }
  value() {
    return this._value;
  }
  toJSON() {
    return this._value;
  }
}
export class MapVar implements Var {
  constructor(
    private map: Record<string, Var> = {},
  ) {}
  init() {
    this.map = {};
  }
  set(key: string, value: Var) {
    this.map[key] = value;
  }
  get(key: string) {
    if (key in this.map) return this.map[key];
    return null;
  }
  delete(key: string) {
    delete this.map[key];
  }
  add(key: string, value: number) {
    const v = this.map[key];
    if (v === undefined) {
      this.map[key] = new IntVar(value | 0);
    } else if (v instanceof IntVar) {
      v.add(value);
    }
  }
  addFloat(key: string, value: number) {
    const v = this.map[key];
    if (v === undefined) {
      this.map[key] = new FloatVar(value);
    } else if (v instanceof FloatVar) {
      v.add(value);
    }
  }
  forEach(action: (entry: [key: string, value: Var]) => void) {
    Object.entries(this.map).forEach((entry) => action(entry));
  }
  toJSON() {
    return this.map;
  }
}

const store: Record<string, Var> = {};

export function forEach(action: (entry: [key: string, value: Var]) => void) {
  Object.entries(store).forEach((entry) => action(entry));
}

export class NameReuseError extends Error {}

export function publish(name: string, value: Var) {
  if (name in store) {
    throw new NameReuseError("Reuse of exported var name: " + name);
  }
	store[name] = value
}

function createAndPublish<T extends Var>(name: string, ctor: { new(): T }) {
	const item = new ctor()
	publish(name, item)
	return item
}

export function createString(name: string): StringVar {
  return createAndPublish(name, StringVar);
}

export function createInt(name: string): IntVar {
  return createAndPublish(name, IntVar);
}

export function createFloat(name: string): FloatVar {
  return createAndPublish(name, FloatVar);
}

export function createMap(name: string): MapVar {
  return createAndPublish(name, MapVar);
}

/**
 * Create a function that collects all values and returns a HTTP Response
 * object with the resulting JSON string.
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
 *
 * @returns A function that when called collects and returns an HTTP Response
 * object from the collected metrics.
 */
export function createHandler() {
  const textEncoder = new TextEncoder();
  return () => {
		const data = textEncoder.encode(JSON.stringify(store))
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
}

/**
 * Start an HTTP server that only serves expvar.
 *
 * By default the HTTP server will start on 0.0.0.0:6785 with the serving path
 * `/debug/vars`. These defaults can be changed with the `addr` and `path`
 * properties of the options object. The `addr` property can either take a port
 * number or an address string with the patterns: `<IPv4>:<port>`,
 * `[<IPv6>]:<port>`, `<hostname>:<port>`, `<IPv4>`, `<IPv6>`, `<hostname>`.
 *
 * If you would like to stop the server you can pass in an AbortSignal. When
 * it eventially changes state to aborted the server will then be closed.
 *
 * @example
 * ```typescript
 * // Serve expvar with defaults
 * serveVariables()
 * ```
 * @example
 * ```typescript
 * // Serve expvar on different port and path
 * serveVariables({
 *   addr: `:6060`,
 *   path: `/debug/my-vars`,
 * })
 * ```
 * @example
 * ```typescript
 * // Serve expvar with an abort signal
 * const abortController = new AbortController()
 * serveVariables({
 *   signal: abortController.signal,
 * })
 * setTimeout(() => abortController.abort(), 5000)
 * ```
 *
 * @param param0 The options that will be used when creating the server.
 */
export function serveVariables(
  { addr = `:6785`, path = `/debug/vars`, signal }:
    ServeMetricsOptions = {},
) {
  const hostname = typeof addr === "string"
    ? parseAddr(addr)?.hostname
    : undefined;
  const port = typeof addr === "string" ? parseAddr(addr)?.port : String(addr);
  const server = Deno.listen({
    transport: "tcp",
    hostname: hostname === undefined || hostname === "" ? "0.0.0.0" : hostname,
    port: port === undefined || !isFinite(parseInt(port))
      ? 9100
      : parseInt(port),
  });
  if (signal?.aborted ?? false) return;
  if (signal !== undefined) {
    signal.addEventListener("abort", () => server.close());
  }
  void async function () {
    const handler = createHandler();

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
  }();
}