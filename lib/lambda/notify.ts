import logger from "./logger";
import * as events from "aws-lambda";
import {
  ChatPostMessageArguments,
  MrkdwnElement,
  Block,
  SectionBlock,
  DividerBlock,
} from "@slack/web-api";
import axios from "axios";
const strftime = require("strftime");

export async function main(event: any) {
  logger.info("event", event);

  const args: arguments = {
    slackWebhookURL: process.env.SLACK_WEBHOOK_URL!,
    post: axios.post,
  };

  return handler(event, args);
}

interface arguments {
  slackWebhookURL: string;
  post(url: string, data: ChatPostMessageArguments): Promise<any>;
}

export async function handler(
  event: events.DynamoDBStreamEvent,
  args: arguments
) {
  logger.info("start handler", event, args);

  const reports = event.Records.map(filterRecord).filter(
    (report) => report !== null
  ) as notifyReport[];
  logger.info("result", { reports: reports });

  if (reports.length === 0) {
    return;
  }

  const procs = reports.map(buildSlackMessage).map((msg) => {
    return args.post(args.slackWebhookURL, msg);
  });
  const postResults = await Promise.all(procs);
  logger.info("posted to slack");
}

function buildSlackMessage(report: notifyReport): ChatPostMessageArguments {
  const toField = (title: string, value: string): MrkdwnElement => {
    return { type: "mrkdwn", text: "*" + title + "*\n" + value };
  };

  interface msgParam {
    title: string;
    color: string;
  }

  const paramSet: { [key: string]: msgParam } = {
    INSERT: {
      title: "*New record is registered*",
      color: "#2EB886",
    },
    MODIFY: {
      title: "*Detect changes of registered record*",
      color: "#A30200",
    },
  };

  const param = paramSet[report.eventName];
  if (param === undefined) {
    throw new Error("Invalid event name: " + report.eventName);
  }

  let blocks: Block[] = [
    {
      type: "section",
      text: { type: "mrkdwn", text: param.title },
    } as SectionBlock,
    {
      type: "section",
      fields: [
        toField("Domain Name", report.domainName),
        toField("Record Type", report.recType),
        toField("Timestamp", strftime("%F %T%z", report.timestamp)),
      ],
    } as SectionBlock,
    {
      type: "divider",
    } as DividerBlock,
    {
      type: "section",
      text: {
        type: "mrkdwn",
        text: "*New Records*\n" + report.newData.join("\n"),
      },
    } as SectionBlock,
  ];

  if (report.oldData.length > 0) {
    blocks = blocks.concat([
      {
        type: "divider",
      } as DividerBlock,
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*Old Records*\n" + report.oldData.join("\n"),
        },
      } as SectionBlock,
    ]);
  }

  const msg: ChatPostMessageArguments = {
    channel: "",
    text: "",
    attachments: [
      {
        color: param.color,
        blocks: blocks,
      },
    ],
  };
  logger.info("built message", { message: msg });
  return msg;
}

interface notifyReport {
  eventName: string;
  oldData: string[];
  newData: string[];
  domainName: string;
  recType: string;
  timestamp: Date;
}

function filterRecord(record: events.DynamoDBRecord): notifyReport | null {
  if (!record.dynamodb || !record.dynamodb.NewImage) {
    return null;
  }

  const ts = parseInt(record.dynamodb.NewImage["timestamp"].N!);

  const report: notifyReport = {
    eventName: record.eventName || "N/A",
    domainName: record.dynamodb.NewImage["domainName"].S!,
    newData: record.dynamodb.NewImage["data"].SS!,
    oldData: [],
    recType: record.dynamodb.NewImage["recType"].S!,
    timestamp: new Date(ts * 1000),
  };

  if (record.eventName === "INSERT") {
    return report;
  } else if (record.eventName !== "MODIFY" || !record.dynamodb.OldImage) {
    return null;
  }

  report.oldData = record.dynamodb.OldImage["data"].SS!;
  report.oldData.sort();
  report.newData.sort();
  if (
    report.oldData.length === report.newData.length &&
    report.oldData.every((v, i) => v === report.newData[i])
  ) {
    return null;
  }

  return report;
}
