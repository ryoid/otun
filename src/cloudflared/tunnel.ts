/**
 * Forked from https://github.com/JacobLinCool/node-cloudflared
 *
 * Check main license for more information
 */
import { ChildProcess, spawn } from "node:child_process";
import { cloudflaredBinPath } from "./constants";
import { parseInfo } from "./parser";
import type { Connection } from "./types";

const createPromise = () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  let resolver: (value: string | PromiseLike<string>) => void = () => undefined;
  // eslint-disable-next-line unicorn/consistent-function-scoping
  let rejector: (reason: unknown) => void = () => undefined;

  const promise = new Promise<string>((resolve, reject) => {
    resolver = resolve;
    rejector = reject;
  });

  return { promise, resolve: resolver, reject: rejector };
};

/**
 *  Create a tunnel.
 * @param options The options to pass to cloudflared.
 * @returns
 */
export function startCloudflaredTunnel(
  _args: Record<string, string | number | null> = {},
  options: {
    printLogs?: boolean;
  } = {},
): {
  /** The URL of the tunnel */
  url: Promise<string>;
  /** The metrics URL of the tunnel */
  metricsUrl: Promise<string>;
  /** The location of the tunnel */
  location: Promise<string>;
  /** The IP of the tunnel */
  ip: Promise<string>;
  /** The connection ID of the tunnel */
  connection: Promise<string>;
  /** The protocol of the tunnel */
  protocol: Promise<string>;
  /** The connections of the tunnel */
  connections: Promise<Connection>[];
  /** Spwaned cloudflared process */
  child: ChildProcess;
  /** Stop the cloudflared process */
  stop: ChildProcess["kill"];
} {
  const args: string[] = ["tunnel"];
  for (const [key, value] of Object.entries(_args)) {
    if (typeof value === "string") {
      args.push(`${key}`, value);
    } else if (typeof value === "number") {
      args.push(`${key}`, value.toString());
    } else if (value === null) {
      args.push(`${key}`);
    }
  }
  if (args.length === 1) {
    args.push("--url", "127.0.0.1:3000");
  }

  const child = spawn(cloudflaredBinPath, args, {
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (options.printLogs) {
    child.stdout.pipe(process.stdout);
    child.stderr.pipe(process.stderr);
  }

  const pUrl = createPromise();
  const pMetricsServer = createPromise();
  const pLocation = createPromise();
  const pIp = createPromise();
  const pConnection = createPromise();
  const pProtocol = createPromise();

  const connectionResolvers: ((
    value: Connection | PromiseLike<Connection>,
  ) => void)[] = [];
  const connectionRejectors: ((reason: unknown) => void)[] = [];
  const connections: Promise<Connection>[] = [];
  for (let i = 0; i < 1; i++) {
    connections.push(
      new Promise<Connection>(
        (...pair) => ([connectionResolvers[i], connectionRejectors[i]] = pair),
      ),
    );
  }

  const parser = (data: Buffer) => {
    return parseInfo(data, (key, value) => {
      switch (key) {
        case "metricsServer": {
          pMetricsServer.resolve(value);
          break;
        }
        case "location": {
          pLocation.resolve(value);
          break;
        }
        case "ip": {
          pIp.resolve(value);
          break;
        }
        case "connection": {
          pConnection.resolve(value);
          break;
        }
        case "protocol": {
          pProtocol.resolve(value);
          break;
        }
        case "tunnelUrl": {
          pUrl.resolve(value);
          break;
        }
      }
    });
  };

  const onError = (err: Error) => {
    pUrl.reject(err);
    pMetricsServer.reject(err);
    pLocation.reject(err);
    pIp.reject(err);
    pConnection.reject(err);
    pProtocol.reject(err);
    for (const rejector of connectionRejectors) {
      rejector(err);
    }
  };

  child.stdout.on("data", parser).on("error", onError);
  child.stderr.on("data", parser).on("error", onError);

  const stop = () => child.kill("SIGINT");

  return {
    url: pUrl.promise,
    metricsUrl: pMetricsServer.promise,
    location: pLocation.promise,
    ip: pIp.promise,
    connection: pConnection.promise,
    protocol: pProtocol.promise,
    connections,
    child,
    stop,
  };
}
