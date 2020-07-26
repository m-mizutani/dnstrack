#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { DNSTrackStack } from "../lib/dnstrack-stack";

const stackName = process.env.DNSTRACK_STACK_NAME || "dnstrack";
const app = new cdk.App();
new DNSTrackStack(app, stackName, {
  domainNames: process.env.DNSTRACK_DOMAIN_NAMES!.split(","),
  slackWebhookURL: process.env.DNSTRACK_SLACK_URL!,
});
