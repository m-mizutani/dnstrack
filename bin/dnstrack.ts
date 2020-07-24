#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { DnstrackStack } from '../lib/dnstrack-stack';

const app = new cdk.App();
new DnstrackStack(app, 'DnstrackStack');
