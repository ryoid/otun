import { existsSync } from "node:fs";
import { defineCommand, runMain as _runMain } from "citty";
import { consola } from "consola";
import { colors } from "consola/utils";
import { renderUnicodeCompact as renderQRCode } from "uqr";
import {
  installCloudflared,
  startCloudflaredTunnel,
  cloudflaredBinPath,
  cloudflaredNotice,
} from "./cloudflared";

const main = defineCommand({
  meta: {
    name: "otun",
    version: "0.0.1",
    description:
      "CLI to expose your local HTTP(s) server to the internet. Powered by Cloudflare Quick Tunnels.",
  },
  args: {
    protocol: {
      type: "positional",
      description: "Protocol (default: http)",
      valueHint: "http|https",
      default: "http",
      required: true,
    },
    port: {
      type: "positional",
      description: "Port (default: 3000)",
      valueHint: "3000|8080",
      default: "3000",
      required: true,
    },
    hostname: {
      description: "Hostname (default: 127.0.0.1)",
      valueHint: "127.0.0.1|localhost",
      default: "127.0.0.1",
      required: true,
      shortcut: "host",
    },
    verifyTLS: {
      description: "Verify TLS (default: false)",
      valueHint: "true|false",
      default: "false",
      required: false,
      shortcut: "verify-tls",
    },
    logs: {
      description: "Logs (default: false)",
      valueHint: "true|false",
      default: "false",
      required: false,
    },
  },
  async run({ args }) {
    const localUrl = `${args.protocol}://${args.hostname}:${args.port}`;

    consola.start(`Starting cloudflared tunnel to ${localUrl}`);

    if (!existsSync(cloudflaredBinPath)) {
      consola.log(cloudflaredNotice);
      const canInstall = await consola.prompt(
        `Do you agree with the above terms and wish to install the binary from GitHub?`,
        {
          type: "confirm",
        },
      );
      if (!canInstall) {
        consola.fail("Skipping tunnel setup.");
        return;
      }
      await installCloudflared();
    }

    const options = Object.fromEntries(
      [
        ["--url", localUrl],
        args.verifyTLS ? undefined : ["--no-tls-verify", ""],
      ].filter(Boolean) as [string, string][],
    );

    const tunnel = startCloudflaredTunnel(options);

    if (!tunnel) {
      consola.error("Failed to start cloudflare tunnel.");
      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }

    function close() {
      if (tunnel) {
        tunnel.stop();
      }
    }

    const tunnelUrl = await tunnel.url;

    consola.success(
      "Ready at " +
        colors.underline(colors.cyan(tunnelUrl)) +
        colors.gray(` [location: ${await tunnel.location}]`),
    );

    const space = " ".repeat(2);
    const lines = renderQRCode(tunnelUrl)
      .split("\n")
      .map((line) => space + line)
      .join("\n");
    console.log("\n" + lines);

    process.on("exit", () => close());
  },
});

export const runMain = () => _runMain(main);
