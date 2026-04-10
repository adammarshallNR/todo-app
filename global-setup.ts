import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node';

const exporter = new OTLPTraceExporter({
  url: 'https://otlp.eu01.nr-data.net/v1/traces', //Use otlp.nr-data.net for US accounts
  headers: {
    'api-key': process.env.NEW_RELIC_LICENSE_KEY
  }
});

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': process.env.SERVICE_NAME || 'playwright-e2e',
    'ci.pipeline': process.env.GITHUB_WORKFLOW,
    'ci.job.id': process.env.GITHUB_RUN_ID,
    'ci.commit': process.env.GITHUB_SHA,
    'env.tag': process.env.ENV_TAG || 'dev', // dev, tst, pr, pprd
    'squad.owner': process.env.SQUAD_OWNER || 'unassigned'
  }),
  // Disable auto-export so all spans are held until sdk.shutdown() flushes them
  // together — prevents test spans arriving at New Relic before the suite span
  spanProcessors: [new BatchSpanProcessor(exporter, {
    scheduledDelayMillis: 60 * 60 * 1000, // effectively never auto-export
    maxExportBatchSize: 10000,
  })]
});

export default async function globalSetup() {
  sdk.start();
  return async () => {
    await sdk.shutdown();
  };
}
