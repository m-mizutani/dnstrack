#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { DNSTrackStack } from "../lib/dnstrack-stack";

const app = new cdk.App();
new DNSTrackStack(app, "DNSTrackStack", {
  domainNames: process.env.DNSTRACK_DOMAIN_NAMES!.split(","),
  slackWebhookURL: process.env.DNSTRACK_SLACK_URL!,
});
