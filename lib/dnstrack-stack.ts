import * as cdk from "@aws-cdk/core";
import * as dynamodb from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as events from "@aws-cdk/aws-events";
import * as eventsTargets from "@aws-cdk/aws-events-targets";
import { DynamoEventSource } from "@aws-cdk/aws-lambda-event-sources";
import { NodejsFunction } from "@aws-cdk/aws-lambda-nodejs";

import * as path from "path";

export interface properties extends cdk.StackProps {
  domainNames: Array<string>;
  slackWebhookURL: string;
}

export class DNSTrackStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props: properties) {
    super(scope, id, props);

    const cacheTable = new dynamodb.Table(this, "cacheTable", {
      partitionKey: { name: "pk", type: dynamodb.AttributeType.STRING },
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
    });

    const lambdaQuery = new NodejsFunction(this, "query", {
      entry: path.join(__dirname, "lambda/query.js"),
      handler: "main",
      timeout: cdk.Duration.seconds(60),
      memorySize: 128,
      environment: {
        TABLE_NAME: cacheTable.tableName,
        DOMAIN_NAMES: props.domainNames.join(","),
      },
    });

    cacheTable.grantFullAccess(lambdaQuery);

    new NodejsFunction(this, "notify", {
      entry: path.join(__dirname, "lambda/notify.js"),
      handler: "main",
      timeout: cdk.Duration.seconds(60),
      memorySize: 128,
      environment: {
        SLACK_WEBHOOK_URL: props.slackWebhookURL,
      },
      events: [
        new DynamoEventSource(cacheTable, {
          startingPosition: lambda.StartingPosition.LATEST,
          batchSize: 10,
        }),
      ],
    });

    new events.Rule(this, "periodicQuery", {
      schedule: events.Schedule.rate(cdk.Duration.minutes(10)),
      targets: [new eventsTargets.LambdaFunction(lambdaQuery)],
    });
  }
}
