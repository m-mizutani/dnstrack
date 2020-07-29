import logger from "./logger";
import { trackRecord, repository, dynamoRepository } from "./dynamodb";
import { resolveNs } from "dns";

export async function main() {
  const args: arguments = {
    domainNames: process.env.DOMAIN_NAMES!.split(","),
    repo: new dynamoRepository(process.env.TABLE_NAME!),
  };

  return handler(args);
}

export interface arguments {
  domainNames: Array<string>;
  repo: repository;
}

export async function handler(args: arguments) {
  logger.info("start handler", args);

  const procs = args.domainNames.map(
    (domainName): Promise<trackRecord> => {
      return new Promise((resolve, reject) => {
        resolveNs(domainName, (err, addresses: string[]) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              domainName: domainName,
              recType: "NS",
              data: new Set(addresses),
              timestamp: nowUTC().getTime() / 1000,
            });
          }
        });
      });
    }
  );

  const dnsResults = await Promise.all(procs);
  logger.info("dns lookup results", { result: dnsResults });

  const repoResult = await args.repo.putRecord(dnsResults);
  logger.info("db put results", { result: repoResult });

  return "ok";
}

function nowUTC(): Date {
  const dt = new Date();
  const utc = Date.UTC(
    dt.getUTCFullYear(),
    dt.getUTCMonth(),
    dt.getUTCDate(),
    dt.getUTCHours(),
    dt.getUTCMinutes(),
    dt.getUTCSeconds()
  );
  return new Date(utc);
}
