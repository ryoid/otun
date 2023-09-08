// eslint-disable-next-line unicorn/better-regex
const LOG_INFO_REGEX =
  /(\d{4}(?:[/-]\d{2}){2}[\sT](?:\d{2}:){2}\d{2}Z?)\s+(INF)/;
export const isInfoLog = (str: string) => str.match(LOG_INFO_REGEX);

const LOG_INFO_METRICS_REGEX = /Starting metrics server on (\S+\/metrics)/;
const LOG_INFO_KV_REGEX = /\s(\w+)=(\S+)/g;
const LOG_INFO_TUNNEL_URL_REGEX = /INF \|\s+(https?:\/\/\S+)\s+\|/;

export type InfoDataKey =
  | "metricsServer"
  | "autoupdateFreq"
  | "connIndex"
  | "connection"
  | "event"
  | "ip"
  | "location"
  | "protocol"
  | "tunnelUrl"
  // eslint-disable-next-line @typescript-eslint/ban-types
  | (string & {});

export function parseInfo(
  data: Buffer,
  onData: (key: InfoDataKey, value: string) => void,
) {
  const str = data.toString();
  const log = isInfoLog(str);
  console.log("log", log);
  if (!log) {
    return;
  }
  const metrics = str.match(LOG_INFO_METRICS_REGEX);
  if (metrics) {
    onData("metricsServer", log[1]);
  }
  const kv = str.matchAll(LOG_INFO_KV_REGEX);
  for (const match of kv) {
    onData(match[1] as InfoDataKey, match[2]);
  }
  const tunnelUrl = str.match(LOG_INFO_TUNNEL_URL_REGEX);
  if (tunnelUrl) {
    onData("tunnelUrl", tunnelUrl[1]);
  }
}
