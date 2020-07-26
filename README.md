# DNS Track

`dnstrack` monitors DNS record (currently NS record) of your domain name and notifies to Slack when detecting changes. The tool helps to prevent/mitigate security damage by domain name hijacking.

# How to use

## Prerequisites

### CDK tools

See official getting started page. https://docs.aws.amazon.com/cdk/latest/guide/getting_started.html. Please install CDK tools.

### Slack Incoming Webhook URL

See https://api.slack.com/messaging/webhooks to create your Incoming Webhook URL. You can get URL like this:

```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX
```

## case A) Deploy with environment variables

```bash
% git clone https://github.com/m-mizutani/dnstrack.git
% cd dnstrack
% npm install && npm run build
% env DNSTRACK_DOMAIN_NAMES=example.com,example.org \
    DNSTRACK_SLACK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX \
    cdk deploy
```

## case B) Deploy with your CDK construct

### 1. Create your new CDK project

```bash
$ mkdir your-cdk-app
$ cd your-cdk-app
$ cdk init --language typescript
```

### 2. Install Uguisu module

```bash
$ npm install uguisu
```

### 3. Write your construct

Put construct code to `bin/your-cdk-app.ts` like following. Please replace `domainNames` and `slackWebhookURL`.

```ts
#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "@aws-cdk/core";
import { DNSTrackStack } from "../lib/dnstrack-stack";

const app = new cdk.App();
new DNSTrackStack(app, "DNSTrackStack", {
  domainNames: ["example.com", "example.org"],
  slackWebhookURL: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
});

```

## 4. Deploy your construct

```bash
$ npm run build
$ cdk deploy
```

# License

MIT License