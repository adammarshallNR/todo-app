import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { trace, context } from '@opentelemetry/api';
import { W3CTraceContextPropagator } from '@opentelemetry/core';

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    'service.name': process.env.SERVICE_NAME || 'playwright-e2e',
    'ci.pipeline': process.env.GITHUB_WORKFLOW,
    'ci.job.id': process.env.GITHUB_RUN_ID,
    'ci.commit': process.env.GITHUB_SHA,
    'env.tag': process.env.ENV_TAG || 'dev', // dev, tst, pr, pprd
    'squad.owner': process.env.SQUAD_OWNER || 'unassigned'
  }),
  // Send traces directly to New Relic's OTLP endpoint
  traceExporter: new OTLPTraceExporter({
    url: 'https://otlp.nr-data.net/v1/traces', // Use otlp.eu01.nr-data.net for EU accounts
    headers: {
      'api-key': process.env.NEW_RELIC_LICENSE_KEY
    }
  })
});

export default async function globalSetup() {
  sdk.start();

  const tracer = trace.getTracer('playwright-e2e');
  const rootSpan = tracer.startSpan('playwright-test-suite');

  // Propagate trace context so the reporter's per-test spans attach as children
  const carrier: Record<string, string> = {};
  new W3CTraceContextPropagator().inject(
    trace.setSpan(context.active(), rootSpan),
    carrier,
    { set: (c, k, v) => { c[k] = v; } }
  );
  process.env.TRACEPARENT = carrier['traceparent'];

  return async () => {
    rootSpan.end();
    await sdk.shutdown();
  };
}
