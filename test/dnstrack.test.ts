import "@aws-cdk/assert/jest";
import * as cdk from "@aws-cdk/core";
import * as Dnstrack from "../lib/dnstrack-stack";

test("Empty Stack", () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Dnstrack.DNSTrackStack(app, "MyTestStack", {
    domainNames: ["redmagic.org"],
    slackWebhookURL:
      "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
  });
  // THEN
  expect(stack).toHaveResource("AWS::Lambda::Function", {
    Environment: {
      Variables: {
        SLACK_WEBHOOK_RUL:
          "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      },
    },
  });
});
