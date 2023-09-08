import { expect, it, describe } from "vitest";
import { parseInfo, InfoDataKey } from "../src/cloudflared/parser";

const LOGS = `
2023-09-08T23:30:08Z INF Thank you for trying Cloudflare Tunnel. Doing so, without a Cloudflare account, is a quick way to experiment and try it out. However, be aware that these account-less Tunnels have no uptime guarantee. If you intend to use Tunnels in production you should use a pre-created named tunnel by following: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps
2023-09-08T23:30:08Z INF Requesting new quick Tunnel on trycloudflare.com...

2023-09-08T23:30:11Z INF +--------------------------------------------------------------------------------------------+
2023-09-08T23:30:11Z INF |  Your quick Tunnel has been created! Visit it at (it may take some time to be reachable):  |
2023-09-08T23:30:11Z INF |  https://demo-demo-alpha-carlos.trycloudflare.com                                    |
2023-09-08T23:30:11Z INF +--------------------------------------------------------------------------------------------+

2023-09-08T23:30:11Z INF Cannot determine default configuration path. No file [config.yml config.yaml] in [~/.cloudflared ~/.cloudflare-warp ~/cloudflare-warp /etc/cloudflared /usr/local/etc/cloudflared]
2023-09-08T23:30:11Z INF Version 2023.8.2
2023-09-08T23:30:11Z INF GOOS: linux, GOVersion: go1.20.6, GoArch: amd64

2023-09-08T23:30:11Z INF Settings: map[ha-connections:1 protocol:quic url:http://127.0.0.1:3000]

2023-09-08T23:30:11Z INF Autoupdate frequency is set autoupdateFreq=86400000

2023-09-08T23:30:11Z INF Generated Connector ID: 81522d73-fc4c-fc4c-fc4c-101593055067

2023-09-08T23:30:11Z INF Initial protocol quic

2023-09-08T23:30:11Z INF ICMP proxy will use 192.168.168.182 as source for IPv4

2023-09-08T23:30:11Z INF ICMP proxy will use fe80::fe80:fe80:fe80:fe80 in zone eth0 as source for IPv6

2023-09-08T23:30:11Z INF Starting metrics server on 127.0.0.1:41561/metrics

2023/09/09 07:30:11 failed to sufficiently increase receive buffer size (was: 208 kiB, wanted: 2048 kiB, got: 416 kiB). See https://github.com/quic-go/quic-go/wiki/UDP-Receive-Buffer-Size for details.

2023-09-08T23:30:11Z INF Registered tunnel connection connIndex=0 connection=0209e189-d719-d719-d719-e38db6cd74df event=0 ip=198.41.200.233 location=sin11 protocol=quic
`;

describe("uton", () => {
  it.todo("pass", () => {
    const kvs: Partial<Record<InfoDataKey, string>> = {};
    parseInfo(Buffer.from(LOGS), (key, value) => {
      kvs[key] = value;
    });
    expect(kvs.tunnelUrl).toBe(
      "https://demo-powerpoint-alpha-carlos.trycloudflare.com",
    );
    expect(kvs.metricsServer).toBe("127.0.0.1:41561/metrics");
    expect(kvs.autoupdateFreq).toBe("86400000");
    expect(kvs.connIndex).toBe("0");
    expect(kvs.connection).toBe("0209e189-d719-40f8-9189-e38db6cd74df");
    expect(kvs.event).toBe("0");
    expect(kvs.ip).toBe("198.41.200.233");
    expect(kvs.location).toBe("sin11");
    expect(kvs.protocol).toBe("quic");
  });
});
